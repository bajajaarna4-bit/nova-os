// nova-audit/src/lib.rs — Append-only audit logger

use anyhow::Result;
use nova_system_api::{AuditEvent, AuditEventType, AuditOutcome};
use std::path::PathBuf;
use tokio::fs::{self, OpenOptions};
use tokio::io::AsyncWriteExt;
use tracing::{error, info};

#[derive(Debug)]
pub struct AuditLogger {
    log_path: PathBuf,
}

impl AuditLogger {
    /// Create a new AuditLogger, ensuring the directory exists.
    pub async fn new() -> Result<Self> {
        let dir = Self::default_dir();
        fs::create_dir_all(&dir).await?;
        let log_path = dir.join("audit.jsonl");
        Ok(Self { log_path })
    }

    /// Create AuditLogger with explicit path (useful for testing).
    pub fn with_path(path: PathBuf) -> Self {
        Self { log_path: path }
    }

    fn default_dir() -> PathBuf {
        #[cfg(target_os = "linux")]
        {
            let home = std::env::var("HOME").unwrap_or_else(|_| "/root".to_string());
            PathBuf::from(home).join(".local/share/nova")
        }
        #[cfg(not(target_os = "linux"))]
        {
            let home = std::env::var("USERPROFILE")
                .or_else(|_| std::env::var("HOME"))
                .unwrap_or_else(|_| ".".to_string());
            PathBuf::from(home).join(".local/share/nova")
        }
    }

    /// Append a single audit event as a JSONL line. Never modifies past entries.
    pub async fn log_event(&self, event: AuditEvent) -> Result<()> {
        let line = serde_json::to_string(&event)?;

        let mut file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&self.log_path)
            .await?;

        file.write_all(line.as_bytes()).await?;
        file.write_all(b"\n").await?;
        file.flush().await?;

        info!(
            event_type = %event.event_type,
            actor = %event.actor,
            resource = %event.resource,
            action = %event.action,
            outcome = %event.outcome,
            "audit event logged"
        );

        Ok(())
    }

    /// Convenience: log and swallow errors (audit failures should never crash the caller).
    pub async fn try_log(&self, event: AuditEvent) {
        if let Err(e) = self.log_event(event).await {
            error!("Failed to write audit event: {}", e);
        }
    }

    /// Return path to the current audit log file.
    pub fn log_path(&self) -> &PathBuf {
        &self.log_path
    }
}

/// Helper: build a minimal audit event quickly.
pub fn build_event(
    event_type: AuditEventType,
    actor: &str,
    resource: &str,
    action: &str,
    outcome: AuditOutcome,
) -> AuditEvent {
    AuditEvent::new(event_type, actor, resource, action, outcome)
}
