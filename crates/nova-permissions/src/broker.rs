// nova-permissions/src/broker.rs — Permission decision logic

use chrono::Utc;
use nova_system_api::{
    AuditEventType, AuditOutcome, Permission, PermissionDecision, known_permissions,
};
use tracing::{info, warn};

use crate::storage::PersistentPermissionStore;

pub struct PermissionBroker {
    pub store: PersistentPermissionStore,
}

impl PermissionBroker {
    pub fn new(store: PersistentPermissionStore) -> Self {
        Self { store }
    }

    /// Process a permission request and return decision.
    /// Does NOT auto-grant: returns a denial with a "user-interaction-required" reason.
    /// In a real desktop environment, this would prompt a polkit dialog.
    pub async fn request_permission(
        &mut self,
        app_id: &str,
        permission: &str,
        _reason: &str,
    ) -> PermissionDecision {
        // Validate permission name
        if !known_permissions().contains(&permission) {
            warn!("Unknown permission requested: {}", permission);
            return PermissionDecision {
                app_id: app_id.to_string(),
                permission: permission.to_string(),
                granted: false,
                decided_at: Utc::now(),
                reason: format!("Unknown permission type: {}", permission),
            };
        }

        // Check existing grant
        if let Some(existing) = self.store.get(app_id, permission) {
            if existing.granted && existing.revoked_at.is_none() {
                info!("Permission {} already granted to {}", permission, app_id);
                return PermissionDecision {
                    app_id: app_id.to_string(),
                    permission: permission.to_string(),
                    granted: true,
                    decided_at: Utc::now(),
                    reason: "Previously granted".to_string(),
                };
            }
        }

        // No existing grant — in production a polkit/portal dialog would be shown.
        // We record as pending denial; callers should surface to the user.
        warn!(
            "Permission {} requested by {} — requires user confirmation (no active UI session in daemon mode)",
            permission, app_id
        );

        PermissionDecision {
            app_id: app_id.to_string(),
            permission: permission.to_string(),
            granted: false,
            decided_at: Utc::now(),
            reason: "User confirmation required".to_string(),
        }
    }

    /// Grant a permission (called after user confirmation).
    pub async fn grant_permission(&mut self, app_id: &str, permission: &str) -> anyhow::Result<()> {
        let perm = Permission {
            app_id: app_id.to_string(),
            permission_type: permission.to_string(),
            granted: true,
            granted_at: Some(Utc::now()),
            revoked_at: None,
        };
        self.store.set(perm);
        self.store.persist().await?;
        info!("Permission {} granted to {}", permission, app_id);
        Ok(())
    }

    /// Revoke a permission.
    pub async fn revoke_permission(&mut self, app_id: &str, permission: &str) -> anyhow::Result<()> {
        if let Some(existing) = self.store.get(app_id, permission).cloned() {
            let revoked = Permission {
                revoked_at: Some(Utc::now()),
                granted: false,
                ..existing
            };
            self.store.set(revoked);
            self.store.persist().await?;
            info!("Permission {} revoked from {}", permission, app_id);
        } else {
            warn!("No permission record found for {} / {}", app_id, permission);
        }
        Ok(())
    }

    pub fn get_app_permissions(&self, app_id: &str) -> Vec<Permission> {
        self.store.get_app_permissions(app_id)
    }
}
