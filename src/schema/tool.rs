use serde::{Deserialize, Serialize};
use serde_json::Value;

/// Tool definition schema
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolSchema {
    #[serde(rename = "type")]
    pub tool_type: ToolType,
    #[serde(default)]
    pub config: Value,
    #[serde(default)]
    pub description: String,
}

impl ToolSchema {
    pub fn builtin(description: impl Into<String>) -> Self {
        Self {
            tool_type: ToolType::Builtin,
            config: Value::Object(Default::default()),
            description: description.into(),
        }
    }
}

/// Tool type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ToolType {
    Builtin,
    Mcp,
    Custom,
}

/// Tool configuration (stored per agent-tool combination)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ToolConfig {
    Mcp(McpToolConfig),
    Function(FunctionToolConfig),
    Browser(BrowserToolConfig),
}

/// MCP server tool configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpToolConfig {
    pub server_command: String,
    #[serde(default)]
    pub server_args: Vec<String>,
    #[serde(default)]
    pub tool_filter: Vec<String>,
}

/// Custom function tool configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FunctionToolConfig {
    pub name: String,
    pub description: String,
    #[serde(default)]
    pub parameters: Vec<FunctionParameter>,
    #[serde(default)]
    pub code: String,
}

/// Function parameter definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FunctionParameter {
    pub name: String,
    pub param_type: ParamType,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub required: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ParamType {
    String,
    Number,
    Boolean,
}

/// Browser tool configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrowserToolConfig {
    #[serde(default = "default_headless")]
    pub headless: bool,
    #[serde(default = "default_timeout")]
    pub timeout_ms: u64,
}

fn default_headless() -> bool {
    true
}
fn default_timeout() -> u64 {
    30000
}

/// Built-in tool identifiers
pub mod builtins {
    pub const GOOGLE_SEARCH: &str = "google_search";
    pub const WEB_BROWSE: &str = "web_browse";
    pub const CODE_EXEC: &str = "code_exec";
    pub const FILE_READ: &str = "file_read";
    pub const FILE_WRITE: &str = "file_write";
}
