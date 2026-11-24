// nova-ai-runtime/src/gemini.rs — Gemini API provider

use anyhow::{bail, Context, Result};
use async_trait::async_trait;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tracing::{debug, info};

use crate::provider::{AIProvider, ProviderKind};

pub struct GeminiProvider {
    client: Client,
    api_key: String,
    model: String,
    endpoint: String,
}

#[derive(Serialize)]
struct GeminiRequest {
    contents: Vec<Content>,
}

#[derive(Serialize)]
struct Content {
    parts: Vec<Part>,
}

#[derive(Serialize)]
struct Part {
    text: String,
}

#[derive(Deserialize)]
struct GeminiResponse {
    candidates: Vec<Candidate>,
}

#[derive(Deserialize)]
struct Candidate {
    content: ContentResponse,
}

#[derive(Deserialize)]
struct ContentResponse {
    parts: Vec<PartResponse>,
}

#[derive(Deserialize)]
struct PartResponse {
    text: String,
}

impl GeminiProvider {
    /// Create from environment. Reads NOVA_GEMINI_API_KEY — never hardcoded.
    pub fn from_env() -> Result<Self> {
        let api_key = std::env::var("NOVA_GEMINI_API_KEY")
            .context("NOVA_GEMINI_API_KEY environment variable is not set")?;
        let model = std::env::var("NOVA_GEMINI_MODEL")
            .unwrap_or_else(|_| "gemini-2.0-flash-exp".to_string());

        let endpoint = format!(
            "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent",
            model
        );

        Ok(Self {
            client: Client::new(),
            api_key,
            model,
            endpoint,
        })
    }
}

#[async_trait]
impl AIProvider for GeminiProvider {
    fn kind(&self) -> ProviderKind {
        ProviderKind::Gemini
    }

    fn name(&self) -> &str {
        "gemini"
    }

    fn model(&self) -> &str {
        &self.model
    }

    async fn is_available(&self) -> bool {
        !self.api_key.trim().is_empty()
    }

    async fn complete(&self, prompt: &str) -> Result<String> {
        debug!("Sending prompt to Gemini (model={})", self.model);

        let request = GeminiRequest {
            contents: vec![Content {
                parts: vec![Part {
                    text: prompt.to_string(),
                }],
            }],
        };

        let response = self
            .client
            .post(&self.endpoint)
            .query(&[("key", &self.api_key)])
            .json(&request)
            .send()
            .await
            .context("Failed to send request to Gemini API")?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            bail!("Gemini API error {}: {}", status, body);
        }

        let gemini_resp: GeminiResponse = response
            .json()
            .await
            .context("Failed to parse Gemini API response")?;

        let text = gemini_resp
            .candidates
            .into_iter()
            .next()
            .and_then(|c| c.content.parts.into_iter().next())
            .map(|p| p.text)
            .unwrap_or_default();

        info!("Gemini response received ({} chars)", text.len());
        Ok(text)
    }
}
