//! Property-based tests for Read-Only Tool Generation
//!
//! **Property 3: Read-Only Tools Are Inherently Read-Only**
//! **Validates: Requirements 3.1, 3.2, 3.3**
//!
//! In ADK 0.8.0, `GoogleSearchTool` and `LoadArtifactsTool` are inherently read-only
//! via their `is_read_only()` trait implementation. They do NOT need `.read_only(true)`
//! called on them. The generated code should use `GoogleSearchTool::new()` and
//! `LoadArtifactsTool::new()` without `.read_only(true)`.

use adk_studio::codegen::generate_rust_project;
use adk_studio::schema::{AgentSchema, AgentType, Edge, ProjectSchema};
use proptest::prelude::*;
use std::collections::HashMap;

// ============================================
// Arbitrary Generators
// ============================================

fn arb_model_name() -> impl Strategy<Value = String> {
    prop_oneof![
        Just("gemini-2.5-flash".to_string()),
        Just("gemini-3.1-flash-lite-preview".to_string()),
        Just("claude-sonnet-4-6".to_string()),
        Just("gpt-4o".to_string()),
    ]
}

fn arb_instruction() -> impl Strategy<Value = String> {
    "[a-zA-Z ]{1,50}"
}

/// Generate a tool execution strategy (including None)
fn arb_tool_execution_strategy() -> impl Strategy<Value = Option<String>> {
    prop_oneof![
        Just(None),
        Just(Some("auto".to_string())),
        Just(Some("sequential".to_string())),
        Just(Some("parallel".to_string())),
    ]
}

/// Generate a ProjectSchema with google_search tool and any strategy
fn arb_project_with_google_search() -> impl Strategy<Value = ProjectSchema> {
    (
        "[a-zA-Z][a-zA-Z0-9_]{2,15}",
        arb_model_name(),
        arb_instruction(),
        arb_tool_execution_strategy(),
    )
        .prop_map(|(name, model, instruction, strategy)| {
            let mut project = ProjectSchema::new(&name);

            let agent = AgentSchema {
                agent_type: AgentType::Llm,
                model: Some(model),
                instruction,
                tools: vec!["google_search".to_string()],
                sub_agents: vec![],
                position: Default::default(),
                max_iterations: None,
                temperature: None,
                top_p: None,
                top_k: None,
                max_output_tokens: None,
                routes: vec![],
                tool_execution_strategy: strategy,
                ..Default::default()
            };

            let mut agents = HashMap::new();
            agents.insert("main_agent".to_string(), agent);
            project.agents = agents;
            project.workflow.edges = vec![
                Edge::new("START", "main_agent"),
                Edge::new("main_agent", "END"),
            ];

            project
        })
}

/// Generate a ProjectSchema with load_artifact tool and any strategy
fn arb_project_with_load_artifacts() -> impl Strategy<Value = ProjectSchema> {
    (
        "[a-zA-Z][a-zA-Z0-9_]{2,15}",
        arb_model_name(),
        arb_instruction(),
        arb_tool_execution_strategy(),
    )
        .prop_map(|(name, model, instruction, strategy)| {
            let mut project = ProjectSchema::new(&name);

            let agent = AgentSchema {
                agent_type: AgentType::Llm,
                model: Some(model),
                instruction,
                tools: vec!["load_artifact".to_string()],
                sub_agents: vec![],
                position: Default::default(),
                max_iterations: None,
                temperature: None,
                top_p: None,
                top_k: None,
                max_output_tokens: None,
                routes: vec![],
                tool_execution_strategy: strategy,
                ..Default::default()
            };

            let mut agents = HashMap::new();
            agents.insert("main_agent".to_string(), agent);
            project.agents = agents;
            project.workflow.edges = vec![
                Edge::new("START", "main_agent"),
                Edge::new("main_agent", "END"),
            ];

            project
        })
}

/// Generate a ProjectSchema with both tools and any strategy
fn arb_project_with_both_tools() -> impl Strategy<Value = ProjectSchema> {
    (
        "[a-zA-Z][a-zA-Z0-9_]{2,15}",
        arb_model_name(),
        arb_instruction(),
        arb_tool_execution_strategy(),
    )
        .prop_map(|(name, model, instruction, strategy)| {
            let mut project = ProjectSchema::new(&name);

            let agent = AgentSchema {
                agent_type: AgentType::Llm,
                model: Some(model),
                instruction,
                tools: vec![
                    "google_search".to_string(),
                    "load_artifact".to_string(),
                ],
                sub_agents: vec![],
                position: Default::default(),
                max_iterations: None,
                temperature: None,
                top_p: None,
                top_k: None,
                max_output_tokens: None,
                routes: vec![],
                tool_execution_strategy: strategy,
                ..Default::default()
            };

            let mut agents = HashMap::new();
            agents.insert("main_agent".to_string(), agent);
            project.agents = agents;
            project.workflow.edges = vec![
                Edge::new("START", "main_agent"),
                Edge::new("main_agent", "END"),
            ];

            project
        })
}

