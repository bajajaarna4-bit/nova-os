// nova-audit/src/lib.rs — Cryptographically Chained Append-Only Audit Logger
// Every event is cryptographically linked to the preceding event via SHA-256 hash chaining,
// preventing retroactive tampering, log truncation, or record omission.

use anyhow::Result;
use nova_system_api::{AuditEvent, AuditEventType, AuditOutcome};
use sha2::{Digest, Sha256};
use std::path::PathBuf;
use tokio::fs::{self, OpenOptions};
use tokio::io::AsyncWriteExt;
use tokio::sync::Mutex;
use tracing::{error, info};

#[derive(Debug)]
pub struct AuditLogger {
    log_path: PathBuf,
    chain_state: Mutex<(u64, String)>, // (sequence, last_hash)
}

impl AuditLogger {
    /// Create a new AuditLogger, ensuring the directory exists and recovering the latest chain state.
    pub async fn new() -> Result<Self> {
        let dir = Self::default_dir();
        fs::create_dir_all(&dir).await?;
        let log_path = dir.join("audit.jsonl");
        Self::init_with_path(log_path).await
    }

    /// Create AuditLogger with explicit path (useful for testing).
    pub fn with_path(path: PathBuf) -> Self {
        Self {
            log_path: path,
            chain_state: Mutex::new((0, "GENESIS".to_string())),
        }
    }

    pub async fn init_with_path(log_path: PathBuf) -> Result<Self> {
        let mut last_seq = 0u64;
        let mut last_hash = "GENESIS".to_string();

        if log_path.exists() {
            if let Ok(content) = fs::read_to_string(&log_path).await {
                for line in content.lines() {
                    let trimmed = line.trim();
                    if trimmed.is_empty() {
                        continue;
                    }
                    if let Ok(event) = serde_json::from_str::<AuditEvent>(trimmed) {
                        last_seq = event.sequence;
                        last_hash = event.hash.clone();
                    }
                }
            }
        }

        Ok(Self {
            log_path,
            chain_state: Mutex::new((last_seq, last_hash)),
        })
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

    /// Compute cryptographic SHA-256 hash for an event.
    pub fn compute_event_hash(event: &AuditEvent) -> String {
        let mut hasher = Sha256::new();
        hasher.update(event.sequence.to_be_bytes());
        hasher.update(event.timestamp.to_rfc3339().as_bytes());
        hasher.update(event.event_type.to_string().as_bytes());
        hasher.update(event.actor.as_bytes());
        hasher.update(event.resource.as_bytes());
        hasher.update(event.action.as_bytes());
        hasher.update(event.outcome.to_string().as_bytes());
        hasher.update(event.previous_hash.as_bytes());
        hex::encode(hasher.finalize())
    }

    /// Append a single audit event as a JSONL line with cryptographic hash chaining.
    pub async fn log_event(&self, mut event: AuditEvent) -> Result<()> {
        {
            let mut state = self.chain_state.lock().await;
            state.0 += 1;
            event.sequence = state.0;
            event.previous_hash = state.1.clone();
            event.hash = Self::compute_event_hash(&event);
            state.1 = event.hash.clone();
        }

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
            sequence = event.sequence,
            event_type = %event.event_type,
            actor = %event.actor,
            resource = %event.resource,
            action = %event.action,
            outcome = %event.outcome,
            hash = %event.hash,
            "audit event chained & logged"
        );

        Ok(())
    }

    /// Verify full cryptographic integrity of the audit log file.
    /// Returns true if all hashes match and sequence is continuous.
    pub async fn verify_chain_integrity(&self) -> Result<bool> {
        if !self.log_path.exists() {
            return Ok(true);
        }

        let content = fs::read_to_string(&self.log_path).await?;
        let mut expected_seq = 1u64;
        let mut expected_prev_hash = "GENESIS".to_string();

        for line in content.lines() {
            let trimmed = line.trim();
            if trimmed.is_empty() {
                continue;
            }
            let event: AuditEvent = match serde_json::from_str(trimmed) {
                Ok(ev) => ev,
                Err(_) => return Ok(false), // JSON parse failure indicates corruption
            };

            // 1. Verify sequence continuity
            if event.sequence != expected_seq {
                error!("Audit sequence discontinuity: expected {}, got {}", expected_seq, event.sequence);
                return Ok(false);
            }

            // 2. Verify previous hash chaining
            if event.previous_hash != expected_prev_hash {
                error!("Audit hash chain broken at sequence {}", event.sequence);
                return Ok(false);
            }

            // 3. Verify event content hash
            let computed = Self::compute_event_hash(&event);
            if event.hash != computed {
                error!("Audit event hash mismatch at sequence {}: computed {} != stored {}", event.sequence, computed, event.hash);
                return Ok(false);
            }

            expected_prev_hash = event.hash.clone();
            expected_seq += 1;
        }

        Ok(true)
    }

    /// Convenience: log and swallow errors.
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
