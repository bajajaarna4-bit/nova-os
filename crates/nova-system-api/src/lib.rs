// nova-system-api: Shared types and D-Bus interface definitions for NOVA OS
pub mod dbus;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

// ─── System Info ─────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SystemInfo {
    pub hostname: String,
    pub kernel_version: String,
    pub os_version: String,
    pub uptime_seconds: u64,
    pub cpu_model: String,
    pub total_memory_bytes: u64,
}

// ─── Resource Usage ───────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ResourceUsage {
    pub cpu_percent: f64,
    pub memory_used_bytes: u64,
    pub memory_total_bytes: u64,
    pub load_average_1m: f64,
}

// ─── Service Status ───────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ServiceStatus {
    pub name: String,
    pub state: ServiceState,
    pub pid: Option<u32>,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default, PartialEq)]
pub enum ServiceState {
    Running,
    Stopped,
    Failed,
    #[default]
    Unknown,
}

impl std::fmt::Display for ServiceState {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ServiceState::Running => write!(f, "running"),
            ServiceState::Stopped => write!(f, "stopped"),
            ServiceState::Failed => write!(f, "failed"),
            ServiceState::Unknown => write!(f, "unknown"),
        }
    }
}

// ─── Security Status ──────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SecurityStatus {
    pub secure_boot_enabled: Option<bool>,
    pub selinux_mode: SeLinuxMode,
    pub dm_crypt_active: Option<bool>,
    pub firewall_active: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default, PartialEq)]
pub enum SeLinuxMode {
    Enforcing,
    Permissive,
    Disabled,
    #[default]
    Unknown,
}

impl std::fmt::Display for SeLinuxMode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SeLinuxMode::Enforcing => write!(f, "enforcing"),
            SeLinuxMode::Permissive => write!(f, "permissive"),
            SeLinuxMode::Disabled => write!(f, "disabled"),
            SeLinuxMode::Unknown => write!(f, "unknown"),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ProcessInfo {
    pub pid: u32,
    pub name: String,
    pub state: String,
    pub uid: u32,
    pub memory_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct FirewallStatus {
    pub active: bool,
    pub backend: String,
    pub rules_count: usize,
    pub default_policy: String,
}

// ─── Permissions ──────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionRequest {
    pub app_id: String,
    pub permission: String,
    pub reason: String,
    pub requested_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionDecision {
    pub app_id: String,
    pub permission: String,
    pub granted: bool,
    pub decided_at: DateTime<Utc>,
    pub reason: String,
}

impl Default for PermissionDecision {
    fn default() -> Self {
        Self {
            app_id: String::new(),
            permission: String::new(),
            granted: false,
            decided_at: Utc::now(),
            reason: String::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Permission {
    pub app_id: String,
    pub permission_type: String,
    pub granted: bool,
    pub granted_at: Option<DateTime<Utc>>,
    pub revoked_at: Option<DateTime<Utc>>,
}

impl Default for Permission {
    fn default() -> Self {
        Self {
            app_id: String::new(),
            permission_type: String::new(),
            granted: false,
            granted_at: None,
            revoked_at: None,
        }
    }
}

// Known permission types
pub const PERM_CAMERA: &str = "camera";
pub const PERM_MICROPHONE: &str = "microphone";
pub const PERM_LOCATION: &str = "location";
pub const PERM_CLIPBOARD: &str = "clipboard";
pub const PERM_FILES: &str = "files";
pub const PERM_NETWORK: &str = "network";

pub fn known_permissions() -> &'static [&'static str] {
    &[
        PERM_CAMERA,
        PERM_MICROPHONE,
        PERM_LOCATION,
        PERM_CLIPBOARD,
        PERM_FILES,
        PERM_NETWORK,
    ]
}

// ─── AI Types ─────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AIToolCall {
    pub tool_name: String,
    pub params: serde_json::Value,
    pub caller_app_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AIToolResult {
    pub tool_name: String,
    pub success: bool,
    pub output: serde_json::Value,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AIResponse {
    pub text: String,
    pub provider: String,
    pub model: String,
    pub tool_calls: Vec<AIToolCall>,
}

// ─── Audit ────────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditEvent {
    pub timestamp: DateTime<Utc>,
    pub event_type: AuditEventType,
    pub actor: String,
    pub resource: String,
    pub action: String,
    pub outcome: AuditOutcome,
    pub metadata: serde_json::Value,
}

impl AuditEvent {
    pub fn new(
        event_type: AuditEventType,
        actor: impl Into<String>,
        resource: impl Into<String>,
        action: impl Into<String>,
        outcome: AuditOutcome,
    ) -> Self {
        Self {
            timestamp: Utc::now(),
            event_type,
            actor: actor.into(),
            resource: resource.into(),
            action: action.into(),
            outcome,
            metadata: serde_json::Value::Null,
        }
    }

    pub fn with_metadata(mut self, metadata: serde_json::Value) -> Self {
        self.metadata = metadata;
        self
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AuditEventType {
    PermissionGranted,
    PermissionRevoked,
    PermissionDenied,
    AIToolExecution,
    AIQuery,
    SystemUpdate,
    SecurityAlert,
    ServiceStart,
    ServiceStop,
    ConfigChange,
}

impl std::fmt::Display for AuditEventType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let s = match self {
            AuditEventType::PermissionGranted => "permission_granted",
            AuditEventType::PermissionRevoked => "permission_revoked",
            AuditEventType::PermissionDenied => "permission_denied",
            AuditEventType::AIToolExecution => "ai_tool_execution",
            AuditEventType::AIQuery => "ai_query",
            AuditEventType::SystemUpdate => "system_update",
            AuditEventType::SecurityAlert => "security_alert",
            AuditEventType::ServiceStart => "service_start",
            AuditEventType::ServiceStop => "service_stop",
            AuditEventType::ConfigChange => "config_change",
        };
        write!(f, "{}", s)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AuditOutcome {
    Success,
    Failure,
    Denied,
}

impl std::fmt::Display for AuditOutcome {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AuditOutcome::Success => write!(f, "success"),
            AuditOutcome::Failure => write!(f, "failure"),
            AuditOutcome::Denied => write!(f, "denied"),
        }
    }
}

// ─── Update ───────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct UpdateInfo {
    pub available: bool,
    pub version: String,
    pub description: String,
    pub size_bytes: u64,
    pub security_update: bool,
    pub checksum: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateRecord {
    pub version: String,
    pub applied_at: DateTime<Utc>,
    pub description: String,
    pub success: bool,
}
