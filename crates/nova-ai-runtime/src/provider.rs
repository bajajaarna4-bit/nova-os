// nova-ai-runtime/src/provider.rs — Provider trait and abstractions

use anyhow::Result;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ProviderKind {
    Gemini,
    Ollama,
    OfflineBuiltin,
    Mock,
}

impl std::fmt::Display for ProviderKind {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Gemini => write!(f, "Gemini Cloud"),
            Self::Ollama => write!(f, "Local Ollama"),
            Self::OfflineBuiltin => write!(f, "Offline Built-in Engine"),
            Self::Mock => write!(f, "Mock Provider"),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderStatus {
    pub kind: ProviderKind,
    pub name: String,
    pub model: String,
    pub available: bool,
    pub latency_ms: Option<u64>,
}

#[async_trait]
pub trait AIProvider: Send + Sync {
    /// Return the provider category.
    fn kind(&self) -> ProviderKind;

    /// Return provider name (e.g. "gemini", "ollama", "offline").
    fn name(&self) -> &str;

    /// Return the model identifier used.
    fn model(&self) -> &str;

    /// Check if provider is currently reachable and configured.
    async fn is_available(&self) -> bool;

    /// Complete a prompt, returning the full text response.
    async fn complete(&self, prompt: &str) -> Result<String>;

    /// Complete a prompt with chunk streaming via channel receiver.
    async fn stream_complete(
        &self,
        prompt: &str,
    ) -> Result<tokio::sync::mpsc::Receiver<String>> {
        // Default implementation: emit full response in single chunk
        let text = self.complete(prompt).await?;
        let (tx, rx) = tokio::sync::mpsc::channel(4);
        let _ = tx.send(text).await;
        Ok(rx)
    }
}
