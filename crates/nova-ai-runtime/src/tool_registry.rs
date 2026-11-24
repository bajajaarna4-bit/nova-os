// nova-ai-runtime/src/tool_registry.rs
// Strict allowlist-based tool registry with mandatory permission checks

use anyhow::Result;
use nova_system_api::{AIToolCall, AIToolResult};
use serde_json::Value;
use std::collections::HashMap;
use std::sync::Arc;
use tracing::{info, warn};

pub type ToolHandler = Arc<dyn Fn(Value) -> Result<Value> + Send + Sync>;

pub struct ToolDefinition {
    pub name: String,
    pub description: String,
    pub required_permission: String,
    pub handler: ToolHandler,
}

#[derive(Default)]
pub struct ToolRegistry {
    tools: HashMap<String, ToolDefinition>,
}

impl ToolRegistry {
    pub fn new() -> Self {
        let mut registry = Self {
            tools: HashMap::new(),
        };
        registry.register_defaults();
        registry
    }

    pub fn register(&mut self, tool: ToolDefinition) {
        self.tools.insert(tool.name.clone(), tool);
    }

    pub fn get_required_permission(&self, tool_name: &str) -> Option<&str> {
        self.tools.get(tool_name).map(|t| t.required_permission.as_str())
    }

    pub fn is_registered(&self, tool_name: &str) -> bool {
        self.tools.contains_key(tool_name)
    }

    pub fn execute(&self, call: &AIToolCall, permission_granted: bool) -> AIToolResult {
        if !permission_granted {
            warn!("Execution of tool '{}' denied: missing permission", call.tool_name);
            return AIToolResult {
                tool_name: call.tool_name.clone(),
                success: false,
                output: Value::Null,
                error: Some("Permission denied by user policy".to_string()),
            };
        }

        let tool = match self.tools.get(&call.tool_name) {
            Some(t) => t,
            None => {
                warn!("Execution of unregistered tool '{}' blocked", call.tool_name);
                return AIToolResult {
                    tool_name: call.tool_name.clone(),
                    success: false,
                    output: Value::Null,
                    error: Some(format!("Tool '{}' is not registered in the allowlist", call.tool_name)),
                };
            }
        };

        info!("Executing allowlisted tool: {}", tool.name);
        match (tool.handler)(call.params.clone()) {
            Ok(output) => AIToolResult {
                tool_name: call.tool_name.clone(),
                success: true,
                output,
                error: None,
            },
            Err(e) => AIToolResult {
                tool_name: call.tool_name.clone(),
                success: false,
                output: Value::Null,
                error: Some(e.to_string()),
            },
        }
    }

    fn register_defaults(&mut self) {
        self.register(ToolDefinition {
            name: "get_system_info".to_string(),
            description: "Read system resource and hardware information".to_string(),
            required_permission: "system".to_string(),
            handler: Arc::new(|_params| {
                Ok(serde_json::json!({
                    "status": "ready",
                    "platform": std::env::consts::OS,
                    "arch": std::env::consts::ARCH,
                }))
            }),
        });

        self.register(ToolDefinition {
            name: "search_files".to_string(),
            description: "Search user files with explicit user permission".to_string(),
            required_permission: "files".to_string(),
            handler: Arc::new(|params| {
                let query = params.get("query").and_then(|q| q.as_str()).unwrap_or("");
                Ok(serde_json::json!({
                    "query": query,
                    "matches": []
                }))
            }),
        });

        self.register(ToolDefinition {
            name: "create_workspace".to_string(),
            description: "Create a new window grouping workspace".to_string(),
            required_permission: "system".to_string(),
            handler: Arc::new(|params| {
                let name = params.get("name").and_then(|n| n.as_str()).unwrap_or("New Workspace");
                Ok(serde_json::json!({
                    "created": true,
                    "workspace": name
                }))
            }),
        });
    }
}
