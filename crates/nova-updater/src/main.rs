// nova-updater/src/main.rs — NOVA OS System Updater D-Bus Service

use anyhow::Result;
use nova_audit::AuditLogger;
use nova_system_api::{AuditEvent, AuditEventType, AuditOutcome};
use nova_updater::UpdateManager;
use std::sync::Arc;
use tracing::info;
use tracing_subscriber::EnvFilter;
use zbus::{connection, interface};

struct UpdaterService {
    manager: UpdateManager,
    audit: Arc<AuditLogger>,
}

#[interface(name = "org.nova.Updater")]
impl UpdaterService {
    async fn check_for_updates(&self) -> zbus::fdo::Result<String> {
        match self.manager.check_for_updates() {
            Ok(info) => serde_json::to_string(&info)
                .map_err(|e| zbus::fdo::Error::Failed(e.to_string())),
            Err(e) => Err(zbus::fdo::Error::Failed(e.to_string())),
        }
    }

    async fn get_update_history(&self) -> zbus::fdo::Result<String> {
        let history = self.manager.get_history();
        serde_json::to_string(&history)
            .map_err(|e| zbus::fdo::Error::Failed(e.to_string()))
    }

    async fn apply_update(&self, version: String) -> zbus::fdo::Result<bool> {
        info!("Applying update to version {}", version);
        let event = AuditEvent::new(
            AuditEventType::SystemUpdate,
            "root",
            &version,
            "apply_update",
            AuditOutcome::Success,
        );
        let _ = self.audit.log_event(event).await;
        Ok(true)
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")))
        .init();

    info!("Starting nova-updater D-Bus service");

    let audit = Arc::new(AuditLogger::new()?);
    let manager = UpdateManager::new();
    let service = UpdaterService { manager, audit };

    let _conn = connection::Builder::session()?
        .name("org.nova.Updater")?
        .serve_at("/org/nova/Updater", service)?
        .build()
        .await?;

    info!("nova-updater registered as org.nova.Updater");

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
