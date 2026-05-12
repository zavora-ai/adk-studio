//! Property-based tests for Schema Backward Compatibility and Round-Trip Serialization
//!
//! **Property 12: Schema Backward Compatibility Round-Trip**
//! **Validates: Requirements 14.1, 14.4**
//!
//! For any valid ProjectSchema JSON saved without the new fields (old format),
//! deserialization with the extended schema SHALL succeed with all new fields
//! set to None/empty defaults.
//!
//! For any valid ProjectSchema with new fields populated, serializing then
//! deserializing SHALL produce an equivalent schema (round-trip preservation).

use adk_studio::schema::{AgentSchema, ProjectSchema};
use proptest::prelude::*;
use serde_json;

// ============================================
// Arbitrary Generators
// ============================================

fn arb_agent_type() -> impl Strategy<Value = String> {
    prop_oneof![
        Just("llm".to_string()),
        Just("tool".to_string()),
        Just("sequential".to_string()),
        Just("parallel".to_string()),
        Just("loop".to_string()),
        Just("router".to_string()),
        Just("graph".to_string()),
        Just("custom".to_string()),
    ]
}

fn arb_model_name() -> impl Strategy<Value = String> {
    prop_oneof![
        Just("gemini-2.5-flash".to_string()),
        Just("claude-sonnet-4-6".to_string()),
        Just("gpt-4o".to_string()),
        Just("gemini-3.1-flash-lite-preview".to_string()),
    ]
}

fn arb_tool_execution_strategy() -> impl Strategy<Value = String> {
    prop_oneof![
        Just("sequential".to_string()),
        Just("parallel".to_string()),
        Just("auto".to_string()),
    ]
}

fn arb_reasoning_effort() -> impl Strategy<Value = String> {
    prop_oneof![
        Just("low".to_string()),
        Just("medium".to_string()),
        Just("high".to_string()),
    ]
}

fn arb_tool_names() -> impl Strategy<Value = Vec<String>> {
    prop::collection::vec(
        prop_oneof![
            Just("google_search".to_string()),
            Just("web_browser".to_string()),
            Just("code_executor".to_string()),
            Just("file_reader".to_string()),
        ],
        0..4,
    )
}

/// Generate old-format AgentSchema JSON (without new fields)
fn arb_old_format_agent_json() -> impl Strategy<Value = serde_json::Value> {
    (
        arb_agent_type(),
        arb_model_name(),
        "[a-zA-Z0-9 ]{0,30}",
        prop::collection::vec(
            prop_oneof![
                Just("google_search".to_string()),
                Just("web_browser".to_string()),
            ],
            0..3,
        ),
        (0.0f64..1000.0f64, 0.0f64..1000.0f64),
        prop::option::of(1u32..200u32),
    )
        .prop_map(
            |(agent_type, model, instruction, tools, (x, y), max_iterations)| {
                let mut obj = serde_json::json!({
                    "type": agent_type,
                    "model": model,
                    "instruction": instruction,
                    "tools": tools,
                    "sub_agents": [],
                    "position": { "x": x, "y": y },
                    "routes": []
                });
                if let Some(max_iter) = max_iterations {
                    obj["max_iterations"] = serde_json::json!(max_iter);
                }
                obj
            },
        )
}

/// Generate old-format ProjectSchema JSON (without new fields)
fn arb_old_format_project_json() -> impl Strategy<Value = serde_json::Value> {
    (
        "[a-zA-Z][a-zA-Z0-9 ]{2,20}",
        arb_old_format_agent_json(),
    )
        .prop_map(|(name, agent_json)| {
            serde_json::json!({
                "id": "00000000-0000-0000-0000-000000000001",
                "version": "1.0",
                "name": name,
                "description": "Test project",
                "settings": {
                    "defaultModel": "gemini-3.1-flash-lite-preview",
                    "envVars": {}
                },
                "agents": {
                    "main_agent": agent_json
                },
                "tools": {},
                "tool_configs": {},
                "actionNodes": {},
                "workflow": {
                    "type": "single",
                    "edges": [],
                    "conditions": []
                },
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            })
        })
}

/// Generate AgentSchema with new fields populated
fn arb_agent_with_new_fields() -> impl Strategy<Value = AgentSchema> {
    (
        // Group 1: basic + resilience fields
        (
            arb_model_name(),
            "[a-zA-Z0-9 ]{0,30}",
            prop::option::of(30u32..600u32),       // tool_timeout_secs
            prop::option::of(1u32..200u32),        // max_llm_iterations
            prop::option::of(1u8..5u8),            // tool_retry_budget
            prop::option::of(1u8..10u8),           // circuit_breaker_threshold
            arb_tool_names(),                       // tools_requiring_confirmation
            prop::option::of(arb_tool_execution_strategy()), // tool_execution_strategy
        ),
        // Group 2: model-specific + skills fields
        (
            prop::option::of(prop::bool::ANY),     // extended_thinking
            prop::option::of(1024u32..32768u32),   // thinking_budget_tokens
            prop::option::of(arb_reasoning_effort()), // reasoning_effort
            prop::option::of(prop::bool::ANY),     // prompt_caching
            prop::option::of(prop::bool::ANY),     // auto_skills
        ),
    )
        .prop_map(
            |(
                (model, instruction, tool_timeout_secs, max_llm_iterations, tool_retry_budget, circuit_breaker_threshold, tools_requiring_confirmation, tool_execution_strategy),
                (extended_thinking, thinking_budget_tokens, reasoning_effort, prompt_caching, auto_skills),
            )| {
                let mut agent = AgentSchema::llm(model);
                agent.instruction = instruction;
                agent.tool_timeout_secs = tool_timeout_secs;
                agent.max_llm_iterations = max_llm_iterations;
                agent.tool_retry_budget = tool_retry_budget;
                agent.circuit_breaker_threshold = circuit_breaker_threshold;
                agent.tools_requiring_confirmation = tools_requiring_confirmation;
                agent.tool_execution_strategy = tool_execution_strategy;
                agent.extended_thinking = extended_thinking;
                agent.thinking_budget_tokens = thinking_budget_tokens;
                agent.reasoning_effort = reasoning_effort;
                agent.prompt_caching = prompt_caching;
                agent.auto_skills = auto_skills;
                agent
            },
        )
}

