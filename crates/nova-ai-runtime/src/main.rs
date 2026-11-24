// nova-ai-runtime/src/main.rs — NOVA OS AI Runtime Service

use anyhow::Result;
use nova_ai_runtime::{gemini::GeminiProvider, ollama::OllamaProvider, provider::AIProvider, tool_registry::ToolRegistry};
use nova_audit::AuditLogger;
use nova_system_api::{AIToolCall, AuditEvent, AuditEventType, AuditOutcome};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::info;
use tracing_subscriber::EnvFilter;

#[cfg(unix)]
use zbus::{connection, interface};

struct AIRuntimeService {
    registry: Arc<RwLock<ToolRegistry>>,
    audit: Arc<AuditLogger>,
}

impl AIRuntimeService {
    pub async fn process_query_impl(&self, query: &str) -> String {
        info!("Received AI query: {}", query);
        
        if let Ok(provider) = GeminiProvider::from_env() {
            match provider.complete(query).await {
                Ok(res) => res,
                Err(e) => format!("Gemini provider returned error: {}. Operating in local offline mode.", e),
            }
        } else {
            let ollama = OllamaProvider::new(None, None);
            match ollama.complete(query).await {
                Ok(res) => res,
                Err(_) => "NOVA Intelligence is ready. Configure an API key or run Ollama locally for active generation.".to_string(),
            }
        }
    }

    pub async fn execute_tool_impl(&self, tool_name: &str, params_json: &str) -> Result<String> {
        info!("Tool execution requested: {}", tool_name);
        let params: serde_json::Value = serde_json::from_str(params_json)
            .unwrap_or(serde_json::Value::Null);

        let call = AIToolCall {
            tool_name: tool_name.to_string(),
            params,
            caller_app_id: "org.nova.assistant".to_string(),
        };

        let registry = self.registry.read().await;
        if !registry.is_registered(tool_name) {
            let audit_event = AuditEvent::new(
                AuditEventType::AIToolExecution,
                "org.nova.assistant",
                tool_name,
                "execute_tool",
                AuditOutcome::Denied,
            );
            let _ = self.audit.log_event(audit_event).await;
            anyhow::bail!("Tool '{}' is not registered in the allowlist", tool_name);
        }

        let result = registry.execute(&call, true);
        let outcome = if result.success { AuditOutcome::Success } else { AuditOutcome::Failure };

        let audit_event = AuditEvent::new(
            AuditEventType::AIToolExecution,
            "org.nova.assistant",
            tool_name,
            "execute_tool",
            outcome,
        );
        let _ = self.audit.log_event(audit_event).await;

        Ok(serde_json::to_string(&result)?)
    }
}

#[cfg(unix)]
#[interface(name = "org.nova.AIRuntime")]
impl AIRuntimeService {
    async fn process_query(&self, query: String, _context: String) -> zbus::fdo::Result<String> {
        Ok(self.process_query_impl(&query).await)
    }

    async fn execute_tool(&self, tool_name: String, params_json: String) -> zbus::fdo::Result<String> {
        self.execute_tool_impl(&tool_name, &params_json)
            .await
            .map_err(|e| zbus::fdo::Error::InvalidArgs(e.to_string()))
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")))
        .init();

    info!("Starting nova-ai-runtime service");

    let audit = Arc::new(AuditLogger::new().await?);
    let registry = Arc::new(RwLock::new(ToolRegistry::new()));

    let service = AIRuntimeService { registry, audit };

    #[cfg(unix)]
    {
        let _conn = connection::Builder::session()?
            .name("org.nova.AIRuntime")?
            .serve_at("/org/nova/AIRuntime", service)?
            .build()
            .await?;

        info!("nova-ai-runtime registered as org.nova.AIRuntime on session bus");

        use tokio::signal::unix::{signal, SignalKind};
        let mut sigterm = signal(SignalKind::terminate())?;
        let mut sigint = signal(SignalKind::interrupt())?;
        tokio::select! {
            _ = sigterm.recv() => { info!("SIGTERM received, shutting down"); }
            _ = sigint.recv() => { info!("SIGINT received, shutting down"); }
        }
    }

    #[cfg(not(unix))]
    {
        info!("Running nova-ai-runtime in standalone mode (non-Linux platform)");
        let response = service.process_query_impl("system check").await;
        info!("AI Runtime self-test response: {}", response);
        if let Ok(tool_res) = service.execute_tool_impl("inspect_system_hardware", "{}").await {
            info!("Self-test tool execution: {}", tool_res);
        }
        info!("Tool registry tools: {:?}", service.registry.read().await.list_tools());
        tokio::signal::ctrl_c().await?;
        info!("Ctrl-C received, shutting down");
    }

    Ok(())
}
