# Tasks: ADK 0.8.0 Feature Parity

## Task 1: Extend Schema Types (Rust + TypeScript)

- [x] 1.1 Add new fields to `AgentSchema` in `src/schema/agent.rs`: `tool_timeout_secs`, `max_llm_iterations`, `tool_retry_budget`, `circuit_breaker_threshold`, `tools_requiring_confirmation`, `tool_execution_strategy`, `extended_thinking`, `thinking_budget_tokens`, `reasoning_effort`, `prompt_caching`, `auto_skills` — all with `Option<T>` and `#[serde(default, skip_serializing_if = "Option::is_none")]`
- [x] 1.2 Add new fields to `ProjectSettings` in `src/schema/project.rs`: `sqlite_checkpointer`, `context_compaction`, `skills_directory` — all with `Option<T>` and `#[serde(default)]`
- [x] 1.3 Update `AgentSchema::llm()` constructor and builder methods in `src/schema/agent.rs` to initialize new fields to None/empty defaults
- [x] 1.4 Add new fields to `AgentSchema` interface in `ui/src/types/project.ts`: `tool_timeout_secs?`, `max_llm_iterations?`, `tool_retry_budget?`, `circuit_breaker_threshold?`, `tools_requiring_confirmation?`, `tool_execution_strategy?`, `extended_thinking?`, `thinking_budget_tokens?`, `reasoning_effort?`, `prompt_caching?`, `auto_skills?`
- [x] 1.5 Add new fields to `ProjectSettings` interface in `ui/src/types/project.ts`: `sqliteCheckpointer?`, `contextCompaction?`, `skillsDirectory?`
- [x] 1.6 Write property-based test for backward compatibility: old-format JSON (without new fields) deserializes successfully with defaults (Property 12)
- [x] 1.7 Write property-based test for round-trip serialization: schema with new fields populated survives serialize → deserialize (Property 12)

## Task 2: Runner Builder Code Generation

- [x] 2.1 Implement `generate_runner_builder()` function in `src/codegen/mod.rs` that emits `Runner::builder(app_name, agent, session_service)` with chained methods and `.build()?`
- [x] 2.2 Add conditional `.checkpointer(SqliteCheckpointer::new(...).await?)` emission when `project.settings.sqlite_checkpointer == Some(true)`
- [x] 2.3 Add conditional `.compaction_config(CompactionConfig::default())` emission when `project.settings.context_compaction == Some(true)`
- [x] 2.4 Replace existing `Runner::new(RunnerConfig { ... })` generation with call to `generate_runner_builder()`
- [x] 2.5 Write property-based test: for any ProjectSchema, generated runner code contains "Runner::builder(" and not "Runner::new(RunnerConfig" (Property 1)
- [x] 2.6 Write property-based test: checkpointer/compaction conditionally appear based on settings flags (Property 1)

## Task 3: Tool Execution Strategy Code Generation

- [x] 3.1 Implement `generate_tool_execution_strategy()` function in `src/codegen/mod.rs` that maps strategy string to `ToolExecutionStrategy::` variant
- [x] 3.2 Handle invalid strategy values by falling back to Auto with a warning comment in generated code
- [x] 3.3 Default to `ToolExecutionStrategy::Auto` when `tool_execution_strategy` is None
- [x] 3.4 Write property-based test: valid strategy values map to correct enum variants, invalid values fall back to Auto (Property 2)

## Task 4: Read-Only Tool Marking

- [x] 4.1 Update tool generation code in `src/codegen/mod.rs` to append `.read_only(true)` when generating `GoogleSearchTool` or `LoadArtifactsTool`
- [x] 4.2 Ensure read-only marking is applied regardless of configured `tool_execution_strategy`
- [x] 4.3 Write property-based test: any project using GoogleSearchTool or LoadArtifactsTool has `.read_only(true)` in generated code (Property 3)

## Task 5: Resilience Configuration Code Generation

