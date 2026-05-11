//! Property-based tests for Tool Confirmation Code Generation
//!
//! **Property 5: Tool Confirmation Codegen**
//! **Validates: Requirements 5.3, 5.4**
//!
//! For any AgentSchema, tools listed in `tools_requiring_confirmation` SHALL have
//! `.with_confirmation(true)` in the generated code, and tools NOT in that list
//! SHALL NOT have confirmation markup.

use adk_studio::codegen::generate_rust_project;
use adk_studio::schema::{AgentSchema, AgentType, Edge, ProjectSchema};
use proptest::prelude::*;
use proptest::sample::subsequence;
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

/// Available tool types that can be assigned to an agent
fn available_tools() -> Vec<String> {
    vec![
        "google_search".to_string(),
        "exit_loop".to_string(),
        "load_artifact".to_string(),
    ]
}

/// Generate a random subset of tools for the agent
fn arb_tool_subset() -> impl Strategy<Value = Vec<String>> {
    subsequence(available_tools(), 1..=3)
}

/// Generate a random subset of the agent's tools to require confirmation
fn arb_confirmation_subset(tools: Vec<String>) -> impl Strategy<Value = Vec<String>> {
    let len = tools.len();
    subsequence(tools, 0..=len)
}

/// Generate a ProjectSchema with tools and a non-empty confirmation list
fn arb_project_with_confirmation() -> impl Strategy<Value = (ProjectSchema, Vec<String>, Vec<String>)> {
    arb_tool_subset().prop_flat_map(|tools| {
        let tools_clone = tools.clone();
        let tools_for_confirm = tools.clone();
        (
            "[a-zA-Z][a-zA-Z0-9_]{2,15}",
            arb_model_name(),
            arb_instruction(),
            Just(tools_clone),
            arb_confirmation_subset(tools_for_confirm),
        )
            .prop_map(|(name, model, instruction, tools, confirmation_tools)| {
                let mut project = ProjectSchema::new(&name);

                let agent = AgentSchema {
                    agent_type: AgentType::Llm,
                    model: Some(model),
                    instruction,
                    tools: tools.clone(),
                    sub_agents: vec![],
                    position: Default::default(),
                    max_iterations: None,
                    temperature: None,
                    top_p: None,
                    top_k: None,
                    max_output_tokens: None,
                    routes: vec![],
                    tools_requiring_confirmation: confirmation_tools.clone(),
                    ..Default::default()
                };

                let mut agents = HashMap::new();
                agents.insert("main_agent".to_string(), agent);
                project.agents = agents;
                project.workflow.edges = vec![
                    Edge::new("START", "main_agent"),
                    Edge::new("main_agent", "END"),
                ];

                (project, tools, confirmation_tools)
            })
    })
}

/// Generate a ProjectSchema with tools but empty confirmation list
fn arb_project_without_confirmation() -> impl Strategy<Value = ProjectSchema> {
    (
        "[a-zA-Z][a-zA-Z0-9_]{2,15}",
        arb_model_name(),
        arb_instruction(),
        arb_tool_subset(),
    )
        .prop_map(|(name, model, instruction, tools)| {
            let mut project = ProjectSchema::new(&name);

            let agent = AgentSchema {
                agent_type: AgentType::Llm,
                model: Some(model),
                instruction,
                tools,
                sub_agents: vec![],
                position: Default::default(),
                max_iterations: None,
                temperature: None,
                top_p: None,
                top_k: None,
                max_output_tokens: None,
                routes: vec![],
                tools_requiring_confirmation: vec![],
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

/// Map tool type name to the struct constructor pattern in generated code
fn tool_constructor_pattern(tool_type: &str) -> &'static str {
    match tool_type {
        "google_search" => "GoogleSearchTool::new()",
        "exit_loop" => "ExitLoopTool::new()",
        "load_artifact" => "LoadArtifactsTool::new()",
        _ => "",
    }
}

// ============================================
// Property Tests — Task 6.3
// ============================================

proptest! {
    /// **Validates: Requirements 5.3, 5.4**
    ///
    /// Property 5: Tools in `tools_requiring_confirmation` get `.with_confirmation(true)`,
    /// and tools NOT in that list do NOT get `.with_confirmation(true)`.
    #[test]
    fn tools_in_confirmation_list_get_confirmation(
        (project, all_tools, confirmation_tools) in arb_project_with_confirmation()
    ) {
        let code = get_main_rs(&project);

        // Tools in the confirmation list MUST have .with_confirmation(true)
        for tool in &confirmation_tools {
            let pattern = tool_constructor_pattern(tool);
            if !pattern.is_empty() {
                // Find the line containing this tool's constructor
                let tool_line = code.lines()
                    .find(|l| l.contains(pattern))
                    .unwrap_or("");

                prop_assert!(
                    tool_line.contains(".with_confirmation(true)"),
                    "Tool '{}' is in tools_requiring_confirmation but generated code does not have .with_confirmation(true). Line: '{}'",
                    tool, tool_line
                );
            }
        }

        // Tools NOT in the confirmation list MUST NOT have .with_confirmation(true)
        for tool in &all_tools {
            if !confirmation_tools.contains(tool) {
                let pattern = tool_constructor_pattern(tool);
                if !pattern.is_empty() {
                    let tool_line = code.lines()
                        .find(|l| l.contains(pattern))
                        .unwrap_or("");

                    prop_assert!(
                        !tool_line.contains(".with_confirmation(true)"),
                        "Tool '{}' is NOT in tools_requiring_confirmation but generated code has .with_confirmation(true). Line: '{}'",
                        tool, tool_line
                    );
                }
            }
        }
    }

    /// **Validates: Requirements 5.4**
    ///
    /// Property 5: When `tools_requiring_confirmation` is empty, NO tool gets
    /// `.with_confirmation(true)` in the generated code.
    #[test]
    fn empty_confirmation_list_produces_no_confirmation_code(
        project in arb_project_without_confirmation()
    ) {
        let code = get_main_rs(&project);

        prop_assert!(
            !code.contains(".with_confirmation(true)"),
            "When tools_requiring_confirmation is empty, no tool should have .with_confirmation(true) in generated code"
        );
    }

    /// **Validates: Requirements 5.3**
    ///
    /// Property 5: Confirmation marking is applied AFTER read_only marking for
    /// tools that have both (google_search, load_artifact).
    #[test]
    fn confirmation_after_read_only(
        (project, _all_tools, confirmation_tools) in arb_project_with_confirmation()
    ) {
        let code = get_main_rs(&project);

        // In ADK 0.8.0, GoogleSearchTool and LoadArtifactsTool are inherently read-only
        // via their trait implementation, so .read_only(true) is no longer emitted.
        // Just verify that .with_confirmation(true) is present for confirmed tools.
        for tool in &confirmation_tools {
            if *tool == "google_search" || *tool == "load_artifact" {
                let pattern = tool_constructor_pattern(tool);
                let tool_line = code.lines()
                    .find(|l| l.contains(pattern))
                    .unwrap_or("");

                if !tool_line.is_empty() {
                    prop_assert!(
                        tool_line.contains(".with_confirmation(true)"),
                        "Tool '{}' in confirmation list should have .with_confirmation(true). Line: '{}'",
                        tool, tool_line
                    );
                    // Verify .read_only(true) is NOT present
                    prop_assert!(
                        !tool_line.contains(".read_only(true)"),
                        "Tool '{}' should NOT have .read_only(true) in ADK 0.8.0. Line: '{}'",
                        tool, tool_line
                    );
                }
            }
        }
    }
}
