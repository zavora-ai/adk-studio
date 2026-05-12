//! Property-based tests for Generated Cargo.toml Correctness
//!
//! **Property 13: Generated Cargo.toml Correctness**
//! **Validates: Requirements 15.2, 15.3, 15.4**
//!
//! For any valid ProjectSchema, the generated Cargo.toml SHALL:
//! (a) include `adk-checkpointer-sqlite` only when `sqlite_checkpointer` is enabled,
//! (b) include only feature flags for providers actually used in the project,
//! (c) target version "0.8.0" for all adk crate dependencies.

use adk_studio::codegen::{detect_provider, generate_rust_project};
use adk_studio::schema::{AgentSchema, AgentType, Edge, ProjectSchema};
use proptest::prelude::*;
use std::collections::HashMap;

// ============================================
// Helpers
// ============================================

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

/// All known provider feature flag names that can appear in adk-model features
const ALL_PROVIDER_FEATURES: &[&str] = &[
    "gemini",
    "openai",
    "anthropic",
    "deepseek",
    "groq",
    "ollama",
    "fireworks",
    "together",
    "mistral",
    "perplexity",
    "cerebras",
    "sambanova",
    "bedrock",
    "azure-ai",
    "openrouter",
];

/// Extract the feature flags from the adk-model dependency line in Cargo.toml
fn extract_model_features(cargo_toml: &str) -> Vec<String> {
    // Find the adk-model line and extract features
    for line in cargo_toml.lines() {
        if line.contains("adk-model") && line.contains("features") {
            // Extract the features array content between [ and ]
            if let Some(start) = line.find("features = [") {
                let after_bracket = &line[start + 12..];
                if let Some(end) = after_bracket.find(']') {
                    let features_str = &after_bracket[..end];
                    return features_str
                        .split(',')
                        .map(|s| s.trim().trim_matches('"').to_string())
                        .filter(|s| !s.is_empty())
                        .collect();
                }
            }
        }
    }
    vec![]
}

// ============================================
// Arbitrary Generators
// ============================================

/// Generate a random subset of providers to use in a project
fn arb_provider_set() -> impl Strategy<Value = Vec<&'static str>> {
    prop::sample::subsequence(
        &[
            "gemini",
            "openai",
            "anthropic",
            "deepseek",
            "groq",
            "openrouter",
        ],
        1..=4,
    )
}

/// Generate a project with agents using specific providers
fn arb_project_with_providers(
    providers: Vec<&'static str>,
    sqlite_checkpointer: Option<bool>,
) -> ProjectSchema {
    let mut project = ProjectSchema::new("test_project");
    project.settings.sqlite_checkpointer = sqlite_checkpointer;

    let mut agents = HashMap::new();
    let mut edges = vec![];

    for (i, provider) in providers.iter().enumerate() {
        let agent_id = format!("agent_{}", i);
        let model = match *provider {
            "gemini" => "gemini-2.5-flash".to_string(),
            "openai" => "gpt-4o".to_string(),
            "anthropic" => "claude-sonnet-4-6".to_string(),
            "deepseek" => "deepseek-chat".to_string(),
            "groq" => "llama3-70b".to_string(),
            "openrouter" => "anthropic/claude-sonnet-4-6".to_string(),
            _ => "gemini-2.5-flash".to_string(),
        };

        // Verify our model-to-provider mapping is correct
        debug_assert_eq!(
            detect_provider(&model),
            *provider,
            "Model '{}' should map to provider '{}'",
            model,
            provider
        );

        agents.insert(
            agent_id.clone(),
            AgentSchema {
                agent_type: AgentType::Llm,
                model: Some(model),
                instruction: format!("Agent {} instruction.", i),
                ..Default::default()
            },
        );

        if i == 0 {
            edges.push(Edge::new("START", &agent_id));
        }
        if i == providers.len() - 1 {
            edges.push(Edge::new(&agent_id, "END"));
        }
        if i > 0 {
            let prev_id = format!("agent_{}", i - 1);
            edges.push(Edge::new(&prev_id, &agent_id));
        }
    }

    project.agents = agents;
    project.workflow.edges = edges;
    project
}