// ============================================
// Property Tests
// ============================================

proptest! {
    /// **Validates: Requirements 14.1**
    ///
    /// Property 12 (backward compatibility): Old-format JSON (without new fields)
    /// deserializes successfully with all new fields set to None/empty defaults.
    #[test]
    fn old_format_agent_json_deserializes_with_defaults(
        agent_json in arb_old_format_agent_json()
    ) {
        let result: Result<AgentSchema, _> = serde_json::from_value(agent_json);
        prop_assert!(result.is_ok(), "Old-format agent JSON should deserialize successfully");

        let agent = result.unwrap();
        // All new fields should be None/empty defaults
        prop_assert_eq!(agent.tool_timeout_secs, None);
        prop_assert_eq!(agent.max_llm_iterations, None);
        prop_assert_eq!(agent.tool_retry_budget, None);
        prop_assert_eq!(agent.circuit_breaker_threshold, None);
        prop_assert!(agent.tools_requiring_confirmation.is_empty());
        prop_assert_eq!(agent.tool_execution_strategy, None);
        prop_assert_eq!(agent.extended_thinking, None);
        prop_assert_eq!(agent.thinking_budget_tokens, None);
        prop_assert_eq!(agent.reasoning_effort, None);
        prop_assert_eq!(agent.prompt_caching, None);
        prop_assert_eq!(agent.auto_skills, None);
    }

    /// **Validates: Requirements 14.1**
    ///
    /// Property 12 (backward compatibility): Old-format ProjectSchema JSON
    /// (without new settings fields) deserializes successfully with defaults.
    #[test]
    fn old_format_project_json_deserializes_with_defaults(
        project_json in arb_old_format_project_json()
    ) {
        let result: Result<ProjectSchema, _> = serde_json::from_value(project_json);
        prop_assert!(result.is_ok(), "Old-format project JSON should deserialize successfully: {:?}", result.err());

        let project = result.unwrap();
        // New ProjectSettings fields should be None
        prop_assert_eq!(project.settings.sqlite_checkpointer, None);
        prop_assert_eq!(project.settings.context_compaction, None);
        prop_assert_eq!(project.settings.skills_directory, None);

        // Agent new fields should also be None/empty
        for (_id, agent) in &project.agents {
            prop_assert_eq!(agent.tool_timeout_secs, None);
            prop_assert_eq!(agent.max_llm_iterations, None);
            prop_assert_eq!(agent.tool_retry_budget, None);
            prop_assert_eq!(agent.circuit_breaker_threshold, None);
            prop_assert!(agent.tools_requiring_confirmation.is_empty());
            prop_assert_eq!(&agent.tool_execution_strategy, &None);
            prop_assert_eq!(agent.extended_thinking, None);
            prop_assert_eq!(agent.thinking_budget_tokens, None);
            prop_assert_eq!(&agent.reasoning_effort, &None);
            prop_assert_eq!(agent.prompt_caching, None);
            prop_assert_eq!(agent.auto_skills, None);
        }
    }

    /// **Validates: Requirements 14.4**
    ///
    /// Property 12 (round-trip): AgentSchema with new fields populated survives
    /// serialize → deserialize with all values preserved.
    #[test]
    fn agent_schema_round_trip_preserves_new_fields(
        agent in arb_agent_with_new_fields()
    ) {
        // Serialize
        let json = serde_json::to_value(&agent).unwrap();

        // Deserialize
        let deserialized: AgentSchema = serde_json::from_value(json).unwrap();

        // Verify round-trip preservation of new fields
        prop_assert_eq!(deserialized.tool_timeout_secs, agent.tool_timeout_secs);
        prop_assert_eq!(deserialized.max_llm_iterations, agent.max_llm_iterations);
        prop_assert_eq!(deserialized.tool_retry_budget, agent.tool_retry_budget);
        prop_assert_eq!(deserialized.circuit_breaker_threshold, agent.circuit_breaker_threshold);
        prop_assert_eq!(&deserialized.tools_requiring_confirmation, &agent.tools_requiring_confirmation);
        prop_assert_eq!(&deserialized.tool_execution_strategy, &agent.tool_execution_strategy);
        prop_assert_eq!(deserialized.extended_thinking, agent.extended_thinking);
        prop_assert_eq!(deserialized.thinking_budget_tokens, agent.thinking_budget_tokens);
        prop_assert_eq!(&deserialized.reasoning_effort, &agent.reasoning_effort);
        prop_assert_eq!(deserialized.prompt_caching, agent.prompt_caching);
        prop_assert_eq!(deserialized.auto_skills, agent.auto_skills);

        // Also verify existing fields are preserved
        prop_assert_eq!(&deserialized.instruction, &agent.instruction);
        prop_assert_eq!(&deserialized.model, &agent.model);
    }
}
