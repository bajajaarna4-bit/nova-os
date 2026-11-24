// nova-ai-runtime/src/main.rs — NOVA OS AI Runtime D-Bus Service

use anyhow::Result;
use nova_ai_runtime::{gemini::GeminiProvider, ollama::OllamaProvider, provider::AIProvider, tool_registry::ToolRegistry};
use nova_audit::AuditLogger;
use nova_system_api::{AIToolCall, AuditEvent, AuditEventType, AuditOutcome};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{error, info};
use tracing_subscriber::EnvFilter;
use zbus::{connection, interface};

struct AIRuntimeService {
    registry: Arc<RwLock<ToolRegistry>>,
    audit: Arc<AuditLogger>,
}

#[interface(name = "org.nova.AIRuntime")]
impl AIRuntimeService {
    async fn process_query(&self, query: String, _context: String) -> zbus::fdo::Result<String> {
        info!("Received AI query: {}", query);
        
        // Priority: local Ollama if reachable, then Gemini if configured, else offline mode
        let response_text = if let Ok(key) = std::env::var("NOVA_GEMINI_API_KEY") {
            let provider = GeminiProvider::new(key);
            match provider.complete(&query).await {
                Ok(res) => res,
                Err(e) => format!("Gemini provider returned error: {}. Operating in local offline mode.", e),
            }
        } else {
            let ollama = OllamaProvider::default();
            match ollama.complete(&query).await {
                Ok(res) => res,
                Err(_) => "NOVA Intelligence is ready. Configure an API key or run Ollama locally for active generation.".to_string(),
            }
        };

        Ok(response_text)
    }

    async fn execute_tool(&self, tool_name: String, params_json: String) -> zbus::fdo::Result<String> {
        info!("Tool execution requested: {}", tool_name);
        let params: serde_json::Value = serde_json::from_str(&params_json)
            .unwrap_or(serde_json::Value::Null);

        let call = AIToolCall {
            tool_name: tool_name.clone(),
            params,
            caller_app_id: "org.nova.assistant".to_string(),
        };

        let registry = self.registry.read().await;
        // Verify tool exists in allowlist
        if !registry.is_registered(&tool_name) {
            let audit_event = AuditEvent::new(
                AuditEventType::AIToolExecution,
                "org.nova.assistant",
                &tool_name,
                "execute_tool",
                AuditOutcome::Denied,
            );
            let _ = self.audit.log_event(audit_event).await;
            return Err(zbus::fdo::Error::InvalidArgs(format!("Tool '{}' is not registered", tool_name)));
        }

        let result = registry.execute(&call, true);
        let outcome = if result.success { AuditOutcome::Success } else { AuditOutcome::Failure };

        let audit_event = AuditEvent::new(
            AuditEventType::AIToolExecution,
            "org.nova.assistant",
            &tool_name,
            "execute_tool",
            outcome,
        );
        let _ = self.audit.log_event(audit_event).await;

        serde_json::to_string(&result).map_err(|e| zbus::fdo::Error::Failed(e.to_string()))
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")))
        .init();

    info!("Starting nova-ai-runtime service");

    let audit = Arc::new(AuditLogger::new()?);
    let registry = Arc::new(RwLock::new(ToolRegistry::new()));

    let service = AIRuntimeService { registry, audit };

    let _conn = connection::Builder::session()?
        .name("org.nova.AIRuntime")?
        .serve_at("/org/nova/AIRuntime", service)?
        .build()
        .await?;

    info!("nova-ai-runtime registered as org.nova.AIRuntime");

    #[cfg(unix)]
    {
        use tokio::signal::unix::{signal, SignalKind};
        let mut sigterm = signal(SignalKind::terminate())?;
        let mut sigint = signal(SignalKind::interrupt())?;
        tokio::select! {
            _ = sigterm.recv() => { info!("SIGTERM received"); }
            _ = sigint.recv() => { info!("SIGINT received"); }
        }
    }
    #[cfg(not(unix))]
    {
        tokio::signal::ctrl_c().await?;
    }

    Ok(())
}
