import type { FunctionToolConfig } from '../types/project';

export const FUNCTION_TEMPLATES = [
  { 
    name: 'Calculator', 
    icon: '🧮', 
    template: { 
      name: 'calculator', 
      description: 'Evaluate mathematical expressions with support for +, -, *, /, ^, %, sqrt, sin, cos, tan, log, abs, round, floor, ceil', 
      parameters: [
        { name: 'expression', param_type: 'string' as const, description: 'Math expression to evaluate (e.g., "2 + 3 * 4", "sqrt(16)", "sin(3.14159/2)")', required: true }
      ], 
      code: `fn eval_expr(expr: &str) -> Result<f64, String> {
    let expr = expr.trim().to_lowercase();
    
    // Handle functions first
    for func in ["sqrt", "sin", "cos", "tan", "log", "abs", "round", "floor", "ceil"] {
        if expr.starts_with(func) && expr.contains('(') {
            let start = expr.find('(').unwrap();
            let end = expr.rfind(')').ok_or("Missing closing parenthesis")?;
            let inner = eval_expr(&expr[start+1..end])?;
            let result = match func {
                "sqrt" => inner.sqrt(),
                "sin" => inner.sin(),
                "cos" => inner.cos(),
                "tan" => inner.tan(),
                "log" => inner.ln(),
                "abs" => inner.abs(),
                "round" => inner.round(),
                "floor" => inner.floor(),
                "ceil" => inner.ceil(),
                _ => return Err(format!("Unknown function: {}", func)),
            };
            return Ok(result);
        }
    }
    
    // Handle parentheses
    if let (Some(start), Some(end)) = (expr.find('('), expr.rfind(')')) {
        let before = &expr[..start];
        let inner = eval_expr(&expr[start+1..end])?;
        let after = &expr[end+1..];
        return eval_expr(&format!("{}{}{}", before, inner, after));
    }
    
    // Handle operators by precedence (low to high)
    for op in ['+', '-'] {
        if let Some(pos) = expr.rfind(|c| c == op && !expr[..expr.find(c).unwrap_or(0)].ends_with('e')) {
            if pos > 0 {
                let left = eval_expr(&expr[..pos])?;
                let right = eval_expr(&expr[pos+1..])?;
                return Ok(if op == '+' { left + right } else { left - right });
            }
        }
    }
    for op in ['*', '/', '%'] {
        if let Some(pos) = expr.rfind(op) {
            let left = eval_expr(&expr[..pos])?;
            let right = eval_expr(&expr[pos+1..])?;
            return Ok(match op {
                '*' => left * right,
                '/' => if right != 0.0 { left / right } else { return Err("Division by zero".into()) },
                '%' => left % right,
                _ => unreachable!(),
            });
        }
    }
    if let Some(pos) = expr.rfind('^') {
        let left = eval_expr(&expr[..pos])?;
        let right = eval_expr(&expr[pos+1..])?;
        return Ok(left.powf(right));
    }
    
    // Parse number or constant
    match expr.trim() {
        "pi" => Ok(std::f64::consts::PI),
        "e" => Ok(std::f64::consts::E),
        s => s.parse::<f64>().map_err(|_| format!("Invalid number: {}", s)),
    }
}

match eval_expr(expression) {
    Ok(result) => Ok(json!({ "result": result, "expression": expression })),
    Err(e) => Err(adk_core::AdkError::new(
        adk_core::ErrorComponent::Tool,
        adk_core::ErrorCategory::InvalidInput,
        "tool.calculator.invalid_expression",
        e,
    ))
}` 
    }
  },
  { 
    name: 'HTTP Request', 
    icon: '🌐', 
    template: { 
      name: 'http_request', 
      description: 'Make HTTP GET/POST requests to URLs', 
      parameters: [
        { name: 'url', param_type: 'string' as const, description: 'URL to request', required: true },
        { name: 'method', param_type: 'string' as const, description: 'HTTP method (GET or POST)', required: false },
        { name: 'body', param_type: 'string' as const, description: 'Request body for POST', required: false }
      ], 
      code: `let client = reqwest::Client::new();
let method = if method.is_empty() { "GET" } else { method };
let response = match method.to_uppercase().as_str() {
    "GET" => client.get(url).send().await,
    "POST" => client.post(url).body(body.to_string()).send().await,
    _ => return Err(adk_core::AdkError::new(
        adk_core::ErrorComponent::Tool,
        adk_core::ErrorCategory::InvalidInput,
        "tool.http.unsupported_method",
        format!("Unsupported method: {}", method),
    )),
};
match response {
    Ok(resp) => {
        let status = resp.status().as_u16();
        let text = resp.text().await.unwrap_or_default();
        Ok(json!({ "status": status, "body": text }))
    }
    Err(e) => Err(adk_core::AdkError::new(
        adk_core::ErrorComponent::Tool,
        adk_core::ErrorCategory::Unavailable,
        "tool.http.request_failed",
        format!("Request failed: {}", e),
    ).with_source(e))
}` 
    }
  },
  { 
    name: 'Read File', 
    icon: '📄', 
    template: { 
      name: 'read_file', 
      description: 'Read contents of a file', 
      parameters: [
        { name: 'path', param_type: 'string' as const, description: 'File path to read', required: true }
      ], 
      code: `match std::fs::read_to_string(path) {
    Ok(content) => Ok(json!({ "content": content })),
    Err(e) => {
        let category = if e.kind() == std::io::ErrorKind::NotFound {
            adk_core::ErrorCategory::NotFound
        } else {
            adk_core::ErrorCategory::Internal
        };
        Err(adk_core::AdkError::new(
            adk_core::ErrorComponent::Tool,
            category,
            "tool.file.read_failed",
            format!("Failed to read file: {}", e),
        ).with_source(e))
    }
}` 
    }
  },
  { 
    name: 'Write File', 
    icon: '💾', 
    template: { 
      name: 'write_file', 
      description: 'Write content to a file', 
      parameters: [
        { name: 'path', param_type: 'string' as const, description: 'File path to write', required: true },
        { name: 'content', param_type: 'string' as const, description: 'Content to write', required: true }
      ], 
      code: `match std::fs::write(path, content) {
    Ok(_) => Ok(json!({ "status": "success", "path": path })),
    Err(e) => Err(adk_core::AdkError::new(
        adk_core::ErrorComponent::Tool,
        adk_core::ErrorCategory::Internal,
        "tool.file.write_failed",
        format!("Failed to write file: {}", e),
    ).with_source(e))
}` 
    }
  },
  { 
    name: 'JSON Parser', 
    icon: '📋', 
    template: { 
      name: 'parse_json', 
      description: 'Parse JSON string and extract a field', 
      parameters: [
        { name: 'json_str', param_type: 'string' as const, description: 'JSON string to parse', required: true },
        { name: 'field', param_type: 'string' as const, description: 'Field to extract (dot notation)', required: false }
      ], 
      code: `let parsed: Value = serde_json::from_str(json_str)
    .map_err(|e| {
        adk_core::AdkError::new(
            adk_core::ErrorComponent::Tool,
            adk_core::ErrorCategory::InvalidInput,
            "tool.json.parse_failed",
            format!("Invalid JSON: {}", e),
        )
        .with_source(e)
    })?;
if field.is_empty() {
    Ok(parsed)
} else {
    let value = field.split('.').fold(Some(&parsed), |acc, key| {
        acc.and_then(|v| v.get(key))
    });
    Ok(value.cloned().unwrap_or(Value::Null))
}` 
    }
  },
  { 
    name: 'Shell Command', 
    icon: '⚡', 
    template: { 
      name: 'run_command', 
      description: 'Execute a shell command', 
      parameters: [
        { name: 'command', param_type: 'string' as const, description: 'Command to execute', required: true },
        { name: 'args', param_type: 'string' as const, description: 'Space-separated arguments', required: false }
      ], 
      code: `use std::process::Command;
let args_vec: Vec<&str> = if args.is_empty() { vec![] } else { args.split_whitespace().collect() };
match Command::new(command).args(&args_vec).output() {
    Ok(output) => Ok(json!({
        "stdout": String::from_utf8_lossy(&output.stdout),
        "stderr": String::from_utf8_lossy(&output.stderr),
        "exit_code": output.status.code()
    })),
    Err(e) => Err(adk_core::AdkError::new(
        adk_core::ErrorComponent::Tool,
        adk_core::ErrorCategory::Internal,
        "tool.shell.command_failed",
        format!("Command failed: {}", e),
    ).with_source(e))
}` 
    }
  },
];

