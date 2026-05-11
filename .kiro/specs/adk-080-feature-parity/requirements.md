# Requirements Document

## Introduction

ADK Studio v0.8.0 feature parity brings the visual IDE's generated code and UI capabilities in line with the full ADK-Rust 0.8.0 API surface. This covers five work streams: generated code quality (Runner::builder, ToolExecutionStrategy, checkpointing, compaction, read-only tools), agent properties panel extensions (timeouts, retries, circuit breakers, tool confirmation, execution strategy), model-specific configuration (Anthropic extended thinking/caching, OpenAI reasoning effort), OpenRouter integration as a new provider, and router agent upgrade to LlmConditionalAgent plus skills support.

## Glossary

- **Codegen_Engine**: The Rust module (`src/codegen/mod.rs`) that transforms a ProjectSchema into compilable Rust source code
- **Agent_Properties_Panel**: The React right-sidebar panel that displays and edits configuration for a selected agent node
- **Model_Selector**: The UI component for choosing a provider and model, including model-specific options
- **ProjectSchema**: The root data structure representing an entire ADK Studio project (agents, tools, workflow, settings)
- **AgentSchema**: The data structure representing a single agent's configuration within a project
- **ProjectSettings**: Project-level configuration (build options, checkpointing, skills directory)
- **Runner_Builder**: The ADK-Rust 0.8.0 typestate pattern for constructing a Runner instance via `Runner::builder()`
- **ToolExecutionStrategy**: An enum controlling how tools execute — Sequential, Parallel, or Auto (read-only tools run concurrently)
- **SqliteCheckpointer**: An ADK-Rust component that persists graph execution state to SQLite for crash recovery
- **Context_Compaction**: A feature that summarizes older conversation events to keep LLM context bounded
- **LlmConditionalAgent**: An ADK-Rust 0.8.0 agent type that routes requests to sub-agents based on LLM-evaluated conditions
- **OpenRouter**: A model aggregation provider offering 400+ models via a unified API
- **Skills**: Instruction snippets loaded from a directory and injected into agent prompts based on relevance
- **Provider_Detection**: The function (`detect_provider()` in Rust, `detectProviderFromModel()` in TypeScript) that determines which LLM provider a model ID belongs to

## Requirements

### Requirement 1: Runner Builder Code Generation

**User Story:** As a developer using ADK Studio, I want the generated code to use the modern `Runner::builder()` typestate pattern, so that my production code follows ADK-Rust 0.8.0 best practices and is more readable.

#### Acceptance Criteria

1. WHEN the Codegen_Engine generates runner initialization code, THE Codegen_Engine SHALL emit `Runner::builder(app_name, agent, session_service)` followed by chained method calls instead of `Runner::new(RunnerConfig { ... })`
2. WHEN a project has `sqlite_checkpointer` enabled in ProjectSettings, THE Codegen_Engine SHALL include `.checkpointer(SqliteCheckpointer::new("./checkpoints.db").await?)` in the builder chain
3. WHEN a project has `context_compaction` enabled in ProjectSettings, THE Codegen_Engine SHALL include `.compaction_config(CompactionConfig::default())` in the builder chain
4. THE Codegen_Engine SHALL terminate the builder chain with `.build()?` producing a valid Runner instance

### Requirement 2: Tool Execution Strategy

**User Story:** As a developer, I want to configure how tools execute (sequentially, in parallel, or automatically), so that I can optimize agent performance for my specific use case.

#### Acceptance Criteria

1. WHEN an agent's `tool_execution_strategy` is not set or set to "auto", THE Codegen_Engine SHALL generate code using `ToolExecutionStrategy::Auto`
2. WHEN an agent's `tool_execution_strategy` is set to "sequential", THE Codegen_Engine SHALL generate code using `ToolExecutionStrategy::Sequential`
3. WHEN an agent's `tool_execution_strategy` is set to "parallel", THE Codegen_Engine SHALL generate code using `ToolExecutionStrategy::Parallel`
4. WHEN an agent's `tool_execution_strategy` contains an invalid value, THE Codegen_Engine SHALL fall back to `ToolExecutionStrategy::Auto` and emit a warning comment in the generated code

