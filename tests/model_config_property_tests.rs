//! Property-based tests for Model-Specific Configuration Code Generation
//!
//! **Property 6: Model-Specific Configuration Codegen**
//! **Validates: Requirements 7.2, 7.3, 7.4, 8.2, 8.3**
//!
//! For any AgentSchema with an Anthropic model and `extended_thinking=true`, the generated code
//! SHALL contain `.with_extended_thinking(true)` and `.with_thinking_budget({value})`.
//! For any AgentSchema with an Anthropic model and `prompt_caching=true`, the generated code
//! SHALL contain `.with_prompt_caching(true)`.
//! For any AgentSchema with a non-Anthropic model, the generated code SHALL NOT contain any
//! Anthropic-specific config calls regardless of stored field values.
//!
//! **Property 7: Reasoning Effort Codegen**
//! **Validates: Requirements 9.2, 9.4**
//!
//! For any AgentSchema with an OpenAI o-series model and `reasoning_effort` set, the generated
//! code SHALL contain `.with_reasoning_effort(ReasoningEffort::{Value})`.
//! For any AgentSchema with a non-OpenAI model, the generated code SHALL NOT contain reasoning
//! effort configuration regardless of stored field values.

use adk_studio::codegen::generate_model_config;
use adk_studio::schema::AgentSchema;
use proptest::prelude::*;

// ============================================
// Arbitrary Generators
// ============================================

/// Generate a random Anthropic model name
fn arb_anthropic_model() -> impl Strategy<Value = String> {
    prop_oneof![
        Just("claude-3-opus-20240229".to_string()),
        Just("claude-3-sonnet-20240229".to_string()),
        Just("claude-3-haiku-20240307".to_string()),
        Just("claude-sonnet-4-6".to_string()),
        Just("claude-3.5-sonnet-20241022".to_string()),
    ]
}

/// Generate a random non-Anthropic model name (excludes claude models)
fn arb_non_anthropic_model() -> impl Strategy<Value = String> {
    prop_oneof![
        Just("gemini-3.1-flash-lite-preview".to_string()),
        Just("gpt-4o".to_string()),
        Just("gpt-4-turbo".to_string()),
        Just("o1-preview".to_string()),
        Just("deepseek-chat".to_string()),
        Just("llama-3.1-70b".to_string()),
    ]
}

/// Generate a random OpenAI o-series model name
fn arb_o_series_model() -> impl Strategy<Value = String> {
    prop_oneof![
        Just("o1-preview".to_string()),
        Just("o1-mini".to_string()),
        Just("o1".to_string()),
        Just("o3-mini".to_string()),
        Just("o3".to_string()),
        Just("o4-mini".to_string()),
    ]
}

/// Generate a random non-o-series model name (includes non-OpenAI and non-o-series OpenAI)
fn arb_non_o_series_model() -> impl Strategy<Value = String> {
    prop_oneof![
        Just("gemini-3.1-flash-lite-preview".to_string()),
        Just("gpt-4o".to_string()),
        Just("gpt-4-turbo".to_string()),
        Just("claude-sonnet-4-6".to_string()),
        Just("deepseek-chat".to_string()),
        Just("llama-3.1-70b".to_string()),
    ]
}

/// Generate a random reasoning effort value
fn arb_reasoning_effort() -> impl Strategy<Value = Option<String>> {
    prop_oneof![
        Just(None),
        Just(Some("low".to_string())),
        Just(Some("medium".to_string())),
        Just(Some("high".to_string())),
    ]
}

/// Generate a random thinking budget
fn arb_thinking_budget() -> impl Strategy<Value = Option<u32>> {
    prop_oneof![
        Just(None),
        (1024u32..=32768).prop_map(Some),
    ]
}

// ============================================
// Property Tests — Task 7.4 (Property 6)
// ============================================

