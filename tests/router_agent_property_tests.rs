//! Property-based tests for Router Agent LlmConditionalAgent generation (Property 10)
//!
//! **Validates: Requirements 12.1, 12.2, 12.3**
//!
//! Property 10: For any router AgentSchema with N routes, the generated code SHALL contain
//! `LlmConditionalAgent::builder()`, exactly N `.condition()` calls (one per route with
//! correct condition and target), and the router's model and instruction configuration.

use adk_studio::codegen::generate_rust_project;
use adk_studio::schema::{AgentSchema, AgentType, Edge, ProjectSchema, Route};
use proptest::prelude::*;
use std::collections::HashMap;

/// Strategy to generate valid identifier strings (alphanumeric, starting with a letter)
fn valid_identifier() -> impl Strategy<Value = String> {
    "[a-z][a-z0-9_]{2,10}".prop_map(|s| s)
}

/// Strategy to generate valid condition strings (non-empty, no special chars that break codegen)
fn valid_condition() -> impl Strategy<Value = String> {
    "[a-z][a-z_ ]{2,15}".prop_map(|s| s.trim().to_string())
}

/// Strategy to generate a valid instruction string
fn valid_instruction() -> impl Strategy<Value = String> {
    "[A-Z][a-zA-Z ]{5,40}\\.".prop_map(|s| s)
}

/// Strategy to generate a router AgentSchema with N routes (1-5)
fn router_agent_strategy() -> impl Strategy<Value = (String, AgentSchema, Vec<(String, AgentSchema)>)>
{
    (
        valid_identifier(),
        valid_instruction(),
        prop::collection::vec((valid_condition(), valid_identifier()), 1..=5),
    )
        .prop_map(|(router_id, instruction, route_data)| {
            // Ensure unique target IDs by appending index
            let routes_with_unique_targets: Vec<(String, String)> = route_data
                .iter()
                .enumerate()
                .map(|(i, (cond, base_id))| {
                    (cond.clone(), format!("{}_{}", base_id, i))
                })
                .collect();

            let routes: Vec<Route> = routes_with_unique_targets
                .iter()
                .map(|(cond, target)| Route {
                    condition: cond.clone(),
                    target: target.clone(),
                })
                .collect();

            let router_agent = AgentSchema {
                agent_type: AgentType::Router,
                model: Some("gemini-3.1-flash-lite-preview".to_string()),
                instruction: instruction.clone(),
                tools: vec![],
                sub_agents: vec![],
                position: Default::default(),
                max_iterations: None,
                temperature: None,
                top_p: None,
                top_k: None,
                max_output_tokens: None,
                routes,
                ..Default::default()
            };

            // Create target agents
            let target_agents: Vec<(String, AgentSchema)> = routes_with_unique_targets
                .iter()
                .map(|(_, target_id)| {
                    (
                        target_id.clone(),
                        AgentSchema {
                            agent_type: AgentType::Llm,
                            model: Some("gemini-3.1-flash-lite-preview".to_string()),
                            instruction: format!("Handle {} tasks.", target_id),
                            ..Default::default()
                        },
                    )
                })
                .collect();

            (router_id, router_agent, target_agents)
        })
}

/// Build a complete project from a router agent and its targets
fn build_router_project(
    router_id: &str,
    router_agent: &AgentSchema,
    target_agents: &[(String, AgentSchema)],
) -> ProjectSchema {
    let mut agents = HashMap::new();
    agents.insert(router_id.to_string(), router_agent.clone());
    for (id, agent) in target_agents {
        agents.insert(id.clone(), agent.clone());
    }

    let mut edges = vec![Edge::new("START", router_id)];
    for (target_id, _) in target_agents {
        edges.push(Edge::new(router_id, target_id));
    }
    for (target_id, _) in target_agents {
        edges.push(Edge::new(target_id, "END"));
    }

    let mut p = ProjectSchema::new("router_test");
    p.agents = agents;
    p.workflow.edges = edges;
    p
}

/// Get the main.rs content from a generated project
fn get_main_rs(project: &ProjectSchema) -> String {
    let generated = generate_rust_project(project).unwrap();
    generated
        .files
        .iter()
        .find(|f| f.path == "src/main.rs")
        .unwrap()
        .content
        .clone()
}