/// Generate a valid ProjectSchema with random providers and sqlite_checkpointer setting
fn arb_project_schema() -> impl Strategy<Value = ProjectSchema> {
    (
        arb_provider_set(),
        prop_oneof![Just(None), Just(Some(true)), Just(Some(false))],
    )
        .prop_map(|(providers, sqlite_checkpointer)| {
            arb_project_with_providers(providers, sqlite_checkpointer)
        })
}

/// Generate a project with sqlite_checkpointer explicitly enabled
fn arb_project_with_sqlite() -> impl Strategy<Value = ProjectSchema> {
    arb_provider_set().prop_map(|providers| arb_project_with_providers(providers, Some(true)))
}

/// Generate a project with sqlite_checkpointer disabled or unset
fn arb_project_without_sqlite() -> impl Strategy<Value = ProjectSchema> {
    (
        arb_provider_set(),
        prop_oneof![Just(None), Just(Some(false))],
    )
        .prop_map(|(providers, sqlite)| arb_project_with_providers(providers, sqlite))
}

/// Generate a project with a single specific provider
fn arb_single_provider_project() -> impl Strategy<Value = (ProjectSchema, &'static str)> {
    prop_oneof![
        Just("gemini"),
        Just("openai"),
        Just("anthropic"),
        Just("deepseek"),
        Just("groq"),
        Just("openrouter"),
    ]
    .prop_map(|provider| {
        let project = arb_project_with_providers(vec![provider], None);
        (project, provider)
    })
}

// ============================================
// Property Tests — Task 11.4 (Property 13)
// ============================================

