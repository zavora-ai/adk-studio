//! Property-based tests for Tool Execution Strategy Code Generation
//!
//! **Property 2: Tool Execution Strategy Codegen**
//! **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
//!
//! For any AgentSchema with a `tool_execution_strategy` value, the generated code
//! SHALL contain exactly the corresponding `ToolExecutionStrategy::` variant:
//! None/"auto" → Auto, "sequential" → Sequential, "parallel" → Parallel.
//! For any string value not in {"auto", "sequential", "parallel"}, the generated
//! code SHALL contain `ToolExecutionStrategy::Auto` and a warning comment.

use adk_studio::codegen::generate_tool_execution_strategy;
use adk_studio::schema::AgentSchema;
use proptest::prelude::*;

// ============================================
// Arbitrary Generators
// ============================================

/// Generate a valid strategy value (one of the three accepted values)
fn arb_valid_strategy() -> impl Strategy<Value = String> {
    prop_oneof![
        Just("auto".to_string()),
        Just("sequential".to_string()),
        Just("parallel".to_string()),
    ]
}

/// Generate an invalid strategy value (any string not in the valid set)
fn arb_invalid_strategy() -> impl Strategy<Value = String> {
    "[a-zA-Z0-9_]{1,20}".prop_filter("must not be a valid strategy", |s| {
        s != "auto" && s != "sequential" && s != "parallel"
    })
}

/// Generate an AgentSchema with a specific tool_execution_strategy
fn arb_agent_with_strategy(strategy: Option<String>) -> AgentSchema {
    let mut agent = AgentSchema::default();
    agent.tool_execution_strategy = strategy;
    agent
}

// ============================================
// Property Tests — Task 3.4
// ============================================

proptest! {
    /// **Validates: Requirements 2.1**
    ///
    /// Property 2: When tool_execution_strategy is None, generated code contains
    /// ToolExecutionStrategy::Auto.
    #[test]
    fn none_strategy_maps_to_auto(_dummy in 0..100u32) {
        let agent = arb_agent_with_strategy(None);
        let code = generate_tool_execution_strategy(&agent);

        prop_assert!(
            code.contains("ToolExecutionStrategy::Auto"),
            "None strategy must map to ToolExecutionStrategy::Auto, got: {}",
            code
        );
        prop_assert!(
            !code.contains("WARNING"),
            "None strategy must not produce a warning comment"
        );
    }

    /// **Validates: Requirements 2.1, 2.2, 2.3**
    ///
    /// Property 2: Valid strategy values map to the correct enum variant.
    #[test]
    fn valid_strategy_maps_to_correct_variant(strategy in arb_valid_strategy()) {
        let agent = arb_agent_with_strategy(Some(strategy.clone()));
        let code = generate_tool_execution_strategy(&agent);

        let expected_variant = match strategy.as_str() {
            "auto" => "ToolExecutionStrategy::Auto",
            "sequential" => "ToolExecutionStrategy::Sequential",
            "parallel" => "ToolExecutionStrategy::Parallel",
            _ => unreachable!(),
        };

        prop_assert!(
            code.contains(expected_variant),
            "Strategy '{}' must map to {}, got: {}",
            strategy, expected_variant, code
        );
        prop_assert!(
            !code.contains("WARNING"),
            "Valid strategy '{}' must not produce a warning comment",
            strategy
        );
    }

    /// **Validates: Requirements 2.4**
    ///
    /// Property 2: Invalid strategy values fall back to Auto with a warning comment.
    #[test]
    fn invalid_strategy_falls_back_to_auto_with_warning(strategy in arb_invalid_strategy()) {
        let agent = arb_agent_with_strategy(Some(strategy.clone()));
        let code = generate_tool_execution_strategy(&agent);

        prop_assert!(
            code.contains("ToolExecutionStrategy::Auto"),
            "Invalid strategy '{}' must fall back to ToolExecutionStrategy::Auto, got: {}",
            strategy, code
        );
        prop_assert!(
            code.contains("WARNING"),
            "Invalid strategy '{}' must produce a WARNING comment, got: {}",
            strategy, code
        );
        prop_assert!(
            code.contains(&format!("\"{}\"", strategy)),
            "Warning comment must include the invalid strategy value '{}', got: {}",
            strategy, code
        );
    }
}