export const MCP_TEMPLATES = [
  { name: 'Time', icon: '🕐', command: 'uvx', args: ['mcp-server-time'], desc: 'Get current time and timezone info' },
  { name: 'Fetch', icon: '🌐', command: 'uvx', args: ['mcp-server-fetch'], desc: 'Fetch and parse web pages' },
  { name: 'Filesystem', icon: '📁', command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'], desc: 'Read, write, and manage files' },
  { name: 'GitHub', icon: '🐙', command: 'npx', args: ['-y', '@modelcontextprotocol/server-github'], desc: 'GitHub repos, issues, PRs' },
  { name: 'SQLite', icon: '💾', command: 'uvx', args: ['mcp-server-sqlite', '--db-path', '/tmp/data.db'], desc: 'Query SQLite databases' },
  { name: 'Memory', icon: '🧠', command: 'npx', args: ['-y', '@modelcontextprotocol/server-memory'], desc: 'Persistent key-value store' },
  { name: 'Brave Search', icon: '🔍', command: 'npx', args: ['-y', '@anthropic/mcp-server-brave-search'], desc: 'Web search via Brave' },
  { name: 'Puppeteer', icon: '🎭', command: 'npx', args: ['-y', '@anthropic/mcp-server-puppeteer'], desc: 'Browser automation' },
  { name: 'Slack', icon: '💬', command: 'npx', args: ['-y', '@anthropic/mcp-server-slack'], desc: 'Slack messaging' },
  { name: 'Google Drive', icon: '📂', command: 'npx', args: ['-y', '@anthropic/mcp-server-gdrive'], desc: 'Google Drive files' },
  { name: 'PostgreSQL', icon: '🐘', command: 'npx', args: ['-y', '@anthropic/mcp-server-postgres'], desc: 'PostgreSQL queries' },
  { name: 'Everything', icon: '✨', command: 'npx', args: ['-y', '@modelcontextprotocol/server-everything'], desc: 'Demo server with all features' },
];

export function generateFunctionTemplate(config: FunctionToolConfig): string {
  const fnName = config.name || 'my_function';
  const params = config.parameters.map(p => {
    const extractor = p.param_type === 'number' 
      ? 'as_f64().unwrap_or(0.0)' 
      : p.param_type === 'boolean' 
        ? 'as_bool().unwrap_or(false)' 
        : 'as_str().unwrap_or("")';
    return `    let ${p.name} = args["${p.name}"].${extractor};`;
  }).join('\n');
  const code = config.code || 'Ok(json!({"status": "ok"}))';
  return `async fn ${fnName}_fn(_ctx: Arc<dyn ToolContext>, args: Value) -> Result<Value, adk_core::AdkError> {\n${params}\n    ${code}\n}`;
}

export function extractUserCode(fullCode: string, config: FunctionToolConfig): string {
  const lines = fullCode.split('\n');
  const startIdx = config.parameters.length + 1;
  const endIdx = lines.length - 1;
  if (startIdx >= endIdx) return config.code || '';
  return lines.slice(startIdx, endIdx).map(l => l.replace(/^ {4}/, '')).join('\n');
}
