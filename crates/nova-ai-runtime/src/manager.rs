// nova-ai-runtime/src/manager.rs — Provider orchestrator with dynamic selection and offline fallback

use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, warn};

use crate::gemini::GeminiProvider;
use crate::offline::OfflineBuiltinProvider;
use crate::ollama::OllamaProvider;
use crate::provider::{AIProvider, ProviderKind, ProviderStatus};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ProviderMode {
    Auto,           // Tries Gemini -> Ollama -> Offline
    GeminiOnly,     // Only cloud Gemini
    OllamaOnly,     // Only local Ollama
    OfflineOnly,    // Only local offline engine
}

pub struct ProviderManager {
    mode: RwLock<ProviderMode>,
    gemini: Option<Arc<GeminiProvider>>,
    ollama: Arc<OllamaProvider>,
    offline: Arc<OfflineBuiltinProvider>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryResult {
    pub text: String,
    pub provider_used: ProviderKind,
    pub model_used: String,
    pub is_fallback: bool,
    pub latency_ms: u64,
}

impl Default for ProviderManager {
    fn default() -> Self {
        Self::new()
    }
}

impl ProviderManager {
    pub fn new() -> Self {
        let gemini = GeminiProvider::from_env().ok().map(Arc::new);
        let ollama = Arc::new(OllamaProvider::new(None, None));
        let offline = Arc::new(OfflineBuiltinProvider::new());

        Self {
            mode: RwLock::new(ProviderMode::Auto),
            gemini,
            ollama,
            offline,
        }
    }

    pub async fn set_mode(&self, mode: ProviderMode) {
        let mut m = self.mode.write().await;
        *m = mode;
        info!("AI Provider mode updated to {:?}", mode);
    }

    pub async fn get_mode(&self) -> ProviderMode {
        *self.mode.read().await
    }

    pub async fn list_provider_statuses(&self) -> Vec<ProviderStatus> {
        let mut statuses = Vec::new();

        // 1. Gemini
        let gemini_avail = if let Some(g) = &self.gemini {
            g.is_available().await
        } else {
            false
        };
        statuses.push(ProviderStatus {
            kind: ProviderKind::Gemini,
            name: "Gemini Cloud".to_string(),
            model: self
                .gemini
                .as_ref()
                .map(|g| g.model().to_string())
                .unwrap_or_else(|| "unconfigured".to_string()),
            available: gemini_avail,
            latency_ms: None,
        });

        // 2. Ollama
        let ollama_avail = self.ollama.is_available().await;
        statuses.push(ProviderStatus {
            kind: ProviderKind::Ollama,
            name: "Ollama Local Daemon".to_string(),
            model: self.ollama.model().to_string(),
            available: ollama_avail,
            latency_ms: None,
        });

        // 3. Offline Built-in
        statuses.push(ProviderStatus {
            kind: ProviderKind::OfflineBuiltin,
            name: "Offline Zero-Trust Rules Engine".to_string(),
            model: self.offline.model().to_string(),
            available: true,
            latency_ms: Some(1),
        });

        statuses
    }

    pub async fn complete(&self, prompt: &str) -> Result<QueryResult> {
        let start = std::time::Instant::now();
        let mode = *self.mode.read().await;

        match mode {
            ProviderMode::GeminiOnly => {
                if let Some(gemini) = &self.gemini {
                    let text = gemini.complete(prompt).await?;
                    Ok(QueryResult {
                        text,
                        provider_used: ProviderKind::Gemini,
                        model_used: gemini.model().to_string(),
                        is_fallback: false,
                        latency_ms: start.elapsed().as_millis() as u64,
                    })
                } else {
                    anyhow::bail!("Gemini provider is not configured (missing NOVA_GEMINI_API_KEY)");
                }
            }
            ProviderMode::OllamaOnly => {
                let text = self.ollama.complete(prompt).await?;
                Ok(QueryResult {
                    text,
                    provider_used: ProviderKind::Ollama,
                    model_used: self.ollama.model().to_string(),
                    is_fallback: false,
                    latency_ms: start.elapsed().as_millis() as u64,
                })
            }
            ProviderMode::OfflineOnly => {
                let text = self.offline.complete(prompt).await?;
                Ok(QueryResult {
                    text,
                    provider_used: ProviderKind::OfflineBuiltin,
                    model_used: self.offline.model().to_string(),
                    is_fallback: false,
                    latency_ms: start.elapsed().as_millis() as u64,
                })
            }
            ProviderMode::Auto => {
                // Tier 1: Try Gemini if configured and reachable
                if let Some(gemini) = &self.gemini {
                    info!("Auto mode: Attempting primary provider Gemini...");
                    match gemini.complete(prompt).await {
                        Ok(text) => {
                            return Ok(QueryResult {
                                text,
                                provider_used: ProviderKind::Gemini,
                                model_used: gemini.model().to_string(),
                                is_fallback: false,
                                latency_ms: start.elapsed().as_millis() as u64,
                            });
                        }
                        Err(e) => {
                            warn!("Gemini query failed: {}. Falling back to local Ollama.", e);
                        }
                    }
                }

                // Tier 2: Try local Ollama if reachable
                if self.ollama.is_available().await {
                    info!("Auto mode: Attempting local Ollama provider...");
                    match self.ollama.complete(prompt).await {
                        Ok(text) => {
                            return Ok(QueryResult {
                                text,
                                provider_used: ProviderKind::Ollama,
                                model_used: self.ollama.model().to_string(),
                                is_fallback: true,
                                latency_ms: start.elapsed().as_millis() as u64,
                            });
                        }
                        Err(e) => {
                            warn!(
                                "Ollama query failed: {}. Falling back to Offline Built-in Engine.",
                                e
                            );
                        }
                    }
                }

                // Tier 3: Guaranteed Offline Built-in fallback
                info!("Auto mode: Using Offline Built-in Engine (zero-network guarantee).");
                let text = self.offline.complete(prompt).await?;
                Ok(QueryResult {
                    text,
                    provider_used: ProviderKind::OfflineBuiltin,
                    model_used: self.offline.model().to_string(),
                    is_fallback: true,
                    latency_ms: start.elapsed().as_millis() as u64,
                })
            }
        }
    }
}
