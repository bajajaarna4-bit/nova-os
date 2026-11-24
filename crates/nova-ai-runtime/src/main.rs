// nova-ai-runtime/src/main.rs — NOVA OS AI Runtime Service

use anyhow::Result;
use nova_ai_runtime::{
    context::{ContextManager, MessageRole},
    manager::{ProviderManager, ProviderMode},
    provider::ProviderStatus,
    tool_registry::ToolRegistry,
};
use nova_audit::AuditLogger;
use nova_system_api::{AIToolCall, AuditEvent, AuditEventType, AuditOutcome};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::info;
use tracing_subscriber::EnvFilter;

#[cfg(unix)]
use zbus::{connection, interface};

pub struct AIRuntimeService {
    manager: Arc<ProviderManager>,
    registry: Arc<RwLock<ToolRegistry>>,
    context: Arc<RwLock<ContextManager>>,
    audit: Arc<AuditLogger>,
}

impl AIRuntimeService {
    pub fn new(audit: Arc<AuditLogger>) -> Self {
        Self {
            manager: Arc::new(ProviderManager::new()),
            registry: Arc::new(RwLock::new(ToolRegistry::new())),
            context: Arc::new(RwLock::new(ContextManager::new(15))),
            audit,
        }
    }

    pub async fn process_query_impl(&self, query: &str) -> String {
        info!("Received AI query: {}", query);

        // Record user message in context
        {
            let mut ctx = self.context.write().await;
            ctx.add_message(MessageRole::User, query.to_string(), None);
        }

        // Render prompt with history
        let rendered_prompt = {
            let ctx = self.context.read().await;
            ctx.render_prompt_with_context(query)
        };

        // Query active provider with fallback hierarchy
        let result = match self.manager.complete(&rendered_prompt).await {
            Ok(res) => res,
            Err(e) => {
                let err_msg = format!("AI provider failed: {}. Operating in offline safety mode.", e);
                return err_msg;
            }
        };

        // Record assistant response in context
        {
            let mut ctx = self.context.write().await;
            ctx.add_message(MessageRole::Assistant, result.text.clone(), None);
        }

        // Log audit event
        let audit_event = AuditEvent::new(
            AuditEventType::AIQuery,
            "org.nova.assistant",
            format!("{}:{}", result.provider_used, result.model_used),
            "complete_query",
            AuditOutcome::Success,
        );
        let _ = self.audit.log_event(audit_event).await;

        result.text
    }

    pub async fn execute_tool_impl(
        &self,
        tool_name: &str,
        params_json: &str,
        user_approved: bool,
    ) -> Result<String> {
        info!("Tool execution requested: {} (approved: {})", tool_name, user_approved);
        let params: serde_json::Value =
            serde_json::from_str(params_json).unwrap_or(serde_json::Value::Null);

        let call = AIToolCall {
            tool_name: tool_name.to_string(),
            params,
            caller_app_id: "org.nova.assistant".to_string(),
        };

        let registry = self.registry.read().await;

        // Verify registration
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

        // Consequential check: Consequential tools MUST have explicit user confirmation
        if registry.is_consequential(tool_name) && !user_approved {
            let audit_event = AuditEvent::new(
                AuditEventType::AIToolExecution,
                "org.nova.assistant",
                tool_name,
                "execute_tool",
                AuditOutcome::Denied,
            );
            let _ = self.audit.log_event(audit_event).await;
            anyhow::bail!("Consequential tool '{}' requires explicit user confirmation", tool_name);
        }

        // Execute tool through permission gate
        let result = registry.execute(&call, user_approved);
        let outcome = if result.success {
            AuditOutcome::Success
        } else {
            AuditOutcome::Failure
        };

        // Record in conversation context
        {
            let mut ctx = self.context.write().await;
            ctx.add_message(
                MessageRole::Tool,
                serde_json::to_string(&result.output).unwrap_or_default(),
                Some(tool_name.to_string()),
            );
        }

        // Audit log
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

    pub async fn list_provider_statuses(&self) -> Vec<ProviderStatus> {
        self.manager.list_provider_statuses().await
    }

    pub async fn set_provider_mode(&self, mode: ProviderMode) {
        self.manager.set_mode(mode).await;
    }
}

#[cfg(unix)]
#[interface(name = "org.nova.AIRuntime")]
impl AIRuntimeService {
    async fn process_query(&self, query: String, _context: String) -> zbus::fdo::Result<String> {
        Ok(self.process_query_impl(&query).await)
    }

    async fn execute_tool(
        &self,
        tool_name: String,
        params_json: String,
        user_approved: bool,
    ) -> zbus::fdo::Result<String> {
        self.execute_tool_impl(&tool_name, &params_json, user_approved)
            .await
            .map_err(|e| zbus::fdo::Error::InvalidArgs(e.to_string()))
    }

    async fn get_provider_statuses(&self) -> zbus::fdo::Result<String> {
        let statuses = self.list_provider_statuses().await;
        serde_json::to_string(&statuses).map_err(|e| zbus::fdo::Error::Failed(e.to_string()))
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")),
        )
        .init();

    info!("Starting nova-ai-runtime service");

    let audit = Arc::new(AuditLogger::new().await?);
    let service = AIRuntimeService::new(audit);

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
        info!("AI Runtime response: {}", response);
        if let Ok(tool_res) = service.execute_tool_impl("inspect_system_hardware", "{}", true).await {
            info!("Self-test tool execution: {}", tool_res);
        }
        info!("Provider statuses: {:?}", service.list_provider_statuses().await);
        info!("Tool registry tools: {:?}", service.registry.read().await.list_tools());
        tokio::signal::ctrl_c().await?;
        info!("Ctrl-C received, shutting down");
    }

    Ok(())
}
