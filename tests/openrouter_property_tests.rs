//! Property-based tests for OpenRouter Provider Detection and Code Generation
//!
//! **Property 9: Provider Detection Correctness**
//! **Validates: Requirements 11.1, 11.2, 11.3**
//!
//! For any model ID string containing "/" that does NOT match known provider patterns
//! (accounts/fireworks/, meta-llama/, Meta-Llama/, Qwen/), `detect_provider()` SHALL return
//! "openrouter". For any model ID matching a known provider's slash pattern,
//! `detect_provider()` SHALL return that provider's ID instead.
//!
//! **Property 8: OpenRouter Code Generation**
//! **Validates: Requirements 10.5, 10.6, 15.1**
//!
//! For any model ID classified as OpenRouter by Provider_Detection, the generated code SHALL
//! contain `OpenRouterClient::new(OpenRouterConfig::new(` with the correct model ID, and the
//! generated Cargo.toml SHALL contain `features = ["openrouter"]` in the adk-model dependency.

use adk_studio::codegen::{detect_provider, generate_openrouter_model, generate_rust_project};
use adk_studio::schema::{AgentSchema, AgentType, Edge, ProjectSchema};
use proptest::prelude::*;
use std::collections::HashMap;

// ============================================
// Helpers
// ============================================

fn project_with_model(model_id: &str) -> ProjectSchema {
    let mut agents = HashMap::new();
    agents.insert(
        "agent".to_string(),
        AgentSchema {
            agent_type: AgentType::Llm,
            model: Some(model_id.to_string()),
            instruction: "You are a helpful assistant.".to_string(),
            ..Default::default()
        },
    );
    let mut p = ProjectSchema::new("test_project");
    p.agents = agents;
    p.workflow.edges = vec![Edge::new("START", "agent"), Edge::new("agent", "END")];
    p
}

fn get_main_rs(project: &ProjectSchema) -> String {
    let result = generate_rust_project(project).unwrap();
    result
        .files
        .iter()
        .find(|f| f.path == "src/main.rs")
        .unwrap()
        .content
        .clone()
}

fn get_cargo_toml(project: &ProjectSchema) -> String {
    let result = generate_rust_project(project).unwrap();
    result
        .files
        .iter()
        .find(|f| f.path == "Cargo.toml")
        .unwrap()
        .content
        .clone()
}

// ============================================
// Arbitrary Generators
// ============================================

/// Generate model IDs that should be classified as OpenRouter
/// (contain "/" but don't match known provider patterns)
fn arb_openrouter_model() -> impl Strategy<Value = String> {
    prop_oneof![
        // Provider/model format that doesn't match known patterns
        Just("anthropic/claude-sonnet-4-6".to_string()),
        Just("google/gemini-pro".to_string()),
        Just("openai/gpt-4".to_string()),
        Just("mistralai/mistral-7b".to_string()),
        Just("nousresearch/nous-hermes-2".to_string()),
        Just("microsoft/phi-3-mini".to_string()),
        Just("cohere/command-r-plus".to_string()),
        Just("perplexity/llama-3.1-sonar-large".to_string()),
        // Random org/model patterns
        "[a-z]{3,10}/[a-z]{3,10}-[0-9]{1,2}b".prop_map(|s| s),
    ]
}

/// Generate model IDs that match known provider slash patterns (NOT OpenRouter)
fn arb_known_slash_model() -> impl Strategy<Value = (String, &'static str)> {
    prop_oneof![
        // Fireworks models
        Just(("accounts/fireworks/models/llama-v3p1-70b-instruct".to_string(), "fireworks")),
        Just(("accounts/fireworks/models/mixtral-8x7b".to_string(), "fireworks")),
        // Together models (contain -turbo and /)
        Just(("meta-llama/Llama-3-70b-chat-hf-turbo".to_string(), "together")),
        // Meta-Llama / SambaNova models
        Just(("Meta-Llama/Llama-3.1-70B".to_string(), "sambanova")),
        Just(("Meta-Llama/Llama-3.1-8B-Instruct".to_string(), "sambanova")),
    ]
}

/// Generate model IDs that contain "/" and should be detected as specific known providers
fn arb_qwen_model() -> impl Strategy<Value = String> {
    prop_oneof![
        Just("Qwen/Qwen2-72B".to_string()),
        Just("Qwen/Qwen2.5-Coder-32B".to_string()),
        Just("Qwen/QwQ-32B".to_string()),
    ]
}

// ============================================
// Property Tests — Task 8.4 (Property 9)
// ============================================