/// Generate a ProjectSchema with only non-read-only tools (exit_loop)
fn arb_project_with_non_readonly_tools() -> impl Strategy<Value = ProjectSchema> {
    (
        "[a-zA-Z][a-zA-Z0-9_]{2,15}",
        arb_model_name(),
        arb_instruction(),
        arb_tool_execution_strategy(),
    )
        .prop_map(|(name, model, instruction, strategy)| {
            let mut project = ProjectSchema::new(&name);

            let agent = AgentSchema {
                agent_type: AgentType::Llm,
                model: Some(model),
                instruction,
                tools: vec!["exit_loop".to_string()],
                sub_agents: vec![],
                position: Default::default(),
                max_iterations: None,
                temperature: None,
                top_p: None,
                top_k: None,
                max_output_tokens: None,
                routes: vec![],
                tool_execution_strategy: strategy,
                ..Default::default()
            };

            let mut agents = HashMap::new();
            agents.insert("main_agent".to_string(), agent);
            project.agents = agents;
            project.workflow.edges = vec![
                Edge::new("START", "main_agent"),
                Edge::new("main_agent", "END"),
            ];

            project
        })
}

// ============================================
// Helper
// ============================================

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

// ============================================
// Property Tests — Task 4.3
// ============================================

proptest! {
    /// **Validates: Requirements 3.1, 3.3**
    ///
    /// Property 3: GoogleSearchTool is generated with just `::new()` — no `.read_only(true)`
    /// because it is inherently read-only via its trait implementation in ADK 0.8.0.
    #[test]
    fn google_search_tool_no_read_only(
        project in arb_project_with_google_search()
    ) {
        let code = get_main_rs(&project);

        // GoogleSearchTool should be present
        prop_assert!(
            code.contains("GoogleSearchTool::new()"),
            "GoogleSearchTool::new() should be present in generated code, got:\n{}",
            code.lines()
                .filter(|l| l.contains("GoogleSearchTool"))
                .collect::<Vec<_>>()
                .join("\n")
        );

        // Must NOT have .read_only(true) on GoogleSearchTool
        prop_assert!(
            !code.contains("GoogleSearchTool::new().read_only(true)"),
            "GoogleSearchTool must NOT have .read_only(true) — it is inherently read-only in ADK 0.8.0"
        );
    }

    /// **Validates: Requirements 3.2, 3.3**
    ///
    /// Property 3: LoadArtifactsTool is generated with just `::new()` — no `.read_only(true)`
    /// because it is inherently read-only via its trait implementation in ADK 0.8.0.
    #[test]
    fn load_artifacts_tool_no_read_only(
        project in arb_project_with_load_artifacts()
    ) {
        let code = get_main_rs(&project);

        // LoadArtifactsTool should be present
        prop_assert!(
            code.contains("LoadArtifactsTool::new()"),
            "LoadArtifactsTool::new() should be present in generated code, got:\n{}",
            code.lines()
                .filter(|l| l.contains("LoadArtifactsTool"))
                .collect::<Vec<_>>()
                .join("\n")
        );

        // Must NOT have .read_only(true) on LoadArtifactsTool
        prop_assert!(
            !code.contains("LoadArtifactsTool::new().read_only(true)"),
            "LoadArtifactsTool must NOT have .read_only(true) — it is inherently read-only in ADK 0.8.0"
        );
    }

    /// **Validates: Requirements 3.1, 3.2, 3.3**
    ///
    /// Property 3: When both tools are present, neither has `.read_only(true)`.
    #[test]
    fn both_tools_no_read_only(
        project in arb_project_with_both_tools()
    ) {
        let code = get_main_rs(&project);

        prop_assert!(
            !code.contains(".read_only(true)"),
            "Generated code must NOT contain .read_only(true) for any tool"
        );
        prop_assert!(
            code.contains("GoogleSearchTool::new()"),
            "GoogleSearchTool::new() should be present"
        );
        prop_assert!(
            code.contains("LoadArtifactsTool::new()"),
            "LoadArtifactsTool::new() should be present"
        );
    }

    /// **Validates: Requirements 3.1, 3.2**
    ///
    /// Property 3: Non-read-only tools (like ExitLoopTool) also don't get `.read_only(true)`.
    #[test]
    fn non_readonly_tools_not_marked(
        project in arb_project_with_non_readonly_tools()
    ) {
        let code = get_main_rs(&project);

        // ExitLoopTool should NOT have read_only
        prop_assert!(
            !code.contains(".read_only(true)"),
            "No tool should have .read_only(true) in generated code"
        );

        // Verify ExitLoopTool is present
        prop_assert!(
            code.contains("ExitLoopTool::new()"),
            "ExitLoopTool::new() should be present in generated code"
        );
    }
}