### Requirement 3: Read-Only Tool Marking

**User Story:** As a developer, I want search and retrieval tools automatically marked as read-only in generated code, so that the Auto execution strategy can safely run them concurrently.

#### Acceptance Criteria

1. WHEN the Codegen_Engine generates code containing `GoogleSearchTool`, THE Codegen_Engine SHALL append `.read_only(true)` to the tool construction
2. WHEN the Codegen_Engine generates code containing `LoadArtifactsTool`, THE Codegen_Engine SHALL append `.read_only(true)` to the tool construction
3. THE read-only marking SHALL be applied regardless of the configured tool_execution_strategy

### Requirement 4: Agent Properties Panel — Resilience Configuration

**User Story:** As a developer, I want to configure tool timeouts, max iterations, retry budgets, and circuit breakers from the agent properties panel, so that I can make my agents resilient without editing code manually.

#### Acceptance Criteria

1. WHEN an LLM agent node is selected, THE Agent_Properties_Panel SHALL display a "Resilience & Execution" section with fields for tool timeout, max iterations, retry budget, and circuit breaker threshold
2. WHEN a user sets `tool_timeout_secs` to a positive integer, THE Codegen_Engine SHALL generate `.tool_timeout(Duration::from_secs({value}))` in the agent builder
3. WHEN a user sets `max_llm_iterations` to a positive integer, THE Codegen_Engine SHALL generate `.max_iterations({value})` in the agent builder
4. WHEN a user sets `tool_retry_budget` to a value between 1 and 5, THE Codegen_Engine SHALL generate `.tool_retry_budget({value})` in the agent builder
5. WHEN a user sets `circuit_breaker_threshold` to a positive integer, THE Codegen_Engine SHALL generate `.circuit_breaker_threshold({value})` in the agent builder
6. WHEN resilience fields are left empty (None), THE Codegen_Engine SHALL omit the corresponding builder method calls

### Requirement 5: Tool Confirmation

**User Story:** As a developer, I want to mark specific tools as requiring human confirmation before execution, so that sensitive operations have a human-in-the-loop safety gate.

#### Acceptance Criteria

1. WHEN an LLM agent node is selected, THE Agent_Properties_Panel SHALL display a "Tool Confirmation" section listing all tools assigned to that agent with checkboxes
2. WHEN a tool is checked in the confirmation list, THE AgentSchema SHALL store that tool name in the `tools_requiring_confirmation` array
3. WHEN a tool is in `tools_requiring_confirmation`, THE Codegen_Engine SHALL generate `.with_confirmation(true)` on that tool's builder call in the generated code
4. WHEN no tools require confirmation, THE Codegen_Engine SHALL omit confirmation-related code

### Requirement 6: Tool Execution Strategy UI

**User Story:** As a developer, I want a dropdown in the agent properties panel to select the tool execution strategy, so that I can control concurrency behavior visually.

#### Acceptance Criteria

1. WHEN an LLM agent node is selected, THE Agent_Properties_Panel SHALL display a "Tool Execution Strategy" dropdown with options: "Auto (concurrent read-only)", "Sequential", and "Parallel"
2. WHEN the user selects a strategy, THE AgentSchema SHALL store the value as "auto", "sequential", or "parallel" in the `tool_execution_strategy` field
3. THE dropdown SHALL default to "Auto (concurrent read-only)" when no value is stored

### Requirement 7: Anthropic Extended Thinking Configuration

**User Story:** As a developer using Anthropic models, I want to enable extended thinking with a configurable token budget, so that my agent can perform deeper reasoning on complex tasks.

#### Acceptance Criteria

