// nova-ai-runtime/src/offline.rs — Deterministic Offline Local Intelligence Engine
// Guarantees zero-network functionality, instant response times, and full zero-trust adherence.

use anyhow::Result;
use async_trait::async_trait;
use tracing::info;

use crate::provider::{AIProvider, ProviderKind};

pub struct OfflineBuiltinProvider {
    model_name: String,
}

impl Default for OfflineBuiltinProvider {
    fn default() -> Self {
        Self {
            model_name: "nova-builtin-rules-v1".to_string(),
        }
    }
}

impl OfflineBuiltinProvider {
    pub fn new() -> Self {
        Self::default()
    }
}

#[async_trait]
impl AIProvider for OfflineBuiltinProvider {
    fn kind(&self) -> ProviderKind {
        ProviderKind::OfflineBuiltin
    }

    fn name(&self) -> &str {
        "offline-builtin"
    }

    fn model(&self) -> &str {
        &self.model_name
    }

    async fn is_available(&self) -> bool {
        true // Always available, zero network dependencies
    }

    async fn complete(&self, prompt: &str) -> Result<String> {
        info!("OfflineBuiltinProvider processing prompt: {}", prompt);
        let lower = prompt.to_lowercase();

        // 1. Hardware & System queries
        if lower.contains("hardware") || lower.contains("cpu") || lower.contains("memory") || lower.contains("ram") || lower.contains("system info") {
            return Ok("I can inspect the system hardware and telemetry. Proposing tool 'inspect_system_hardware'. Please review and confirm execution.".to_string());
        }

        // 2. Security & Zero-Trust queries
        if lower.contains("security") || lower.contains("firewall") || lower.contains("selinux") || lower.contains("posture") || lower.contains("secure boot") {
            return Ok("I can query the host security posture (SELinux state, Secure Boot, Firewall, and disk encryption). Proposing tool 'check_security_posture'. Please review and confirm execution.".to_string());
        }

        // 3. Application launching
        if lower.contains("launch") || lower.contains("open") {
            if lower.contains("terminal") {
                return Ok("Proposing to launch NOVA Terminal. Requires user confirmation.".to_string());
            } else if lower.contains("file") || lower.contains("files") {
                return Ok("Proposing to open NOVA Files browser. Requires user confirmation.".to_string());
            } else if lower.contains("setting") || lower.contains("settings") {
                return Ok("Proposing to open NOVA System Settings. Requires user confirmation.".to_string());
            } else if lower.contains("security") {
                return Ok("Proposing to open NOVA Security Center. Requires user confirmation.".to_string());
            }
        }

        // 4. File searching & preview
        if lower.contains("search file") || lower.contains("find file") || lower.contains("search docs") {
            return Ok("Proposing to search user files with scoped permissions. Proposing tool 'search_files'. Please review and confirm execution.".to_string());
        }

        // 5. General OS Architecture & Help
        if lower.contains("help") || lower.contains("what can you do") || lower.contains("who are you") {
            return Ok("I am NOVA Intelligence, the local-first AI operating layer for NOVA OS.\n\nCapabilities:\n• Hardware telemetry monitoring (`inspect_system_hardware`)\n• Zero-trust security posture inspection (`check_security_posture`)\n• Safe application launching (`launch_application`)\n• System settings navigation (`navigate_settings`)\n• Scoped user file discovery (`search_files`)\n\nAll consequential actions require your explicit approval before execution. No arbitrary shell commands are permitted.".to_string());
        }

        // Default response
        Ok(format!(
            "NOVA Intelligence (Local Offline Engine): Received query \"{}\". Operating in zero-trust mode with allowlisted tool verification.",
            prompt.trim()
        ))
    }

    async fn stream_complete(
        &self,
        prompt: &str,
    ) -> Result<tokio::sync::mpsc::Receiver<String>> {
        let text = self.complete(prompt).await?;
        let (tx, rx) = tokio::sync::mpsc::channel(16);

        tokio::spawn(async move {
            // Stream words with small micro-delays to simulate natural streaming
            let words: Vec<&str> = text.split_inclusive(' ').collect();
            for word in words {
                if tx.send(word.to_string()).await.is_err() {
                    break;
                }
                tokio::time::sleep(std::time::Duration::from_millis(25)).await;
            }
        });

        Ok(rx)
    }
}
