//! Property-based tests for Skills Configuration Code Generation
//!
//! **Property 11: Skills Configuration Codegen**
//! **Validates: Requirements 13.1, 13.2, 13.4**
//!
//! For any AgentSchema with `auto_skills=true`, the generated code SHALL contain
//! `.with_auto_skills()`. For any ProjectSchema with `skills_directory` set, agent
//! builders SHALL contain `.with_skills_from_root("{path}")`. For any `skills_directory`
//! value starting with "/" or containing "..", the Codegen_Engine SHALL reject or
//! sanitize the path.

use adk_studio::codegen::{generate_skills_config, is_valid_skills_directory};
use adk_studio::schema::{AgentSchema, ProjectSchema};
use proptest::prelude::*;

// ============================================
// Arbitrary Generators
// ============================================

/// Generate a valid relative path (no leading "/" and no "..")
fn arb_valid_relative_path() -> impl Strategy<Value = String> {
    prop_oneof![
        Just("skills".to_string()),
        Just("my_skills".to_string()),
        Just("config/skills".to_string()),
        Just("./skills".to_string()),
        Just("agents/skills/v1".to_string()),
        "[a-z][a-z0-9_/]{0,20}".prop_filter("must not contain ..", |s| !s.contains("..")),
    ]
}

/// Generate an invalid path (starts with "/" or contains "..")
fn arb_invalid_path() -> impl Strategy<Value = String> {
    prop_oneof![
        // Paths starting with "/"
        "/[a-z]{1,10}".prop_map(|s| s),
        Just("/etc/skills".to_string()),
        Just("/absolute/path".to_string()),
        // Paths containing ".."
        "[a-z]{1,5}".prop_map(|s| format!("{}/../secret", s)),
        Just("../parent".to_string()),
        Just("skills/../../etc".to_string()),
    ]
}

/// Generate an AgentSchema with optional auto_skills
fn arb_agent_with_skills(auto_skills: Option<bool>) -> AgentSchema {
    let mut agent = AgentSchema::default();
    agent.auto_skills = auto_skills;
    agent
}

/// Generate a ProjectSchema with optional skills_directory
fn arb_project_with_skills_dir(skills_dir: Option<String>) -> ProjectSchema {
    let mut project = ProjectSchema::new("test-project");
    project.settings.skills_directory = skills_dir;
    project
}

// ============================================
// Property Tests — Task 10.4
// ============================================

