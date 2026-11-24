// nova-permissions/src/storage.rs — Persistent permission store

use anyhow::Result;
use nova_system_api::Permission;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use tokio::fs;
use tracing::{info, warn};

/// Key = "app_id:permission_type"
type PermissionMap = HashMap<String, Permission>;

#[derive(Debug, Serialize, Deserialize, Default)]
struct PermissionStore {
    permissions: PermissionMap,
}

pub struct PersistentPermissionStore {
    store_path: PathBuf,
    state: PermissionStore,
}

impl PersistentPermissionStore {
    pub async fn load() -> Result<Self> {
        let path = Self::default_path();
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).await?;
        }

        let state = if path.exists() {
            match fs::read_to_string(&path).await {
                Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
                Err(e) => {
                    warn!("Could not read permissions store: {}, starting fresh", e);
                    PermissionStore::default()
                }
            }
        } else {
            PermissionStore::default()
        };

        Ok(Self { store_path: path, state })
    }

    fn default_path() -> PathBuf {
        #[cfg(target_os = "linux")]
        {
            let home = std::env::var("HOME").unwrap_or_else(|_| "/root".to_string());
            PathBuf::from(home).join(".local/share/nova/permissions.json")
        }
        #[cfg(not(target_os = "linux"))]
        {
            let home = std::env::var("USERPROFILE")
                .or_else(|_| std::env::var("HOME"))
                .unwrap_or_else(|_| ".".to_string());
            PathBuf::from(home).join(".local/share/nova/permissions.json")
        }
    }

    fn key(app_id: &str, permission_type: &str) -> String {
        format!("{}:{}", app_id, permission_type)
    }

    pub fn get(&self, app_id: &str, permission_type: &str) -> Option<&Permission> {
        self.state.permissions.get(&Self::key(app_id, permission_type))
    }

    pub fn set(&mut self, permission: Permission) {
        let k = Self::key(&permission.app_id, &permission.permission_type);
        self.state.permissions.insert(k, permission);
    }

    pub fn get_app_permissions(&self, app_id: &str) -> Vec<Permission> {
        self.state
            .permissions
            .values()
            .filter(|p| p.app_id == app_id)
            .cloned()
            .collect()
    }

    pub async fn persist(&self) -> Result<()> {
        let content = serde_json::to_string_pretty(&self.state)?;
        fs::write(&self.store_path, content).await?;
        info!("Permission store persisted to {:?}", self.store_path);
        Ok(())
    }
}
