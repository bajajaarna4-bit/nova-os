// nova-security/src/main.rs — NOVA OS Security Monitoring Service

pub mod firewall;
pub mod secure_boot;
pub mod selinux;

use anyhow::Result;
use nova_system_api::{FirewallStatus, ProcessInfo, SecurityStatus};
use tracing::info;
use tracing_subscriber::EnvFilter;

#[cfg(unix)]
use zbus::{connection, interface};

struct SecurityService;

impl SecurityService {
    pub async fn get_security_status_impl(&self) -> SecurityStatus {
        let secure_boot_enabled = secure_boot::read_secure_boot_status().await;
        let selinux_mode = selinux::read_selinux_mode().await;
        let firewall_status = firewall::read_firewall_status().await;
        let dm_crypt_active = check_dm_crypt().await;

        SecurityStatus {
            secure_boot_enabled,
            selinux_mode,
            dm_crypt_active,
            firewall_active: Some(firewall_status.active),
        }
    }

    pub async fn get_process_list_impl(&self) -> Vec<ProcessInfo> {
        collect_process_list().await
    }

    pub async fn get_firewall_status_impl(&self) -> FirewallStatus {
        firewall::read_firewall_status().await
    }
}

#[cfg(unix)]
#[interface(name = "org.nova.Security")]
impl SecurityService {
    async fn get_security_status(&self) -> zbus::fdo::Result<String> {
        let status = self.get_security_status_impl().await;
        serde_json::to_string(&status).map_err(|e| zbus::fdo::Error::Failed(e.to_string()))
    }

    async fn get_process_list(&self) -> zbus::fdo::Result<String> {
        let processes = self.get_process_list_impl().await;
        serde_json::to_string(&processes).map_err(|e| zbus::fdo::Error::Failed(e.to_string()))
    }

    async fn get_firewall_status(&self) -> zbus::fdo::Result<String> {
        let status = self.get_firewall_status_impl().await;
        serde_json::to_string(&status).map_err(|e| zbus::fdo::Error::Failed(e.to_string()))
    }
}

async fn check_dm_crypt() -> Option<bool> {
    #[cfg(target_os = "linux")]
    {
        if let Ok(content) = tokio::fs::read_to_string("/proc/crypto").await {
            return Some(content.contains("xts") || content.contains("aes"));
        }
        None
    }
    #[cfg(not(target_os = "linux"))]
    {
        None
    }
}

async fn collect_process_list() -> Vec<ProcessInfo> {
    #[cfg(target_os = "linux")]
    {
        let mut list = Vec::new();
        if let Ok(mut entries) = tokio::fs::read_dir("/proc").await {
            while let Ok(Some(entry)) = entries.next_entry().await {
                let name = entry.file_name();
                let name_str = name.to_string_lossy();
                if let Ok(pid) = name_str.parse::<u32>() {
                    let comm_path = format!("/proc/{}/comm", pid);
                    let proc_name = tokio::fs::read_to_string(&comm_path)
                        .await
                        .unwrap_or_else(|_| "unknown".to_string())
                        .trim()
                        .to_string();

                    list.push(ProcessInfo {
                        pid,
                        name: proc_name,
                        state: "running".to_string(),
                        uid: 0,
                        memory_bytes: 0,
                    });
                }
            }
        }
        list
    }
    #[cfg(not(target_os = "linux"))]
    {
        Vec::new()
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")),
        )
        .init();

    info!("Starting nova-security service");

    let service = SecurityService;

    #[cfg(unix)]
    {
        let _conn = connection::Builder::session()?
            .name("org.nova.Security")?
            .serve_at("/org/nova/Security", service)?
            .build()
            .await?;

        info!("nova-security registered on session bus as org.nova.Security");

        use tokio::signal::unix::{signal, SignalKind};
        let mut sigterm = signal(SignalKind::terminate())?;
        let mut sigint = signal(SignalKind::interrupt())?;
        tokio::select! {
            _ = sigterm.recv() => { info!("Received SIGTERM, shutting down"); }
            _ = sigint.recv()  => { info!("Received SIGINT, shutting down"); }
        }
    }

    #[cfg(not(unix))]
    {
        info!("Running nova-security in standalone mode (non-Linux platform)");
        let status = service.get_security_status_impl().await;
        info!("Security posture: {:?}", status);
        tokio::signal::ctrl_c().await?;
        info!("Ctrl-C received, shutting down");
    }

    Ok(())
}