proptest! {
    /// **Validates: Requirements 13.1**
    ///
    /// Property 11: When auto_skills is true, generated code contains `.with_auto_skills()`.
    #[test]
    fn auto_skills_true_emits_with_auto_skills(_dummy in 0..100u32) {
        let agent = arb_agent_with_skills(Some(true));
        let project = arb_project_with_skills_dir(None);
        let code = generate_skills_config(&agent, &project);

        prop_assert!(
            code.contains(".with_auto_skills()"),
            "Expected '.with_auto_skills()' in generated code when auto_skills=true, got: {}",
            code
        );
    }

    /// **Validates: Requirements 13.1**
    ///
    /// Property 11: When auto_skills is false or None, generated code does NOT contain `.with_auto_skills()`.
    #[test]
    fn auto_skills_false_or_none_no_auto_skills(
        auto_skills in prop_oneof![Just(None), Just(Some(false))],
    ) {
        let agent = arb_agent_with_skills(auto_skills);
        let project = arb_project_with_skills_dir(None);
        let code = generate_skills_config(&agent, &project);

        prop_assert!(
            !code.contains(".with_auto_skills()"),
            "Should NOT contain '.with_auto_skills()' when auto_skills is {:?}, got: {}",
            auto_skills, code
        );
    }

    /// **Validates: Requirements 13.2**
    ///
    /// Property 11: When skills_directory is set with a valid relative path,
    /// generated code contains `.with_skills_from_root("{path}")`.
    #[test]
    fn valid_skills_directory_emits_with_skills_from_root(
        path in arb_valid_relative_path(),
    ) {
        let agent = arb_agent_with_skills(None);
        let project = arb_project_with_skills_dir(Some(path.clone()));
        let code = generate_skills_config(&agent, &project);

        let expected = format!(".with_skills_from_root(\"{}\")", path);
        prop_assert!(
            code.contains(&expected),
            "Expected '{}' in generated code, got: {}",
            expected, code
        );
    }

    /// **Validates: Requirements 13.4**
    ///
    /// Property 11: When skills_directory starts with "/" or contains "..",
    /// the path is rejected (no `.with_skills_from_root()` in output, warning comment present).
    #[test]
    fn invalid_skills_directory_rejected(
        path in arb_invalid_path(),
    ) {
        let agent = arb_agent_with_skills(None);
        let project = arb_project_with_skills_dir(Some(path.clone()));
        let code = generate_skills_config(&agent, &project);

        prop_assert!(
            !code.contains(".with_skills_from_root("),
            "Invalid path '{}' should NOT produce .with_skills_from_root(), got: {}",
            path, code
        );
        prop_assert!(
            code.contains("// WARNING"),
            "Invalid path '{}' should produce a warning comment, got: {}",
            path, code
        );
    }

    /// **Validates: Requirements 13.1, 13.2**
    ///
    /// Property 11: When both auto_skills=true and a valid skills_directory are set,
    /// both `.with_auto_skills()` and `.with_skills_from_root()` appear in output.
    #[test]
    fn both_auto_skills_and_valid_directory(
        path in arb_valid_relative_path(),
    ) {
        let agent = arb_agent_with_skills(Some(true));
        let project = arb_project_with_skills_dir(Some(path.clone()));
        let code = generate_skills_config(&agent, &project);

        prop_assert!(
            code.contains(".with_auto_skills()"),
            "Expected '.with_auto_skills()' when auto_skills=true, got: {}",
            code
        );
        let expected = format!(".with_skills_from_root(\"{}\")", path);
        prop_assert!(
            code.contains(&expected),
            "Expected '{}' when skills_directory is set, got: {}",
            expected, code
        );
    }

    /// **Validates: Requirements 13.1, 13.2**
    ///
    /// Property 11: When neither auto_skills nor skills_directory is set,
    /// the output is empty.
    #[test]
    fn neither_condition_produces_empty_output(_dummy in 0..100u32) {
        let agent = arb_agent_with_skills(None);
        let project = arb_project_with_skills_dir(None);
        let code = generate_skills_config(&agent, &project);

        prop_assert!(
            code.is_empty(),
            "Expected empty output when neither condition is met, got: {}",
            code
        );
    }

    /// **Validates: Requirements 13.4**
    ///
    /// Property 11: is_valid_skills_directory correctly rejects absolute paths.
    #[test]
    fn absolute_paths_are_invalid(
        suffix in "[a-z]{1,20}",
    ) {
        let path = format!("/{}", suffix);
        prop_assert!(
            !is_valid_skills_directory(&path),
            "Path '{}' starting with '/' should be invalid",
            path
        );
    }

    /// **Validates: Requirements 13.4**
    ///
    /// Property 11: is_valid_skills_directory correctly rejects paths with "..".
    #[test]
    fn parent_traversal_paths_are_invalid(
        prefix in "[a-z]{1,10}",
        suffix in "[a-z]{1,10}",
    ) {
        let path = format!("{}/../{}", prefix, suffix);
        prop_assert!(
            !is_valid_skills_directory(&path),
            "Path '{}' containing '..' should be invalid",
            path
        );
    }

    /// **Validates: Requirements 13.4**
    ///
    /// Property 11: is_valid_skills_directory accepts valid relative paths.
    #[test]
    fn valid_relative_paths_are_accepted(
        path in arb_valid_relative_path(),
    ) {
        prop_assert!(
            is_valid_skills_directory(&path),
            "Path '{}' should be a valid relative path",
            path
        );
    }
}
