// nova-security/src/main.rs — NOVA OS Security Monitoring D-Bus Service

mod firewall;
mod secure_boot;
mod selinux;

use anyhow::Result;
use nova_system_api::{FirewallStatus, ProcessInfo, SecurityStatus};
use tracing::{error, info};
use tracing_subscriber::EnvFilter;
use zbus::{connection, interface};

struct SecurityService;

#[interface(name = "org.nova.Security")]
impl SecurityService {
    /// Return comprehensive security status.
    async fn get_security_status(&self) -> zbus::fdo::Result<String> {
        let secure_boot_enabled = secure_boot::read_secure_boot_status().await;
        let selinux_mode = selinux::read_selinux_mode().await;
        let firewall_status = firewall::read_firewall_status().await;
        let dm_crypt_active = check_dm_crypt().await;

        let status = SecurityStatus {
            secure_boot_enabled,
            selinux_mode,
            dm_crypt_active,
            firewall_active: Some(firewall_status.active),
        };

        serde_json::to_string(&status).map_err(|e| zbus::fdo::Error::Failed(e.to_string()))
    }

    /// Return process list from /proc.
    async fn get_process_list(&self) -> zbus::fdo::Result<String> {
        let processes = collect_process_list().await;
        serde_json::to_string(&processes).map_err(|e| zbus::fdo::Error::Failed(e.to_string()))
    }

    /// Return firewall status.
    async fn get_firewall_status(&self) -> zbus::fdo::Result<String> {
        let status = firewall::read_firewall_status().await;
        serde_json::to_string(&status).map_err(|e| zbus::fdo::Error::Failed(e.to_string()))
    }
}

/// Check if dm-crypt (LUKS) is active by reading /proc/crypto or /sys/block/*/dm.
async fn check_dm_crypt() -> Option<bool> {
    #[cfg(target_os = "linux")]
    {
        // Look for dm-crypt in /proc/crypto
        match tokio::fs::read_to_string("/proc/crypto").await {
            Ok(content) => Some(content.contains("cbc(aes)") || content.contains("xts(aes)")),
            Err(_) => None,
        }
    }
    #[cfg(not(target_os = "linux"))]
    {
        None
    }
}

/// Read process list from /proc on Linux.
async fn collect_process_list() -> Vec<ProcessInfo> {
    #[cfg(target_os = "linux")]
    {
        let mut processes = Vec::new();
        let Ok(mut entries) = tokio::fs::read_dir("/proc").await else {
            return processes;
        };

        while let Ok(Some(entry)) = entries.next_entry().await {
            let fname = entry.file_name();
            let fname_str = fname.to_string_lossy();

            if !fname_str.chars().all(|c| c.is_ascii_digit()) {
                continue;
            }

            let pid: u32 = match fname_str.parse() {
                Ok(p) => p,
                Err(_) => continue,
            };

            let name = tokio::fs::read_to_string(format!("/proc/{}/comm", pid))
                .await
                .unwrap_or_else(|_| "unknown".to_string())
                .trim()
                .to_string();

            let status_content = tokio::fs::read_to_string(format!("/proc/{}/status", pid))
                .await
                .unwrap_or_default();

            let mut state = "unknown".to_string();
            let mut uid = 0u32;
            let mut memory_bytes = 0u64;

            for line in status_content.lines() {
                if line.starts_with("State:") {
                    state = line
                        .splitn(2, ':')
                        .nth(1)
                        .unwrap_or("unknown")
                        .trim()
                        .to_string();
                } else if line.starts_with("Uid:") {
                    uid = line
                        .split_whitespace()
                        .nth(1)
                        .and_then(|s| s.parse().ok())
                        .unwrap_or(0);
                } else if line.starts_with("VmRSS:") {
                    memory_bytes = line
                        .split_whitespace()
                        .nth(1)
                        .and_then(|s| s.parse::<u64>().ok())
                        .unwrap_or(0)
                        * 1024;
                }
            }

            processes.push(ProcessInfo {
                pid,
                name,
                state,
                uid,
                memory_bytes,
            });
        }
        processes
    }
    #[cfg(not(target_os = "linux"))]
    {
        vec![]
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")),
        )
        .init();

    info!("Starting nova-security D-Bus service");

    let _conn = connection::Builder::session()?
        .name("org.nova.Security")?
        .serve_at("/org/nova/Security", SecurityService)?
        .build()
        .await?;

    info!("nova-security registered as org.nova.Security");

    #[cfg(unix)]
    {
        use tokio::signal::unix::{signal, SignalKind};
        let mut sigterm = tokio::signal::unix::signal(SignalKind::terminate())?;
        let mut sigint = tokio::signal::unix::signal(SignalKind::interrupt())?;
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