proptest! {
    /// **Validates: Requirements 15.2**
    ///
    /// Property 13(a): Cargo.toml contains `adk-checkpointer-sqlite` ONLY when
    /// `sqlite_checkpointer` is enabled.
    #[test]
    fn sqlite_checkpointer_dep_present_when_enabled(
        project in arb_project_with_sqlite()
    ) {
        let cargo_toml = get_cargo_toml(&project);

        prop_assert!(
            cargo_toml.contains("adk-checkpointer-sqlite"),
            "Cargo.toml must contain adk-checkpointer-sqlite when sqlite_checkpointer is enabled"
        );
        prop_assert!(
            cargo_toml.contains("adk-checkpointer-sqlite = \"0.8.0\""),
            "adk-checkpointer-sqlite must be version 0.8.0"
        );
    }

    /// **Validates: Requirements 15.2**
    ///
    /// Property 13(a): Cargo.toml does NOT contain `adk-checkpointer-sqlite` when
    /// `sqlite_checkpointer` is disabled or unset.
    #[test]
    fn sqlite_checkpointer_dep_absent_when_disabled(
        project in arb_project_without_sqlite()
    ) {
        let cargo_toml = get_cargo_toml(&project);

        prop_assert!(
            !cargo_toml.contains("adk-checkpointer-sqlite"),
            "Cargo.toml must NOT contain adk-checkpointer-sqlite when sqlite_checkpointer is disabled"
        );
    }

    /// **Validates: Requirements 15.3**
    ///
    /// Property 13(b): Only feature flags for providers actually used in the project
    /// are included in the adk-model features list.
    #[test]
    fn only_used_provider_features_included(
        project in arb_project_schema()
    ) {
        let cargo_toml = get_cargo_toml(&project);
        let features = extract_model_features(&cargo_toml);

        // Determine which providers are actually used by agents
        let mut expected_providers: std::collections::HashSet<&str> = std::collections::HashSet::new();
        for agent in project.agents.values() {
            let model = agent.model.as_deref().unwrap_or("gemini-3.1-flash-lite-preview");
            expected_providers.insert(detect_provider(model));
        }

        // Every feature in the Cargo.toml must correspond to a provider actually used
        for feature in &features {
            prop_assert!(
                expected_providers.contains(feature.as_str()),
                "Feature '{}' in Cargo.toml is not used by any agent. Used providers: {:?}",
                feature,
                expected_providers
            );
        }

        // Every provider used must have its feature in the Cargo.toml
        for provider in &expected_providers {
            prop_assert!(
                features.contains(&provider.to_string()),
                "Provider '{}' is used by an agent but its feature is missing from Cargo.toml. Features: {:?}",
                provider,
                features
            );
        }
    }

    /// **Validates: Requirements 15.3**
    ///
    /// Property 13(b): For a single-provider project, only that provider's feature
    /// flag appears in the Cargo.toml.
    #[test]
    fn single_provider_only_has_its_feature(
        (project, provider) in arb_single_provider_project()
    ) {
        let cargo_toml = get_cargo_toml(&project);
        let features = extract_model_features(&cargo_toml);

        // The provider's feature must be present
        prop_assert!(
            features.contains(&provider.to_string()),
            "Cargo.toml must contain feature '{}' for single-provider project. Features: {:?}",
            provider,
            features
        );

        // No other provider features should be present
        for other_feature in ALL_PROVIDER_FEATURES {
            if *other_feature != provider {
                prop_assert!(
                    !features.contains(&other_feature.to_string()),
                    "Cargo.toml should NOT contain feature '{}' when only '{}' is used. Features: {:?}",
                    other_feature,
                    provider,
                    features
                );
            }
        }
    }

    /// **Validates: Requirements 15.4**
    ///
    /// Property 13(c): All adk crate dependencies target version "0.8.0".
    #[test]
    fn all_adk_crates_at_version_0_8_0(
        project in arb_project_schema()
    ) {
        let cargo_toml = get_cargo_toml(&project);

        // Check each line for adk crate dependencies
        for line in cargo_toml.lines() {
            let trimmed = line.trim();
            // Match lines that start with "adk-" (dependency declarations)
            if trimmed.starts_with("adk-") {
                // Simple version format: adk-foo = "X.Y.Z"
                if trimmed.contains("= \"") && !trimmed.contains('{') {
                    prop_assert!(
                        trimmed.contains("\"0.8.0\""),
                        "ADK crate dependency should be version 0.8.0: {}",
                        trimmed
                    );
                }
                // Complex version format: adk-foo = { version = "X.Y.Z", ... }
                if trimmed.contains("version = \"") {
                    prop_assert!(
                        trimmed.contains("version = \"0.8.0\""),
                        "ADK crate dependency should have version 0.8.0: {}",
                        trimmed
                    );
                }
            }
        }
    }

    /// **Validates: Requirements 15.2, 15.3, 15.4**
    ///
    /// Property 13 (combined): For any valid ProjectSchema, the generated Cargo.toml
    /// satisfies all three sub-properties simultaneously.
    #[test]
    fn cargo_toml_correctness_combined(
        project in arb_project_schema()
    ) {
        let cargo_toml = get_cargo_toml(&project);

        // (a) adk-checkpointer-sqlite present iff sqlite_checkpointer is enabled
        let sqlite_enabled = project.settings.sqlite_checkpointer == Some(true);
        let has_sqlite_dep = cargo_toml.contains("adk-checkpointer-sqlite");
        prop_assert_eq!(
            sqlite_enabled,
            has_sqlite_dep,
            "adk-checkpointer-sqlite presence ({}) must match sqlite_checkpointer setting ({})",
            has_sqlite_dep,
            sqlite_enabled
        );

        // (b) Only used provider features are included
        let features = extract_model_features(&cargo_toml);
        let mut expected_providers: std::collections::HashSet<&str> = std::collections::HashSet::new();
        for agent in project.agents.values() {
            let model = agent.model.as_deref().unwrap_or("gemini-3.1-flash-lite-preview");
            expected_providers.insert(detect_provider(model));
        }
        for feature in &features {
            prop_assert!(
                expected_providers.contains(feature.as_str()),
                "Unexpected feature '{}' in Cargo.toml",
                feature
            );
        }
        for provider in &expected_providers {
            prop_assert!(
                features.contains(&provider.to_string()),
                "Missing feature '{}' in Cargo.toml",
                provider
            );
        }

        // (c) All adk crates at version 0.8.0
        for line in cargo_toml.lines() {
            let trimmed = line.trim();
            if trimmed.starts_with("adk-") {
                if trimmed.contains("= \"") && !trimmed.contains('{') {
                    prop_assert!(
                        trimmed.contains("\"0.8.0\""),
                        "ADK crate not at 0.8.0: {}",
                        trimmed
                    );
                }
                if trimmed.contains("version = \"") {
                    prop_assert!(
                        trimmed.contains("version = \"0.8.0\""),
                        "ADK crate not at 0.8.0: {}",
                        trimmed
                    );
                }
            }
        }
    }
}
