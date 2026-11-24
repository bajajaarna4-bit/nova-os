// nova-permissions/src/main.rs — NOVA OS Permission Broker Service

use anyhow::Result;
use nova_audit::AuditLogger;
use nova_system_api::{
    AuditEvent, AuditEventType, AuditOutcome, Permission, PermissionDecision,
};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, warn};
use tracing_subscriber::EnvFilter;

#[cfg(unix)]
use zbus::{connection, interface};

mod broker;
mod storage;

use broker::PermissionBroker;
use storage::PersistentPermissionStore;

pub struct PermissionsService {
    broker: Arc<RwLock<PermissionBroker>>,
    audit: Arc<AuditLogger>,
}

impl PermissionsService {
    pub async fn request_permission_impl(
        &self,
        app_id: String,
        permission: String,
        reason: String,
    ) -> Result<PermissionDecision> {
        let valid_permissions = nova_system_api::known_permissions();
        if !valid_permissions.contains(&permission.as_str()) {
            warn!("Unknown permission requested: {}", permission);
            anyhow::bail!("Unknown permission type: {}", permission);
        }

        let mut broker = self.broker.write().await;
        let decision = broker.request_permission(&app_id, &permission, &reason).await;
        drop(broker);

        let event_type = if decision.granted {
            AuditEventType::PermissionGranted
        } else {
            AuditEventType::PermissionDenied
        };
        let outcome = if decision.granted {
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
            "granted": decision.granted,
        }));

        let _ = self.audit.log_event(event).await;
        Ok(decision)
    }

    pub async fn grant_permission_impl(
        &self,
        app_id: String,
        permission: String,
    ) -> Result<bool> {
        let valid_permissions = nova_system_api::known_permissions();
        if !valid_permissions.contains(&permission.as_str()) {
            anyhow::bail!("Unknown permission: {}", permission);
        }

        let mut broker = self.broker.write().await;
        broker.grant_permission(&app_id, &permission).await?;
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

    pub async fn revoke_permission_impl(
        &self,
        app_id: String,
        permission: String,
    ) -> Result<bool> {
        let mut broker = self.broker.write().await;
        broker.revoke_permission(&app_id, &permission).await?;
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

    pub async fn get_app_permissions_impl(&self, app_id: String) -> Result<Vec<Permission>> {
        let broker = self.broker.read().await;
        Ok(broker.get_app_permissions(&app_id))
    }
}

#[cfg(unix)]
#[interface(name = "org.nova.Permissions")]
impl PermissionsService {
    async fn request_permission(
        &self,
        app_id: String,
        permission: String,
        reason: String,
    ) -> zbus::fdo::Result<String> {
        match self.request_permission_impl(app_id, permission, reason).await {
            Ok(decision) => serde_json::to_string(&decision)
                .map_err(|e| zbus::fdo::Error::Failed(e.to_string())),
            Err(e) => Err(zbus::fdo::Error::InvalidArgs(e.to_string())),
        }
    }

    async fn grant_permission(
        &self,
        app_id: String,
        permission: String,
    ) -> zbus::fdo::Result<bool> {
        self.grant_permission_impl(app_id, permission)
            .await
            .map_err(|e| zbus::fdo::Error::Failed(e.to_string()))
    }

    async fn revoke_permission(
        &self,
        app_id: String,
        permission: String,
    ) -> zbus::fdo::Result<bool> {
        self.revoke_permission_impl(app_id, permission)
            .await
            .map_err(|e| zbus::fdo::Error::Failed(e.to_string()))
    }

    async fn get_app_permissions(&self, app_id: String) -> zbus::fdo::Result<String> {
        match self.get_app_permissions_impl(app_id).await {
            Ok(perms) => serde_json::to_string(&perms)
                .map_err(|e| zbus::fdo::Error::Failed(e.to_string())),
            Err(e) => Err(zbus::fdo::Error::Failed(e.to_string())),
        }
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")),
        )
        .init();

    info!("Starting nova-permissions service");

    let store = PersistentPermissionStore::load().await?;
    let broker = PermissionBroker::new(store);
    let audit = AuditLogger::new().await?;

    let service = PermissionsService {
        broker: Arc::new(RwLock::new(broker)),
        audit: Arc::new(audit),
    };

    #[cfg(unix)]
    {
        let _conn = connection::Builder::session()?
            .name("org.nova.Permissions")?
            .serve_at("/org/nova/Permissions", service)?
            .build()
            .await?;

        info!("nova-permissions registered as org.nova.Permissions on session bus");

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
        info!("Running nova-permissions in standalone mode (non-Linux platform)");
        let dec = service
            .request_permission_impl("org.nova.terminal".into(), "files".into(), "test".into())
            .await?;
        info!("Permission broker verified: {:?}", dec);
        tokio::signal::ctrl_c().await?;
        info!("Ctrl-C received, shutting down");
    }

    Ok(())
}
