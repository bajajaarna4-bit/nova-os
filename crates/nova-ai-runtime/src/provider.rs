// nova-ai-runtime/src/provider.rs — Provider trait

use anyhow::Result;
use async_trait::async_trait;

#[async_trait]
pub trait AIProvider: Send + Sync {
    /// Return provider name (e.g. "gemini", "ollama", "mock").
    fn name(&self) -> &str;

    /// Return the model identifier used.
    fn model(&self) -> &str;

    /// Complete a prompt, returning the text response.
    async fn complete(&self, prompt: &str) -> Result<String>;
}
