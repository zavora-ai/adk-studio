//! Property-based tests for Resilience Configuration Code Generation
//!
//! **Property 4: Resilience Configuration Codegen**
//! **Validates: Requirements 4.2, 4.3, 4.4, 4.5, 4.6**
//!
//! For any AgentSchema with resilience fields set (`tool_timeout_secs`, `max_llm_iterations`,
//! `tool_retry_budget`, `circuit_breaker_threshold`), the generated code SHALL contain the
//! corresponding builder method call with the exact configured value. For any AgentSchema
//! where all resilience fields are None, the generated code SHALL NOT contain any of these
//! builder method calls.

use adk_studio::codegen::generate_resilience_config;
use adk_studio::schema::AgentSchema;
use proptest::prelude::*;

// ============================================
// Arbitrary Generators
// ============================================

/// Generate an optional u32 value for timeout/iterations fields
fn arb_optional_u32() -> impl Strategy<Value = Option<u32>> {
    prop_oneof![
        Just(None),
        (1u32..=3600).prop_map(Some),
    ]
}

/// Generate an optional u8 value for retry/threshold fields
fn arb_optional_u8() -> impl Strategy<Value = Option<u8>> {
    prop_oneof![
        Just(None),
        (1u8..=10).prop_map(Some),
    ]
}

/// Generate an AgentSchema with random resilience field combinations
fn arb_agent_with_resilience(
    timeout: Option<u32>,
    max_iter: Option<u32>,
    retry: Option<u8>,
    threshold: Option<u8>,
) -> AgentSchema {
    let mut agent = AgentSchema::default();
    agent.tool_timeout_secs = timeout;
    agent.max_llm_iterations = max_iter;
    agent.tool_retry_budget = retry;
    agent.circuit_breaker_threshold = threshold;
    agent
}

// ============================================
// Property Tests — Task 5.3
// ============================================

proptest! {
    /// **Validates: Requirements 4.2, 4.3, 4.4, 4.5, 4.6**
    ///
    /// Property 4: Set fields produce corresponding builder calls with correct values.
    #[test]
    fn set_fields_produce_correct_builder_calls(
        timeout in arb_optional_u32(),
        max_iter in arb_optional_u32(),
        retry in arb_optional_u8(),
        threshold in arb_optional_u8(),
    ) {
        let agent = arb_agent_with_resilience(timeout, max_iter, retry, threshold);
        let code = generate_resilience_config(&agent);

        // Check tool_timeout
        if let Some(t) = timeout {
            let expected = format!(".tool_timeout(Duration::from_secs({}))", t);
            prop_assert!(
                code.contains(&expected),
                "Expected '{}' in generated code, got: {}",
                expected, code
            );
        } else {
            prop_assert!(
                !code.contains(".tool_timeout("),
                "tool_timeout should not appear when field is None, got: {}",
                code
            );
        }

        // Check max_iterations
        if let Some(m) = max_iter {
            let expected = format!(".max_iterations({})", m);
            prop_assert!(
                code.contains(&expected),
                "Expected '{}' in generated code, got: {}",
                expected, code
            );
        } else {
            prop_assert!(
                !code.contains(".max_iterations("),
                "max_iterations should not appear when field is None, got: {}",
                code
            );
        }

        // Check tool_retry_budget
        if let Some(r) = retry {
            let expected = format!(".tool_retry_budget({})", r);
            prop_assert!(
                code.contains(&expected),
                "Expected '{}' in generated code, got: {}",
                expected, code
            );
        } else {
            prop_assert!(
                !code.contains(".tool_retry_budget("),
                "tool_retry_budget should not appear when field is None, got: {}",
                code
            );
        }

        // Check circuit_breaker_threshold
        if let Some(cb) = threshold {
            let expected = format!(".circuit_breaker_threshold({})", cb);
            prop_assert!(
                code.contains(&expected),
                "Expected '{}' in generated code, got: {}",
                expected, code
            );
        } else {
            prop_assert!(
                !code.contains(".circuit_breaker_threshold("),
                "circuit_breaker_threshold should not appear when field is None, got: {}",
                code
            );
        }
    }

    /// **Validates: Requirements 4.5, 4.6**
    ///
    /// Property 4: When all resilience fields are None, no builder method calls are produced.
    #[test]
    fn all_none_produces_empty_output(_dummy in 0..100u32) {
        let agent = arb_agent_with_resilience(None, None, None, None);
        let code = generate_resilience_config(&agent);

        prop_assert!(
            code.is_empty(),
            "All-None resilience config should produce empty string, got: {}",
            code
        );
    }

    /// **Validates: Requirements 4.2, 4.3, 4.4**
    ///
    /// Property 4: Each line is indented with 8 spaces (matching builder chain pattern).
    #[test]
    fn output_lines_are_properly_indented(
        timeout in arb_optional_u32(),
        max_iter in arb_optional_u32(),
        retry in arb_optional_u8(),
        threshold in arb_optional_u8(),
    ) {
        let agent = arb_agent_with_resilience(timeout, max_iter, retry, threshold);
        let code = generate_resilience_config(&agent);

        for line in code.lines() {
            if !line.is_empty() {
                prop_assert!(
                    line.starts_with("        ."),
                    "Each non-empty line must start with 8 spaces followed by '.', got: '{}'",
                    line
                );
            }
        }
    }
}
