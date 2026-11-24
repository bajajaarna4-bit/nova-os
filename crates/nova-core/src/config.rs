// nova-core/src/config.rs — OS Configuration loader and manager
use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NovaConfig {
    pub system: SystemConfig,
    pub security: SecurityConfig,
    pub ai: AIConfig,
    pub desktop: DesktopConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemConfig {
    pub hostname: String,
    pub timezone: String,
    pub telemetry_enabled: bool,
    pub automatic_updates: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityConfig {
    pub selinux_enforce: bool,
    pub zero_trust_broker: bool,
    pub require_polkit_auth: bool,
    pub audit_retention_days: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIConfig {
    pub local_provider: String,
    pub local_endpoint: String,
    pub default_model: String,
    pub offline_only: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DesktopConfig {
    pub theme: String,
    pub accent_color: String,
    pub high_contrast: bool,
    pub reduced_motion: bool,
    pub workspace_count: u32,
}

impl Default for NovaConfig {
    fn default() -> Self {
        Self {
            system: SystemConfig {
                hostname: "nova-pc".to_string(),
                timezone: "UTC".to_string(),
                telemetry_enabled: false,
                automatic_updates: false,
            },
            security: SecurityConfig {
                selinux_enforce: true,
                zero_trust_broker: true,
                require_polkit_auth: true,
                audit_retention_days: 90,
            },
            ai: AIConfig {
                local_provider: "ollama".to_string(),
                local_endpoint: "http://localhost:11434".to_string(),
                default_model: "qwen2.5:3b".to_string(),
                offline_only: true,
            },
            desktop: DesktopConfig {
                theme: "midnight".to_string(),
                accent_color: "#7c5af0".to_string(),
                high_contrast: false,
                reduced_motion: false,
                workspace_count: 4,
            },
        }
    }
}

impl NovaConfig {
    pub fn load_from_path<P: AsRef<Path>>(path: P) -> Result<Self> {
        let content = std::fs::read_to_string(path)?;
        let cfg: Self = toml::from_str(&content)?;
        Ok(cfg)
    }

    pub fn load_default_or_fallback() -> Self {
        let default_path = PathBuf::from("/etc/nova/nova.toml");
        if default_path.exists() {
            Self::load_from_path(&default_path).unwrap_or_default()
        } else {
            Self::default()
        }
    }
}
