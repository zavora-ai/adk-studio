use serde::{Deserialize, Serialize};

/// Agent definition schema
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentSchema {
    #[serde(rename = "type")]
    pub agent_type: AgentType,
    #[serde(default)]
    pub model: Option<String>,
    #[serde(default)]
    pub instruction: String,
    #[serde(default)]
    pub tools: Vec<String>,
    #[serde(default)]
    pub sub_agents: Vec<String>,
    #[serde(default)]
    pub position: Position,
    #[serde(default)]
    pub max_iterations: Option<u32>,
    /// Generation config: temperature (0.0 - 2.0)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub temperature: Option<f32>,
    /// Generation config: top_p (0.0 - 1.0)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub top_p: Option<f32>,
    /// Generation config: top_k
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub top_k: Option<i32>,
    /// Generation config: max output tokens
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub max_output_tokens: Option<i32>,
    /// For router agents: condition -> target agent mapping
    #[serde(default)]
    pub routes: Vec<Route>,

    // === Work Stream 2: Agent Properties Extensions ===
    /// Tool timeout in seconds (default: 300)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub tool_timeout_secs: Option<u32>,

    /// Max LLM iterations before stopping (default: 100)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub max_llm_iterations: Option<u32>,

    /// Per-tool retry budget (1-5 retries)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub tool_retry_budget: Option<u8>,

    /// Circuit breaker threshold (consecutive failures before tripping)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub circuit_breaker_threshold: Option<u8>,

    /// Tools requiring human confirmation before execution
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub tools_requiring_confirmation: Vec<String>,

    /// Tool execution strategy: "sequential", "parallel", "auto"
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub tool_execution_strategy: Option<String>,

    // === Work Stream 3: Model-Specific Configuration ===
    /// Anthropic extended thinking toggle
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub extended_thinking: Option<bool>,

    /// Anthropic extended thinking token budget (1024-32768)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub thinking_budget_tokens: Option<u32>,

    /// OpenAI o-series reasoning effort: "low", "medium", "high"
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reasoning_effort: Option<String>,

    /// Anthropic prompt caching toggle
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub prompt_caching: Option<bool>,

    // === Work Stream 5: Skills ===
    /// Enable auto-skills loading
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub auto_skills: Option<bool>,
}

/// A conditional route
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Route {
    pub condition: String,
    pub target: String,
}

impl AgentSchema {
    pub fn llm(model: impl Into<String>) -> Self {
        Self {
            agent_type: AgentType::Llm,
            model: Some(model.into()),
            instruction: String::new(),
            tools: Vec::new(),
            sub_agents: Vec::new(),
            position: Position::default(),
            max_iterations: None,
            temperature: None,
            top_p: None,
            top_k: None,
            max_output_tokens: None,
            routes: Vec::new(),
            // Work Stream 2: Agent Properties Extensions
            tool_timeout_secs: None,
            max_llm_iterations: None,
            tool_retry_budget: None,
            circuit_breaker_threshold: None,
            tools_requiring_confirmation: Vec::new(),
            tool_execution_strategy: None,
            // Work Stream 3: Model-Specific Configuration
            extended_thinking: None,
            thinking_budget_tokens: None,
            reasoning_effort: None,
            prompt_caching: None,
            // Work Stream 5: Skills
            auto_skills: None,
        }
    }

    pub fn with_instruction(mut self, instruction: impl Into<String>) -> Self {
        self.instruction = instruction.into();
        self
    }

    pub fn with_tools(mut self, tools: Vec<String>) -> Self {
        self.tools = tools;
        self
    }

    pub fn with_position(mut self, x: f64, y: f64) -> Self {
        self.position = Position { x, y };
        self
    }
}

/// Agent type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum AgentType {
    Llm,
    Tool,
    Sequential,
    Parallel,
    Loop,
    Router,
    Graph,
    Custom,
}

impl Default for AgentType {
    fn default() -> Self {
        AgentType::Llm
    }
}

impl Default for AgentSchema {
    fn default() -> Self {
        Self {
            agent_type: AgentType::default(),
            model: None,
            instruction: String::new(),
            tools: Vec::new(),
            sub_agents: Vec::new(),
            position: Position::default(),
            max_iterations: None,
            temperature: None,
            top_p: None,
            top_k: None,
            max_output_tokens: None,
            routes: Vec::new(),
            tool_timeout_secs: None,
            max_llm_iterations: None,
            tool_retry_budget: None,
            circuit_breaker_threshold: None,
            tools_requiring_confirmation: Vec::new(),
            tool_execution_strategy: None,
            extended_thinking: None,
            thinking_budget_tokens: None,
            reasoning_effort: None,
            prompt_caching: None,
            auto_skills: None,
        }
    }
}

/// Canvas position
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Position {
    pub x: f64,
    pub y: f64,
}