proptest! {
    /// **Validates: Requirements 7.2, 7.3**
    ///
    /// Property 6: Anthropic models with extended_thinking=true produce
    /// `.with_extended_thinking(true)` and `.with_thinking_budget(N)` in generated code.
    #[test]
    fn anthropic_extended_thinking_emitted_when_set(
        model in arb_anthropic_model(),
        budget in arb_thinking_budget(),
    ) {
        let mut agent = AgentSchema::default();
        agent.model = Some(model);
        agent.extended_thinking = Some(true);
        agent.thinking_budget_tokens = budget;

        let code = generate_model_config(&agent);

        prop_assert!(
            code.contains(".with_extended_thinking(true)"),
            "Anthropic model with extended_thinking=true should emit .with_extended_thinking(true), got: {}",
            code
        );

        if let Some(b) = budget {
            let expected = format!(".with_thinking_budget({})", b);
            prop_assert!(
                code.contains(&expected),
                "Anthropic model with thinking_budget={} should emit {}, got: {}",
                b, expected, code
            );
        }
    }

    /// **Validates: Requirements 8.2, 8.3**
    ///
    /// Property 6: Anthropic models with prompt_caching=true produce
    /// `.with_prompt_caching(true)` in generated code.
    #[test]
    fn anthropic_prompt_caching_emitted_when_set(
        model in arb_anthropic_model(),
    ) {
        let mut agent = AgentSchema::default();
        agent.model = Some(model);
        agent.prompt_caching = Some(true);

        let code = generate_model_config(&agent);

        prop_assert!(
            code.contains(".with_prompt_caching(true)"),
            "Anthropic model with prompt_caching=true should emit .with_prompt_caching(true), got: {}",
            code
        );
    }

    /// **Validates: Requirements 7.4, 8.3**
    ///
    /// Property 6: Non-Anthropic models SHALL NOT contain any Anthropic-specific config
    /// calls regardless of stored field values.
    #[test]
    fn non_anthropic_model_ignores_anthropic_fields(
        model in arb_non_anthropic_model(),
        budget in arb_thinking_budget(),
        effort in arb_reasoning_effort(),
    ) {
        let mut agent = AgentSchema::default();
        agent.model = Some(model);
        agent.extended_thinking = Some(true);
        agent.thinking_budget_tokens = budget;
        agent.prompt_caching = Some(true);
        agent.reasoning_effort = effort;

        let code = generate_model_config(&agent);

        prop_assert!(
            !code.contains(".with_extended_thinking("),
            "Non-Anthropic model should NOT emit .with_extended_thinking, got: {}",
            code
        );
        prop_assert!(
            !code.contains(".with_thinking_budget("),
            "Non-Anthropic model should NOT emit .with_thinking_budget, got: {}",
            code
        );
        prop_assert!(
            !code.contains(".with_prompt_caching("),
            "Non-Anthropic model should NOT emit .with_prompt_caching, got: {}",
            code
        );
    }

    /// **Validates: Requirements 7.2, 7.3, 8.2**
    ///
    /// Property 6: Anthropic models with extended_thinking=false or None should NOT emit
    /// extended thinking config.
    #[test]
    fn anthropic_no_extended_thinking_when_disabled(
        model in arb_anthropic_model(),
    ) {
        let mut agent = AgentSchema::default();
        agent.model = Some(model);
        agent.extended_thinking = Some(false);

        let code = generate_model_config(&agent);

        prop_assert!(
            !code.contains(".with_extended_thinking("),
            "Anthropic model with extended_thinking=false should NOT emit .with_extended_thinking, got: {}",
            code
        );
    }

    // ============================================
    // Property Tests — Task 7.5 (Property 7)
    // ============================================

    /// **Validates: Requirements 9.2**
    ///
    /// Property 7: OpenAI o-series models with reasoning_effort set produce
    /// `.with_reasoning_effort(ReasoningEffort::{Value})` in generated code.
    #[test]
    fn o_series_reasoning_effort_emitted_when_set(
        model in arb_o_series_model(),
        effort in prop_oneof![
            Just("low".to_string()),
            Just("medium".to_string()),
            Just("high".to_string()),
        ],
    ) {
        let mut agent = AgentSchema::default();
        agent.model = Some(model);
        agent.reasoning_effort = Some(effort.clone());

        let code = generate_model_config(&agent);

        let expected_value = match effort.as_str() {
            "low" => "Low",
            "medium" => "Medium",
            "high" => "High",
            _ => unreachable!(),
        };
        let expected = format!(".with_reasoning_effort(ReasoningEffort::{})", expected_value);
        prop_assert!(
            code.contains(&expected),
            "O-series model with reasoning_effort='{}' should emit {}, got: {}",
            effort, expected, code
        );
    }

    /// **Validates: Requirements 9.4**
    ///
    /// Property 7: Non-o-series models SHALL NOT contain reasoning effort configuration
    /// regardless of stored field values.
    #[test]
    fn non_o_series_model_ignores_reasoning_effort(
        model in arb_non_o_series_model(),
        effort in arb_reasoning_effort(),
    ) {
        let mut agent = AgentSchema::default();
        agent.model = Some(model);
        agent.reasoning_effort = effort;
        // Also set Anthropic fields to ensure they don't leak
        agent.extended_thinking = Some(true);
        agent.thinking_budget_tokens = Some(8192);

        let code = generate_model_config(&agent);

        prop_assert!(
            !code.contains(".with_reasoning_effort("),
            "Non-o-series model should NOT emit .with_reasoning_effort, got: {}",
            code
        );
    }

    /// **Validates: Requirements 9.2, 9.4**
    ///
    /// Property 7: O-series models without reasoning_effort set produce no reasoning config.
    #[test]
    fn o_series_no_reasoning_effort_when_none(
        model in arb_o_series_model(),
    ) {
        let mut agent = AgentSchema::default();
        agent.model = Some(model);
        agent.reasoning_effort = None;

        let code = generate_model_config(&agent);

        prop_assert!(
            !code.contains(".with_reasoning_effort("),
            "O-series model with reasoning_effort=None should NOT emit .with_reasoning_effort, got: {}",
            code
        );
    }
}