- [x] 5.1 Implement `generate_resilience_config()` function in `src/codegen/mod.rs` that conditionally emits `.tool_timeout()`, `.max_iterations()`, `.tool_retry_budget()`, `.circuit_breaker_threshold()` based on AgentSchema fields
- [x] 5.2 Omit builder method calls when corresponding fields are None
- [x] 5.3 Write property-based test: set fields produce corresponding builder calls with correct values; None fields produce no calls (Property 4)

## Task 6: Tool Confirmation Code Generation

- [x] 6.1 Update tool generation in `src/codegen/mod.rs` to emit `.with_confirmation(true)` for tools listed in `tools_requiring_confirmation`
- [x] 6.2 Omit confirmation code when `tools_requiring_confirmation` is empty
- [x] 6.3 Write property-based test: tools in confirmation list get `.with_confirmation(true)`, others don't (Property 5)

## Task 7: Model-Specific Configuration Code Generation

- [x] 7.1 Implement Anthropic-specific codegen: emit `.with_extended_thinking(true)`, `.with_thinking_budget(N)`, `.with_prompt_caching(true)` when agent uses Anthropic model and fields are set
- [x] 7.2 Implement OpenAI o-series codegen: emit `.with_reasoning_effort(ReasoningEffort::{Value})` when agent uses o-series model and field is set
- [x] 7.3 Ignore model-specific fields when the agent's model doesn't match the corresponding provider (Anthropic fields ignored for non-Anthropic, OpenAI fields ignored for non-OpenAI)
- [x] 7.4 Write property-based test: Anthropic config emitted only for Anthropic models, ignored otherwise (Property 6)
- [x] 7.5 Write property-based test: reasoning effort emitted only for OpenAI o-series models, ignored otherwise (Property 7)

## Task 8: OpenRouter Provider Detection and Code Generation

- [x] 8.1 Update `detect_provider()` in `src/codegen/mod.rs` to return "openrouter" for model IDs containing "/" that don't match known provider patterns (Fireworks, Together, Groq, Meta-Llama, Qwen)
- [x] 8.2 Implement `generate_openrouter_model()` function that emits `OpenRouterClient::new(OpenRouterConfig::new(&api_key, "{model_id}"))` code
- [x] 8.3 Update `generate_cargo_toml()` to add `features = ["openrouter"]` when an OpenRouter model is detected
- [x] 8.4 Write property-based test: slash-containing model IDs not matching known patterns return "openrouter"; known patterns return correct provider (Property 9)
- [x] 8.5 Write property-based test: OpenRouter models produce correct client code and Cargo.toml feature flag (Property 8)

## Task 9: Router Agent Upgrade to LlmConditionalAgent

- [x] 9.1 Implement updated `generate_router_agent()` in `src/codegen/mod.rs` using `LlmConditionalAgent::builder()` instead of manual routing logic
- [x] 9.2 Emit `.condition("{condition}", {target_agent})` for each route in the router's routes list
- [x] 9.3 Include model and instruction configuration in the generated LlmConditionalAgent builder
- [x] 9.4 Write property-based test: router agents produce LlmConditionalAgent code with correct number of .condition() calls matching routes (Property 10)

## Task 10: Skills Configuration Code Generation

- [x] 10.1 Implement `generate_skills_config()` in `src/codegen/mod.rs` that emits `.with_auto_skills()` when `auto_skills=true`
- [x] 10.2 Emit `.with_skills_from_root("{path}")` when `skills_directory` is set in ProjectSettings
- [x] 10.3 Validate that `skills_directory` is a relative path (reject paths starting with "/" or containing "..")
- [x] 10.4 Write property-based test: skills config correctly emitted based on auto_skills and skills_directory; invalid paths rejected (Property 11)

## Task 11: Generated Cargo.toml Correctness

