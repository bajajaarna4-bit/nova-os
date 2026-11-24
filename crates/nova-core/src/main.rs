// nova-core/src/main.rs — NOVA OS Core Service

use anyhow::Result;
use nova_core::{resource_monitor, system_info};
use nova_system_api::{ResourceUsage, ServiceState, ServiceStatus, SystemInfo};
use tracing::{error, info};
use tracing_subscriber::EnvFilter;

#[cfg(unix)]
use zbus::{connection, interface};

struct CoreService;

impl CoreService {
    pub async fn get_system_info_impl(&self) -> Result<SystemInfo> {
        system_info::gather_system_info().await
    }

    pub async fn get_resource_usage_impl(&self) -> Result<ResourceUsage> {
        resource_monitor::collect_resource_usage().await
    }

    pub async fn get_service_status_impl(&self, name: &str) -> ServiceStatus {
        query_service_status(name).await
    }
}

#[cfg(unix)]
#[interface(name = "org.nova.Core")]
impl CoreService {
    async fn get_system_info(&self) -> zbus::fdo::Result<String> {
        match self.get_system_info_impl().await {
            Ok(info) => serde_json::to_string(&info)
                .map_err(|e| zbus::fdo::Error::Failed(e.to_string())),
            Err(e) => {
                error!("Failed to gather system info: {}", e);
                Err(zbus::fdo::Error::Failed(e.to_string()))
            }
        }
    }

    async fn get_resource_usage(&self) -> zbus::fdo::Result<String> {
        match self.get_resource_usage_impl().await {
            Ok(usage) => serde_json::to_string(&usage)
                .map_err(|e| zbus::fdo::Error::Failed(e.to_string())),
            Err(e) => {
                error!("Failed to collect resource usage: {}", e);
                Err(zbus::fdo::Error::Failed(e.to_string()))
            }
        }
    }

    async fn get_service_status(&self, name: String) -> zbus::fdo::Result<String> {
        let status = self.get_service_status_impl(&name).await;
        serde_json::to_string(&status).map_err(|e| zbus::fdo::Error::Failed(e.to_string()))
    }
}

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
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")),
        )
        .init();

    info!("Starting nova-core service");

    let service = CoreService;

    #[cfg(unix)]
    {
        let _conn = connection::Builder::session()?
            .name("org.nova.Core")?
            .serve_at("/org/nova/Core", service)?
            .build()
            .await?;

        info!("nova-core registered on session bus as org.nova.Core");

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
        info!("Running nova-core in standalone mode (non-Linux platform)");
        let info = service.get_system_info_impl().await?;
        info!("System info gathered: {:?}", info);
        tokio::signal::ctrl_c().await?;
        info!("Received Ctrl-C, shutting down");
    }

    Ok(())
}
