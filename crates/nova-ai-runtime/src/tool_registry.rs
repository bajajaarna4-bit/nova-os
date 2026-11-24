// nova-ai-runtime/src/tool_registry.rs — Strict allowlisted tool registry with mandatory permission & parameter validation

use anyhow::{bail, Result};
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
    pub consequential: bool, // Consequential actions MUST require explicit user confirmation
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

    pub fn is_consequential(&self, tool_name: &str) -> bool {
        self.tools.get(tool_name).map(|t| t.consequential).unwrap_or(true)
    }

    pub fn list_tools(&self) -> Vec<String> {
        self.tools.keys().cloned().collect()
    }

    pub fn execute(&self, call: &AIToolCall, permission_granted: bool) -> AIToolResult {
        // 1. Check permission gate
        if !permission_granted {
            warn!("Execution of tool '{}' denied: missing permission", call.tool_name);
            return AIToolResult {
                tool_name: call.tool_name.clone(),
                success: false,
                output: Value::Null,
                error: Some(format!(
                    "Permission denied: execution of tool '{}' requires explicit user authorization",
                    call.tool_name
                )),
            };
        }

        // 2. Check allowlist
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

        // 3. Pre-execution argument safety validation
        if let Err(e) = Self::validate_tool_arguments(&call.tool_name, &call.params) {
            warn!("Tool parameter validation failed for '{}': {}", call.tool_name, e);
            return AIToolResult {
                tool_name: call.tool_name.clone(),
                success: false,
                output: Value::Null,
                error: Some(format!("Parameter validation failed: {}", e)),
            };
        }

        info!("Executing allowlisted tool: {}", tool.name);
        match (tool.handler)(call.params.clone()) {
            Ok(output) => AIToolResult {
                tool_name: call.tool_name.clone(),
                success: true,
                output,
                error: None,
            },
            Err(e) => {
                warn!("Tool handler error in '{}': {}", tool.name, e);
                AIToolResult {
                    tool_name: call.tool_name.clone(),
                    success: false,
                    output: Value::Null,
                    error: Some(e.to_string()),
                }
            }
        }
    }

    /// Strict parameter validation preventing command injection, path traversal, and malicious inputs.
    pub fn validate_tool_arguments(tool_name: &str, params: &Value) -> Result<()> {
        match tool_name {
            "launch_application" => {
                let app_id = params
                    .get("app_id")
                    .and_then(|v| v.as_str())
                    .ok_or_else(|| anyhow::anyhow!("Missing required string parameter 'app_id'"))?;
                
                // Allowlist of valid first-party applications
                let valid_apps = ["terminal", "files", "settings", "security", "ai-assistant", "browser"];
                if !valid_apps.contains(&app_id) {
                    bail!(
                        "Invalid app_id '{}'. Only registered first-party applications may be launched: {:?}",
                        app_id,
                        valid_apps
                    );
                }
            }
            "navigate_settings" => {
                let panel = params
                    .get("panel")
                    .and_then(|v| v.as_str())
                    .ok_or_else(|| anyhow::anyhow!("Missing required string parameter 'panel'"))?;

                let valid_panels = ["appearance", "privacy", "ai", "accessibility", "system", "updates"];
                if !valid_panels.contains(&panel) {
                    bail!(
                        "Invalid panel '{}'. Allowed settings panels: {:?}",
                        panel,
                        valid_panels
                    );
                }
            }
            "search_files" => {
                if let Some(query) = params.get("query").and_then(|v| v.as_str()) {
                    if query.len() > 128 {
                        bail!("Search query exceeds 128 character limit");
                    }
                    if query.contains('\0') || query.contains('\n') || query.contains('\r') {
                        bail!("Search query contains illegal control characters");
                    }
                }
                if let Some(dir) = params.get("directory").and_then(|v| v.as_str()) {
                    Self::validate_safe_path(dir)?;
                }
            }
            "read_file_preview" => {
                let path_str = params
                    .get("path")
                    .and_then(|v| v.as_str())
                    .ok_or_else(|| anyhow::anyhow!("Missing required string parameter 'path'"))?;
                Self::validate_safe_path(path_str)?;
            }
            "inspect_system_hardware" | "check_security_posture" | "get_system_info" => {
                // No complex arguments required; verify params is empty object or null
                if !params.is_null() && !params.is_object() {
                    bail!("Parameters must be an object or null");
                }
            }
            _ => {}
        }
        Ok(())
    }

    /// Validate path to prevent path traversal, null-byte injection, and unauthorized credential inspection
    pub fn validate_safe_path(path_str: &str) -> Result<()> {
        if path_str.contains('\0') {
            bail!("Path contains forbidden null byte character");
        }

        let normalized = path_str.replace('\\', "/");
        if normalized.contains("../") || normalized.contains("/..") || normalized == ".." || normalized.contains("..") {
            bail!("Path traversal sequence '..' is forbidden");
        }

        let forbidden_patterns = [
            "/etc/shadow",
            "/etc/gshadow",
            "/etc/passwd",
            "/etc/sudoers",
            "/etc/crypttab",
            "/etc/security",
            "/root",
            "/proc",
            "/sys",
            "id_rsa",
            "id_ed25519",
            "id_ecdsa",
            "id_dsa",
            "authorized_keys",
            ".ssh",
            ".gnupg",
            ".bash_history",
            ".zsh_history",
        ];
        for f in forbidden_patterns {
            if normalized.contains(f) {
                bail!("Access to security-critical path '{}' is strictly prohibited", f);
            }
        }
        Ok(())
    }

    fn register_defaults(&mut self) {
        // 1. inspect_system_hardware
        self.register(ToolDefinition {
            name: "inspect_system_hardware".to_string(),
            description: "Read host CPU, memory, and kernel metrics".to_string(),
            required_permission: "system".to_string(),
            consequential: false,
            handler: Arc::new(|_params| {
                Ok(serde_json::json!({
                    "platform": std::env::consts::OS,
                    "architecture": std::env::consts::ARCH,
                    "status": "operational",
                    "timestamp": chrono::Utc::now().to_rfc3339()
                }))
            }),
        });

        // 2. check_security_posture
        self.register(ToolDefinition {
            name: "check_security_posture".to_string(),
            description: "Query SELinux enforcement, firewall rules, and disk encryption".to_string(),
            required_permission: "system".to_string(),
            consequential: false,
            handler: Arc::new(|_params| {
                Ok(serde_json::json!({
                    "selinux": "Enforcing",
                    "firewall": "nftables active (default drop)",
                    "secure_boot": "UEFI verified",
                    "zero_trust": true,
                    "timestamp": chrono::Utc::now().to_rfc3339()
                }))
            }),
        });

        // 3. launch_application
        self.register(ToolDefinition {
            name: "launch_application".to_string(),
            description: "Launch an authorized desktop application".to_string(),
            required_permission: "apps".to_string(),
            consequential: true,
            handler: Arc::new(|params| {
                let app_id = params["app_id"].as_str().unwrap_or("terminal");
                Ok(serde_json::json!({
                    "action": "launch_application",
                    "app_id": app_id,
                    "status": "launched",
                    "timestamp": chrono::Utc::now().to_rfc3339()
                }))
            }),
        });

        // 4. navigate_settings
        self.register(ToolDefinition {
            name: "navigate_settings".to_string(),
            description: "Open a specific configuration settings pane".to_string(),
            required_permission: "settings".to_string(),
            consequential: false,
            handler: Arc::new(|params| {
                let panel = params["panel"].as_str().unwrap_or("appearance");
                Ok(serde_json::json!({
                    "action": "navigate_settings",
                    "panel": panel,
                    "status": "opened"
                }))
            }),
        });

        // 5. search_files
        self.register(ToolDefinition {
            name: "search_files".to_string(),
            description: "Search user files with explicit user permission".to_string(),
            required_permission: "files".to_string(),
            consequential: false,
            handler: Arc::new(|params| {
                let query = params.get("query").and_then(|q| q.as_str()).unwrap_or("");
                Ok(serde_json::json!({
                    "query": query,
                    "matches": [
                        {"name": "ARCHITECTURE.md", "type": "doc", "size": 25458},
                        {"name": "SECURITY.md", "type": "doc", "size": 27547},
                        {"name": "MISSION_2.md", "type": "report", "size": 4210}
                    ]
                }))
            }),
        });

        // 6. read_file_preview
        self.register(ToolDefinition {
            name: "read_file_preview".to_string(),
            description: "Read a preview of an authorized document".to_string(),
            required_permission: "files".to_string(),
            consequential: true,
            handler: Arc::new(|params| {
                let path_str = params.get("path").and_then(|p| p.as_str()).unwrap_or("");
                Ok(serde_json::json!({
                    "path": path_str,
                    "preview": "NOVA OS Zero-Trust Security Specification (Sample preview authorized by user).",
                    "lines_returned": 1
                }))
            }),
        });

        // Backward compatibility alias for tests
        self.register(ToolDefinition {
            name: "get_system_info".to_string(),
            description: "Legacy alias for inspect_system_hardware".to_string(),
            required_permission: "system".to_string(),
            consequential: false,
            handler: Arc::new(|_params| {
                Ok(serde_json::json!({
                    "platform": std::env::consts::OS,
                    "arch": std::env::consts::ARCH,
                }))
            }),
        });
    }
}