1. WHEN an Anthropic model is selected in the Model_Selector, THE Model_Selector SHALL display an "Extended Thinking" toggle and a "Thinking Budget" slider
2. WHEN `extended_thinking` is enabled, THE Codegen_Engine SHALL generate `.with_extended_thinking(true)` on the AnthropicConfig builder
3. WHEN `thinking_budget_tokens` is set (range 1024-32768), THE Codegen_Engine SHALL generate `.with_thinking_budget({value})` on the AnthropicConfig builder
4. WHEN a non-Anthropic model is selected, THE Codegen_Engine SHALL ignore `extended_thinking` and `thinking_budget_tokens` fields even if they contain values
5. WHEN the model is switched away from Anthropic, THE Model_Selector SHALL hide the extended thinking controls but preserve the stored values

### Requirement 8: Anthropic Prompt Caching

**User Story:** As a developer using Anthropic models, I want to enable prompt caching, so that repeated instruction prefixes are cached and reduce latency and cost.

#### Acceptance Criteria

1. WHEN an Anthropic model is selected, THE Model_Selector SHALL display a "Prompt Caching" toggle
2. WHEN `prompt_caching` is enabled, THE Codegen_Engine SHALL generate `.with_prompt_caching(true)` on the AnthropicConfig builder
3. WHEN a non-Anthropic model is selected, THE Codegen_Engine SHALL ignore the `prompt_caching` field

### Requirement 9: OpenAI Reasoning Effort Configuration

**User Story:** As a developer using OpenAI o-series models, I want to configure reasoning effort level, so that I can balance accuracy against speed and cost.

#### Acceptance Criteria

1. WHEN an OpenAI o-series model (o1, o3, o4-mini) is selected in the Model_Selector, THE Model_Selector SHALL display a "Reasoning Effort" radio group with options: Low, Medium, High
2. WHEN `reasoning_effort` is set, THE Codegen_Engine SHALL generate `.with_reasoning_effort(ReasoningEffort::{Value})` on the OpenAI model config
3. WHEN a non-o-series OpenAI model is selected, THE Model_Selector SHALL hide the reasoning effort controls
4. WHEN a non-OpenAI model is selected, THE Codegen_Engine SHALL ignore the `reasoning_effort` field

### Requirement 10: OpenRouter Provider Integration

**User Story:** As a developer, I want to use OpenRouter as a model provider in ADK Studio, so that I can access 400+ models through a single API key and unified interface.

#### Acceptance Criteria

1. THE Model_Selector SHALL include "OpenRouter" as a selectable provider in the provider dropdown
2. WHEN OpenRouter is selected as provider, THE Model_Selector SHALL display a text input for entering a model ID instead of a fixed model dropdown
3. WHEN OpenRouter is selected, THE Model_Selector SHALL display an optional "Browse models" button
4. WHEN the user enters an OpenRouter model ID, THE AgentSchema SHALL store the full model ID (e.g., "anthropic/claude-sonnet-4-6") in the `model` field
5. WHEN the Codegen_Engine detects an OpenRouter model, THE Codegen_Engine SHALL generate `OpenRouterClient::new(OpenRouterConfig::new(&api_key, "{model_id}"))` code
6. WHEN an OpenRouter model is used, THE Codegen_Engine SHALL add `features = ["openrouter"]` to the generated Cargo.toml's adk-model dependency

### Requirement 11: OpenRouter Provider Detection

**User Story:** As a developer, I want the system to correctly identify OpenRouter model IDs, so that the right client code is generated without manual provider selection.

#### Acceptance Criteria

1. WHEN a model ID contains "/" and does not match known provider patterns (Fireworks, Together, Groq, Meta-Llama, Qwen), THE Provider_Detection SHALL classify it as "openrouter"
2. WHEN a model ID matches a known provider's slash pattern (e.g., "accounts/fireworks/", "meta-llama/", "Qwen/"), THE Provider_Detection SHALL classify it under that provider instead of OpenRouter
3. THE Provider_Detection SHALL produce identical results in both the Rust `detect_provider()` function and the TypeScript `detectProviderFromModel()` function for the same input

