// nova-ai-runtime/src/ollama.rs — Ollama local provider

use anyhow::{bail, Context, Result};
use async_trait::async_trait;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tracing::{debug, info};

use crate::provider::AIProvider;

pub struct OllamaProvider {
    client: Client,
    base_url: String,
    model: String,
}

#[derive(Serialize)]
struct OllamaRequest {
    model: String,
    prompt: String,
    stream: bool,
}

#[derive(Deserialize)]
struct OllamaResponse {
    response: String,
}

impl OllamaProvider {
    pub fn new(base_url: Option<String>, model: Option<String>) -> Self {
        let base_url = base_url
            .or_else(|| std::env::var("NOVA_OLLAMA_URL").ok())
            .unwrap_or_else(|| "http://localhost:11434".to_string());
        let model = model
            .or_else(|| std::env::var("NOVA_OLLAMA_MODEL").ok())
            .unwrap_or_else(|| "llama3.2".to_string());
        Self {
            client: Client::new(),
            base_url,
            model,
        }
    }
}

#[async_trait]
impl AIProvider for OllamaProvider {
    fn name(&self) -> &str {
        "ollama"
    }

    fn model(&self) -> &str {
        &self.model
    }

    async fn complete(&self, prompt: &str) -> Result<String> {
        debug!("Sending prompt to Ollama (model={})", self.model);

        let url = format!("{}/api/generate", self.base_url);
        let request = OllamaRequest {
            model: self.model.clone(),
            prompt: prompt.to_string(),
            stream: false,
        };

        let response = self
            .client
            .post(&url)
            .json(&request)
            .send()
            .await
            .context("Failed to connect to Ollama")?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            bail!("Ollama error {}: {}", status, body);
        }

        let resp: OllamaResponse = response
            .json()
            .await
            .context("Failed to parse Ollama response")?;

        info!("Ollama response received ({} chars)", resp.response.len());
        Ok(resp.response)
    }
}

/// A mock provider used for testing without network access.
pub struct MockProvider;

#[async_trait]
impl AIProvider for MockProvider {
    fn name(&self) -> &str {
        "mock"
    }

    fn model(&self) -> &str {
        "mock-v1"
    }

    async fn complete(&self, prompt: &str) -> Result<String> {
        Ok(format!(
            "[MOCK RESPONSE] I received your prompt ({} chars). \
             In production, this would be answered by a real AI provider.",
            prompt.len()
        ))
    }
}
