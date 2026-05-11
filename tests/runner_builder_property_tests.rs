//! Property-based tests for Runner Builder Code Generation
//!
//! **Property 1: Runner Builder Pattern Generation**
//! **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
//!
//! For any valid ProjectSchema, the generated runner initialization code SHALL use
//! the `Runner::builder()` typestate pattern (containing "Runner::builder(") and
//! SHALL NOT contain `Runner::new(RunnerConfig`. When `sqlite_checkpointer` is
//! enabled, the output SHALL contain checkpointer setup. When `context_compaction`
//! is enabled, the output SHALL contain compaction config. The builder chain SHALL
//! always terminate with `.build()?`.

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

fn arb_tools() -> impl Strategy<Value = Vec<String>> {
    prop::collection::vec(
        prop_oneof![
            Just("google_search".to_string()),
            Just("exit_loop".to_string()),
        ],
        0..3,
    )
}

/// Generate a valid ProjectSchema with a single LLM agent and workflow edges
fn arb_project_schema() -> impl Strategy<Value = ProjectSchema> {
    (
        "[a-zA-Z][a-zA-Z0-9_]{2,15}",
        arb_model_name(),
        arb_instruction(),
        arb_tools(),
        prop::option::of(prop::bool::ANY), // sqlite_checkpointer
        prop::option::of(prop::bool::ANY), // context_compaction
    )
        .prop_map(
            |(name, model, instruction, tools, sqlite_checkpointer, context_compaction)| {
                let mut project = ProjectSchema::new(&name);
                project.settings.sqlite_checkpointer = sqlite_checkpointer;
                project.settings.context_compaction = context_compaction;

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
            },
        )
}

/// Generate a ProjectSchema with sqlite_checkpointer explicitly set to Some(true)
fn arb_project_with_checkpointer() -> impl Strategy<Value = ProjectSchema> {
    (
        "[a-zA-Z][a-zA-Z0-9_]{2,15}",
        arb_model_name(),
        arb_instruction(),
    )
        .prop_map(|(name, model, instruction)| {
            let mut project = ProjectSchema::new(&name);
            project.settings.sqlite_checkpointer = Some(true);

            let agent = AgentSchema {
                agent_type: AgentType::Llm,
                model: Some(model),
                instruction,
                tools: vec![],
                sub_agents: vec![],
                position: Default::default(),
                max_iterations: None,
                temperature: None,
                top_p: None,
                top_k: None,
                max_output_tokens: None,
                routes: vec![],
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

/// Generate a ProjectSchema with context_compaction explicitly set to Some(true)
fn arb_project_with_compaction() -> impl Strategy<Value = ProjectSchema> {
    (
        "[a-zA-Z][a-zA-Z0-9_]{2,15}",
        arb_model_name(),
        arb_instruction(),
    )
        .prop_map(|(name, model, instruction)| {
            let mut project = ProjectSchema::new(&name);
            project.settings.context_compaction = Some(true);

            let agent = AgentSchema {
                agent_type: AgentType::Llm,
                model: Some(model),
                instruction,
                tools: vec![],
                sub_agents: vec![],
                position: Default::default(),
                max_iterations: None,
                temperature: None,
                top_p: None,
                top_k: None,
                max_output_tokens: None,
                routes: vec![],
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

/// Generate a ProjectSchema with both flags as None or Some(false)
fn arb_project_without_checkpointer_or_compaction() -> impl Strategy<Value = ProjectSchema> {
    (
        "[a-zA-Z][a-zA-Z0-9_]{2,15}",
        arb_model_name(),
        arb_instruction(),
        prop_oneof![Just(None), Just(Some(false))], // sqlite_checkpointer
        prop_oneof![Just(None), Just(Some(false))], // context_compaction
    )
        .prop_map(
            |(name, model, instruction, sqlite_checkpointer, context_compaction)| {
                let mut project = ProjectSchema::new(&name);
                project.settings.sqlite_checkpointer = sqlite_checkpointer;
                project.settings.context_compaction = context_compaction;

                let agent = AgentSchema {
                    agent_type: AgentType::Llm,
                    model: Some(model),
                    instruction,
                    tools: vec![],
                    sub_agents: vec![],
                    position: Default::default(),
                    max_iterations: None,
                    temperature: None,
                    top_p: None,
                    top_k: None,
                    max_output_tokens: None,
                    routes: vec![],
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
            },
        )
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
// Property Tests — Task 2.5
// ============================================

proptest! {
    /// **Validates: Requirements 1.1, 1.4**
    ///
    /// Property 1: For any ProjectSchema, generated runner code contains
    /// "Runner::builder(" and not "Runner::new(RunnerConfig".
    /// The builder chain always terminates with ".build()?".
    #[test]
    fn runner_code_uses_builder_pattern_not_runner_new(
        project in arb_project_schema()
    ) {
        let code = get_main_rs(&project);

        // Must contain Runner::builder(
        prop_assert!(
            code.contains("Runner::builder("),
            "Generated code must contain Runner::builder( but got:\n{}",
            &code[code.len().saturating_sub(500)..]
        );

        // Must NOT contain Runner::new(RunnerConfig
        prop_assert!(
            !code.contains("Runner::new(RunnerConfig"),
            "Generated code must NOT contain Runner::new(RunnerConfig"
        );

        // Must contain .build()?
        prop_assert!(
            code.contains(".build()?"),
            "Generated code must contain .build()?"
        );

        // Must contain .app_name(
        prop_assert!(
            code.contains(".app_name("),
            "Generated code must contain .app_name("
        );

        // Must contain .agent(
        prop_assert!(
            code.contains(".agent("),
            "Generated code must contain .agent("
        );

        // Must contain .session_service(
        prop_assert!(
            code.contains(".session_service("),
            "Generated code must contain .session_service("
        );
    }
}

// ============================================
// Property Tests — Task 2.6
// ============================================

proptest! {
    /// **Validates: Requirements 1.2**
    ///
    /// Property 1: When sqlite_checkpointer is Some(true), generated code
    /// contains "SqliteCheckpointer" import.
    #[test]
    fn checkpointer_appears_when_enabled(
        project in arb_project_with_checkpointer()
    ) {
        let code = get_main_rs(&project);

        prop_assert!(
            code.contains("SqliteCheckpointer"),
            "Generated code must contain SqliteCheckpointer when sqlite_checkpointer is enabled"
        );
    }

    /// **Validates: Requirements 1.3**
    ///
    /// Property 1: When context_compaction is Some(true), generated code
    /// contains "compaction_config" setup.
    #[test]
    fn compaction_appears_when_enabled(
        project in arb_project_with_compaction()
    ) {
        let code = get_main_rs(&project);

        prop_assert!(
            code.contains("compaction_config"),
            "Generated code must contain compaction_config when context_compaction is enabled"
        );
        prop_assert!(
            code.contains("EventsCompactionConfig::default()"),
            "Generated code must contain EventsCompactionConfig::default()"
        );
    }

    /// **Validates: Requirements 1.2, 1.3**
    ///
    /// Property 1: When both sqlite_checkpointer and context_compaction are
    /// None or Some(false), neither SqliteCheckpointer nor compaction_config
    /// appears in generated code.
    #[test]
    fn checkpointer_and_compaction_absent_when_disabled(
        project in arb_project_without_checkpointer_or_compaction()
    ) {
        let code = get_main_rs(&project);

        prop_assert!(
            !code.contains("SqliteCheckpointer"),
            "Generated code must NOT contain SqliteCheckpointer when disabled"
        );
        prop_assert!(
            !code.contains("compaction_config"),
            "Generated code must NOT contain compaction_config when disabled"
        );
    }
}