- [x] 11.1 Update Cargo.toml generation to conditionally include `adk-checkpointer-sqlite = "0.8.0"` when `sqlite_checkpointer` is enabled
- [x] 11.2 Ensure only feature flags for providers actually used in the project are included
- [x] 11.3 Ensure all adk crate versions are "0.8.0"
- [x] 11.4 Write property-based test: Cargo.toml contains only required dependencies and features, all at version 0.8.0 (Property 13)

## Task 12: OpenRouter Provider in UI

- [x] 12.1 Add OpenRouter to the `PROVIDERS` array in `ui/src/data/models.ts` with id "openrouter", name "OpenRouter", icon "🌐", envVar "OPENROUTER_API_KEY", and empty models array
- [x] 12.2 Update `ModelSelector.tsx` to show a text input for model ID when OpenRouter is selected (instead of model dropdown)
- [x] 12.3 Add optional "Browse models" button in ModelSelector when OpenRouter is selected
- [x] 12.4 Update TypeScript `detectProviderFromModel()` in `ui/src/data/models.ts` to match the Rust `detect_provider()` logic for OpenRouter detection
- [x] 12.5 Verify TypeScript type-checks pass with `npx tsc --noEmit`

## Task 13: Agent Properties Panel — Resilience & Execution Section

- [x] 13.1 Add "Resilience & Execution" collapsible section to `PropertiesPanel.tsx` (or create a sub-component) visible when an LLM agent is selected
- [x] 13.2 Add "Tool Execution Strategy" dropdown with options: "Auto (concurrent read-only)", "Sequential", "Parallel"
- [x] 13.3 Add numeric inputs for: Tool Timeout (seconds), Max LLM Iterations
- [x] 13.4 Add toggle + numeric input for: Retry Budget (1-5), Circuit Breaker Threshold
- [x] 13.5 Add "Tool Confirmation" section with checkboxes for each tool assigned to the agent
- [x] 13.6 Wire all new inputs to the Zustand store to persist values in AgentSchema
- [x] 13.7 Verify TypeScript type-checks pass with `npx tsc --noEmit`

## Task 14: Model-Specific Configuration UI

- [x] 14.1 Add conditional "Extended Thinking" toggle + "Thinking Budget" slider (1024-32768) in ModelSelector, visible only when Anthropic model is selected
- [x] 14.2 Add conditional "Prompt Caching" toggle in ModelSelector, visible only when Anthropic model is selected
- [x] 14.3 Add conditional "Reasoning Effort" radio group (Low/Medium/High) in ModelSelector, visible only when OpenAI o-series model is selected
- [x] 14.4 Implement provider change logic: hide model-specific controls when provider changes, but preserve stored values in schema
- [x] 14.5 Verify TypeScript type-checks pass with `npx tsc --noEmit`

## Task 15: Project Settings — Production Section

- [x] 15.1 Add "Production" tab or section to the Settings modal/overlay
- [x] 15.2 Add "Enable SQLite checkpointing" toggle bound to `ProjectSettings.sqliteCheckpointer`
- [x] 15.3 Add "Enable context compaction" toggle bound to `ProjectSettings.contextCompaction`
- [x] 15.4 Add "Skills Directory" text input bound to `ProjectSettings.skillsDirectory`
- [x] 15.5 Wire all new settings to the Zustand store and ensure they persist through save/reload
- [x] 15.6 Verify TypeScript type-checks pass with `npx tsc --noEmit`

## Task 16: Integration Testing and Verification

- [x] 16.1 Run `cargo test` to verify all Rust tests pass (unit + property-based)
- [x] 16.2 Run `npx tsc --noEmit` in `ui/` to verify zero TypeScript errors
- [x] 16.3 Run `npm run build` in `ui/` to verify UI builds without errors
- [x] 16.4 Run `cargo check` to verify no compilation warnings
- [x] 16.5 Manually verify end-to-end: create a project using all 5 work streams, build, and inspect generated code for correctness