proptest! {
    /// **Validates: Requirements 11.1**
    ///
    /// Property 9: Slash-containing model IDs not matching known patterns return "openrouter".
    #[test]
    fn openrouter_detected_for_unknown_slash_models(
        model in arb_openrouter_model(),
    ) {
        let result = detect_provider(&model);
        prop_assert_eq!(
            result,
            "openrouter",
            "Model '{}' contains '/' and doesn't match known patterns, should be 'openrouter' but got '{}'",
            model,
            result
        );
    }

    /// **Validates: Requirements 11.2**
    ///
    /// Property 9: Known provider slash patterns return their correct provider, not "openrouter".
    #[test]
    fn known_slash_patterns_not_openrouter(
        (model, expected_provider) in arb_known_slash_model(),
    ) {
        let result = detect_provider(&model);
        prop_assert_ne!(
            result,
            "openrouter",
            "Model '{}' matches known provider '{}' pattern, should NOT be 'openrouter' but got '{}'",
            model,
            expected_provider,
            result
        );
        prop_assert_eq!(
            result,
            expected_provider,
            "Model '{}' should be detected as '{}' but got '{}'",
            model,
            expected_provider,
            result
        );
    }

    /// **Validates: Requirements 11.2**
    ///
    /// Property 9: Qwen/ models are detected as "ollama" (known pattern), not "openrouter".
    #[test]
    fn qwen_models_not_openrouter(
        model in arb_qwen_model(),
    ) {
        let result = detect_provider(&model);
        prop_assert_ne!(
            result,
            "openrouter",
            "Model '{}' starts with 'Qwen/' which is a known pattern, should NOT be 'openrouter' but got '{}'",
            model,
            result
        );
        // Qwen models are detected as "ollama" in the existing logic
        prop_assert_eq!(
            result,
            "ollama",
            "Model '{}' should be detected as 'ollama' but got '{}'",
            model,
            result
        );
    }

    // ============================================
    // Property Tests — Task 8.5 (Property 8)
    // ============================================

    /// **Validates: Requirements 10.5**
    ///
    /// Property 8: OpenRouter models produce correct client code containing
    /// `OpenRouterClient::new(OpenRouterConfig::new(` with the correct model ID.
    #[test]
    fn openrouter_models_produce_correct_client_code(
        model in arb_openrouter_model(),
    ) {
        let project = project_with_model(&model);
        let main_rs = get_main_rs(&project);

        prop_assert!(
            main_rs.contains("OpenRouterClient::new(OpenRouterConfig::new("),
            "Generated code for OpenRouter model '{}' should contain OpenRouterClient::new(OpenRouterConfig::new(, got:\n{}",
            model,
            main_rs
        );

        // Verify the model ID is in the generated code
        prop_assert!(
            main_rs.contains(&model),
            "Generated code for OpenRouter model '{}' should contain the model ID",
            model
        );

        // Verify the API key variable is referenced
        prop_assert!(
            main_rs.contains("openrouter_api_key"),
            "Generated code for OpenRouter model '{}' should reference openrouter_api_key",
            model
        );
    }

    /// **Validates: Requirements 10.6, 15.1**
    ///
    /// Property 8: OpenRouter models produce Cargo.toml with `features = ["openrouter"]`
    /// in the adk-model dependency.
    #[test]
    fn openrouter_models_produce_cargo_toml_feature(
        model in arb_openrouter_model(),
    ) {
        let project = project_with_model(&model);
        let cargo_toml = get_cargo_toml(&project);

        prop_assert!(
            cargo_toml.contains("\"openrouter\""),
            "Cargo.toml for OpenRouter model '{}' should contain \"openrouter\" feature, got:\n{}",
            model,
            cargo_toml
        );
    }
}

// ============================================
// Additional unit tests for edge cases
// ============================================

#[test]
fn generate_openrouter_model_produces_correct_code() {
    let code = generate_openrouter_model("anthropic/claude-sonnet-4-6");
    assert_eq!(
        code,
        "OpenRouterClient::new(OpenRouterConfig::new(&openrouter_api_key, \"anthropic/claude-sonnet-4-6\"))"
    );
}

#[test]
fn detect_provider_fireworks_not_openrouter() {
    assert_eq!(detect_provider("accounts/fireworks/models/llama-v3p1-70b-instruct"), "fireworks");
}

#[test]
fn detect_provider_meta_llama_not_openrouter() {
    assert_eq!(detect_provider("Meta-Llama/Llama-3.1-70B"), "sambanova");
}

#[test]
fn detect_provider_qwen_not_openrouter() {
    assert_eq!(detect_provider("Qwen/Qwen2-72B"), "ollama");
}

#[test]
fn detect_provider_together_turbo_not_openrouter() {
    assert_eq!(detect_provider("meta-llama/Llama-3-70b-chat-hf-turbo"), "together");
}

#[test]
fn detect_provider_openrouter_basic() {
    assert_eq!(detect_provider("anthropic/claude-sonnet-4-6"), "openrouter");
    assert_eq!(detect_provider("google/gemini-pro"), "openrouter");
    assert_eq!(detect_provider("nousresearch/nous-hermes-2"), "openrouter");
}

#[test]
fn openrouter_import_in_generated_code() {
    let project = project_with_model("anthropic/claude-sonnet-4-6");
    let main_rs = get_main_rs(&project);
    assert!(main_rs.contains("use adk_model::openrouter::{OpenRouterClient, OpenRouterConfig}"));
}

#[test]
fn openrouter_api_key_env_var_in_generated_code() {
    let project = project_with_model("anthropic/claude-sonnet-4-6");
    let main_rs = get_main_rs(&project);
    assert!(main_rs.contains("OPENROUTER_API_KEY"));
}