### Requirement 12: Router Agent Upgrade to LlmConditionalAgent

**User Story:** As a developer, I want router agents to generate `LlmConditionalAgent` code instead of manual routing logic, so that my routing code is cleaner and leverages ADK-Rust 0.8.0's built-in conditional routing.

#### Acceptance Criteria

1. WHEN the Codegen_Engine generates code for a router agent, THE Codegen_Engine SHALL use `LlmConditionalAgent::builder()` instead of manual match/routing logic
2. WHEN a router agent has routes defined, THE Codegen_Engine SHALL emit `.condition("{condition}", {target_agent})` for each route in the routes list
3. THE generated LlmConditionalAgent code SHALL include the router agent's model and instruction configuration
4. THE router node UI on the canvas SHALL remain unchanged — the improvement is purely in generated code output

### Requirement 13: Skills Support

**User Story:** As a developer, I want to configure a skills directory and enable auto-skills for my agents, so that relevant instruction snippets are automatically injected based on task context.

#### Acceptance Criteria

1. WHEN `auto_skills` is enabled on an AgentSchema, THE Codegen_Engine SHALL generate `.with_auto_skills()` on the agent builder
2. WHEN `skills_directory` is set in ProjectSettings, THE Codegen_Engine SHALL generate `.with_skills_from_root("{path}")` on agent builders that have skills enabled
3. THE Project Settings UI SHALL display a "Skills Directory" text input in the Production section
4. WHEN `skills_directory` is set, THE Codegen_Engine SHALL validate it is a relative path (not starting with "/" or containing "..")

### Requirement 14: Schema Backward Compatibility

**User Story:** As a developer with existing ADK Studio projects, I want my projects to load without error after the upgrade, so that I don't lose work or need to manually migrate.

#### Acceptance Criteria

1. WHEN a project saved with the previous schema version (without new fields) is loaded, THE ProjectSchema deserialization SHALL succeed with all new fields set to their default values (None or empty)
2. THE new AgentSchema fields SHALL use `Option<T>` with `#[serde(default, skip_serializing_if = "Option::is_none")]` for backward compatibility
3. THE new ProjectSettings fields SHALL use `Option<T>` with `#[serde(default)]` for backward compatibility
4. WHEN a project with new fields is saved and reloaded, THE round-trip serialization SHALL preserve all field values exactly

### Requirement 15: Generated Cargo.toml Correctness

**User Story:** As a developer, I want the generated Cargo.toml to include exactly the right dependencies and feature flags for my project's configuration, so that the generated code compiles without manual edits.

#### Acceptance Criteria

1. WHEN a project uses an OpenRouter model, THE Codegen_Engine SHALL include `features = ["openrouter"]` in the adk-model dependency
2. WHEN a project has `sqlite_checkpointer` enabled, THE Codegen_Engine SHALL include `adk-checkpointer-sqlite = "0.8.0"` as a dependency
3. THE Codegen_Engine SHALL include only the feature flags required by the models actually used in the project
4. THE generated Cargo.toml SHALL target adk-rust version 0.8.0 for all adk crates

### Requirement 16: Conditional UI Rendering

**User Story:** As a developer, I want model-specific configuration options to appear only when the relevant provider/model is selected, so that the UI stays clean and contextual.

#### Acceptance Criteria

1. WHEN an Anthropic model is selected, THE Model_Selector SHALL show extended thinking, thinking budget, and prompt caching controls
2. WHEN an OpenAI o-series model is selected, THE Model_Selector SHALL show the reasoning effort control
3. WHEN OpenRouter is selected, THE Model_Selector SHALL show the model ID text input and browse button
4. WHEN a provider without model-specific options is selected, THE Model_Selector SHALL hide all model-specific controls
5. WHEN the provider is changed, THE Model_Selector SHALL immediately update which controls are visible without requiring a page refresh
