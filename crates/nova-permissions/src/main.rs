// nova-permissions/src/main.rs — NOVA OS Permission Broker D-Bus Service

use anyhow::Result;
use nova_audit::AuditLogger;
use nova_system_api::{
    AuditEvent, AuditEventType, AuditOutcome, Permission, PermissionDecision,
};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{error, info, warn};
use tracing_subscriber::EnvFilter;
use zbus::{connection, interface};

mod broker;
mod storage;

use broker::PermissionBroker;

pub struct PermissionsService {
    broker: Arc<RwLock<PermissionBroker>>,
    audit: Arc<AuditLogger>,
}

#[interface(name = "org.nova.Permissions")]
impl PermissionsService {
    /// Request a permission for an application.
    /// Returns a JSON-serialized PermissionDecision.
    async fn request_permission(
        &self,
        app_id: String,
        permission: String,
        reason: String,
    ) -> zbus::fdo::Result<String> {
        let valid_permissions = nova_system_api::known_permissions();
        if !valid_permissions.contains(&permission.as_str()) {
            warn!("Unknown permission requested: {}", permission);
            return Err(zbus::fdo::Error::InvalidArgs(format!(
                "Unknown permission type: {}. Valid: {:?}",
                permission, valid_permissions
            )));
        }

        let broker = self.broker.read().await;
        let already_granted = broker.is_granted(&app_id, &permission);
        drop(broker);

        let granted = if already_granted {
            true
        } else {
            // On a real desktop this would show a polkit/portal dialog.
            // For now, default-deny and require explicit grant via grant_permission.
            false
        };

        let decision = PermissionDecision {
            app_id: app_id.clone(),
            permission: permission.clone(),
            granted,
            decided_at: chrono::Utc::now(),
            reason: if granted {
                "Previously granted".to_string()
            } else {
                "User approval required".to_string()
            },
        };

        // Audit the decision
        let event_type = if granted {
            AuditEventType::PermissionGranted
        } else {
            AuditEventType::PermissionDenied
        };
        let outcome = if granted {
            AuditOutcome::Success
        } else {
            AuditOutcome::Denied
        };

        let event = AuditEvent::new(
            event_type,
            &app_id,
            &permission,
            "request_permission",
            outcome,
        )
        .with_metadata(serde_json::json!({
            "reason": reason,
            "granted": granted,
        }));

        if let Err(e) = self.audit.log_event(event).await {
            error!("Failed to log audit event: {}", e);
        }

        serde_json::to_string(&decision)
            .map_err(|e| zbus::fdo::Error::Failed(e.to_string()))
    }

    /// Explicitly grant a permission (requires user confirmation in a real UI).
    async fn grant_permission(
        &self,
        app_id: String,
        permission: String,
    ) -> zbus::fdo::Result<bool> {
        let valid_permissions = nova_system_api::known_permissions();
        if !valid_permissions.contains(&permission.as_str()) {
            return Err(zbus::fdo::Error::InvalidArgs(format!(
                "Unknown permission: {}",
                permission
            )));
        }

        let mut broker = self.broker.write().await;
        match broker.grant(&app_id, &permission).await {
            Ok(_) => {
                info!("Granted {} to {}", permission, app_id);
                let event = AuditEvent::new(
                    AuditEventType::PermissionGranted,
                    &app_id,
                    &permission,
                    "grant_permission",
                    AuditOutcome::Success,
                );
                drop(broker);
                let _ = self.audit.log_event(event).await;
                Ok(true)
            }
            Err(e) => {
                error!("Failed to grant permission: {}", e);
                Err(zbus::fdo::Error::Failed(e.to_string()))
            }
        }
    }

    /// Revoke a previously granted permission.
    async fn revoke_permission(
        &self,
        app_id: String,
        permission: String,
    ) -> zbus::fdo::Result<bool> {
        let mut broker = self.broker.write().await;
        match broker.revoke(&app_id, &permission).await {
            Ok(_) => {
                info!("Revoked {} from {}", permission, app_id);
                let event = AuditEvent::new(
                    AuditEventType::PermissionRevoked,
                    &app_id,
                    &permission,
                    "revoke_permission",
                    AuditOutcome::Success,
                );
                drop(broker);
                let _ = self.audit.log_event(event).await;
                Ok(true)
            }
            Err(e) => {
                error!("Failed to revoke permission: {}", e);
                Err(zbus::fdo::Error::Failed(e.to_string()))
            }
        }
    }

    /// Get all permissions for an application.
    async fn get_app_permissions(&self, app_id: String) -> zbus::fdo::Result<String> {
        let broker = self.broker.read().await;
        let perms = broker.get_permissions(&app_id);
        serde_json::to_string(&perms).map_err(|e| zbus::fdo::Error::Failed(e.to_string()))
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")),
        )
        .init();

    info!("Starting nova-permissions D-Bus service");

    let storage = storage::PermissionStorage::new()?;
    let broker = PermissionBroker::load(storage).await?;
    let audit = AuditLogger::new()?;

    let service = PermissionsService {
        broker: Arc::new(RwLock::new(broker)),
        audit: Arc::new(audit),
    };

    let _conn = connection::Builder::session()?
        .name("org.nova.Permissions")?
        .serve_at("/org/nova/Permissions", service)?
        .build()
        .await?;

    info!("nova-permissions registered as org.nova.Permissions");

    #[cfg(unix)]
    {
        use tokio::signal::unix::{signal, SignalKind};
        let mut sigterm = signal(SignalKind::terminate())?;
        let mut sigint = signal(SignalKind::interrupt())?;
        tokio::select! {
            _ = sigterm.recv() => { info!("SIGTERM received, shutting down"); }
            _ = sigint.recv()  => { info!("SIGINT received, shutting down"); }
        }
    }
    #[cfg(not(unix))]
    {
        tokio::signal::ctrl_c().await?;
        info!("Ctrl-C received, shutting down");
    }

    Ok(())
}