proptest! {
    /// **Validates: Requirements 12.1**
    ///
    /// Property: Router agents produce code containing `LlmConditionalAgent::builder(`
    #[test]
    fn router_generates_llm_conditional_agent_builder(
        (router_id, router_agent, target_agents) in router_agent_strategy()
    ) {
        let project = build_router_project(&router_id, &router_agent, &target_agents);
        let code = get_main_rs(&project);

        prop_assert!(
            code.contains("LlmConditionalAgent::builder("),
            "Generated code must contain LlmConditionalAgent::builder(, got:\n{}",
            &code[..code.len().min(2000)]
        );
    }

    /// **Validates: Requirements 12.2**
    ///
    /// Property: Router agents produce exactly N .condition() calls matching the number of routes
    #[test]
    fn router_has_correct_number_of_condition_calls(
        (router_id, router_agent, target_agents) in router_agent_strategy()
    ) {
        let project = build_router_project(&router_id, &router_agent, &target_agents);
        let code = get_main_rs(&project);

        let expected_count = router_agent.routes.len();
        let actual_count = code.matches(".condition(").count();

        prop_assert_eq!(
            actual_count, expected_count,
            "Expected {} .condition() calls but found {} in generated code",
            expected_count, actual_count
        );
    }

    /// **Validates: Requirements 12.2**
    ///
    /// Property: Each route's condition string appears in the generated .condition() calls
    #[test]
    fn router_condition_strings_appear_in_output(
        (router_id, router_agent, target_agents) in router_agent_strategy()
    ) {
        let project = build_router_project(&router_id, &router_agent, &target_agents);
        let code = get_main_rs(&project);

        for route in &router_agent.routes {
            let expected_pattern = format!(".condition(\"{}\"", route.condition);
            prop_assert!(
                code.contains(&expected_pattern),
                "Generated code must contain condition pattern '{}' for route condition '{}'\nCode snippet: {}",
                expected_pattern,
                route.condition,
                &code[..code.len().min(2000)]
            );
        }
    }

    /// **Validates: Requirements 12.2**
    ///
    /// Property: Each route's target agent name appears in the generated .condition() calls
    #[test]
    fn router_target_agents_appear_in_condition_calls(
        (router_id, router_agent, target_agents) in router_agent_strategy()
    ) {
        let project = build_router_project(&router_id, &router_agent, &target_agents);
        let code = get_main_rs(&project);

        for route in &router_agent.routes {
            let expected_pattern = format!("{}_agent)", route.target);
            prop_assert!(
                code.contains(&expected_pattern),
                "Generated code must contain target agent '{}' in .condition() call\nCode snippet: {}",
                expected_pattern,
                &code[..code.len().min(2000)]
            );
        }
    }

    /// **Validates: Requirements 12.3**
    ///
    /// Property: Router's model configuration appears in the generated LlmConditionalAgent builder
    #[test]
    fn router_includes_model_configuration(
        (router_id, router_agent, target_agents) in router_agent_strategy()
    ) {
        let project = build_router_project(&router_id, &router_agent, &target_agents);
        let code = get_main_rs(&project);

        // The router uses gemini model, so GeminiModel should appear
        prop_assert!(
            code.contains("GeminiModel::new("),
            "Generated code must contain model configuration (GeminiModel::new)"
        );
    }

    /// **Validates: Requirements 12.3**
    ///
    /// Property: Router's instruction appears in the generated LlmConditionalAgent builder
    #[test]
    fn router_includes_instruction_configuration(
        (router_id, router_agent, target_agents) in router_agent_strategy()
    ) {
        let project = build_router_project(&router_id, &router_agent, &target_agents);
        let code = get_main_rs(&project);

        // The instruction should appear in the generated code (escaped)
        let escaped_instruction = router_agent.instruction
            .replace('\\', "\\\\")
            .replace('"', "\\\"")
            .replace('\n', "\\n");
        let expected_pattern = format!(".instruction(\"{}\")", escaped_instruction);
        prop_assert!(
            code.contains(&expected_pattern),
            "Generated code must contain instruction '{}'\nCode snippet: {}",
            expected_pattern,
            &code[..code.len().min(2000)]
        );
    }

    /// **Validates: Requirements 12.1**
    ///
    /// Property: Router agents import LlmConditionalAgent
    #[test]
    fn router_imports_llm_conditional_agent(
        (router_id, router_agent, target_agents) in router_agent_strategy()
    ) {
        let project = build_router_project(&router_id, &router_agent, &target_agents);
        let code = get_main_rs(&project);

        prop_assert!(
            code.contains("LlmConditionalAgent"),
            "Generated code must import LlmConditionalAgent"
        );
    }
}
