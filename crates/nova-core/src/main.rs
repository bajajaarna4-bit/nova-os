// nova-core/src/main.rs — NOVA OS Core D-Bus Service

use anyhow::Result;
use nova_core::{resource_monitor, system_info};
use nova_system_api::{ResourceUsage, ServiceState, ServiceStatus, SystemInfo};
use tracing::{error, info};
use tracing_subscriber::EnvFilter;
use zbus::{connection, interface};

struct CoreService;

#[interface(name = "org.nova.Core")]
impl CoreService {
    /// Return basic system information.
    async fn get_system_info(&self) -> zbus::fdo::Result<String> {
        match system_info::gather_system_info().await {
            Ok(info) => serde_json::to_string(&info)
                .map_err(|e| zbus::fdo::Error::Failed(e.to_string())),
            Err(e) => {
                error!("Failed to gather system info: {}", e);
                Err(zbus::fdo::Error::Failed(e.to_string()))
            }
        }
    }

    /// Return current resource usage.
    async fn get_resource_usage(&self) -> zbus::fdo::Result<String> {
        match resource_monitor::collect_resource_usage().await {
            Ok(usage) => serde_json::to_string(&usage)
                .map_err(|e| zbus::fdo::Error::Failed(e.to_string())),
            Err(e) => {
                error!("Failed to collect resource usage: {}", e);
                Err(zbus::fdo::Error::Failed(e.to_string()))
            }
        }
    }

    /// Return status for a named service (queries systemd via /proc).
    async fn get_service_status(&self, name: String) -> zbus::fdo::Result<String> {
        let status = query_service_status(&name).await;
        serde_json::to_string(&status).map_err(|e| zbus::fdo::Error::Failed(e.to_string()))
    }
}

/// Query service status. On Linux tries /proc/<pid>/comm for running processes.
async fn query_service_status(name: &str) -> ServiceStatus {
    #[cfg(target_os = "linux")]
    {
        query_service_linux(name).await
    }
    #[cfg(not(target_os = "linux"))]
    {
        ServiceStatus {
            name: name.to_string(),
            state: ServiceState::Unknown,
            pid: None,
            description: "Service status unavailable on this platform".to_string(),
        }
    }
}

#[cfg(target_os = "linux")]
async fn query_service_linux(name: &str) -> ServiceStatus {
    // Try to find a process matching the name in /proc
    if let Ok(mut entries) = tokio::fs::read_dir("/proc").await {
        while let Ok(Some(entry)) = entries.next_entry().await {
            let fname = entry.file_name();
            let fname_str = fname.to_string_lossy();
            if fname_str.chars().all(|c| c.is_ascii_digit()) {
                let comm_path = format!("/proc/{}/comm", fname_str);
                if let Ok(comm) = tokio::fs::read_to_string(&comm_path).await {
                    if comm.trim() == name {
                        let pid: u32 = fname_str.parse().unwrap_or(0);
                        return ServiceStatus {
                            name: name.to_string(),
                            state: ServiceState::Running,
                            pid: Some(pid),
                            description: format!("Process {} is running", name),
                        };
                    }
                }
            }
        }
    }
    ServiceStatus {
        name: name.to_string(),
        state: ServiceState::Stopped,
        pid: None,
        description: format!("No running process found for {}", name),
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")),
        )
        .init();

    info!("Starting nova-core D-Bus service");

    // Build connection and serve
    let _conn = connection::Builder::session()?
        .name("org.nova.Core")?
        .serve_at("/org/nova/Core", CoreService)?
        .build()
        .await?;

    info!("nova-core service registered on session bus as org.nova.Core");

    // Wait for SIGTERM / SIGINT
    #[cfg(unix)]
    {
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
        tokio::signal::ctrl_c().await?;
        info!("Received Ctrl-C, shutting down");
    }

    Ok(())
}
