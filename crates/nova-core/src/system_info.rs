// nova-core/src/system_info.rs — Cross-platform system information gathering

use anyhow::Result;
use nova_system_api::SystemInfo;

/// Gather system information. On Linux reads /proc; on other platforms returns mock data.
pub async fn gather_system_info() -> Result<SystemInfo> {
    #[cfg(target_os = "linux")]
    {
        gather_linux().await
    }
    #[cfg(not(target_os = "linux"))]
    {
        gather_mock().await
    }
}

#[cfg(target_os = "linux")]
async fn gather_linux() -> Result<SystemInfo> {
    use tokio::fs;

    // hostname
    let hostname = fs::read_to_string("/proc/sys/kernel/hostname")
        .await
        .unwrap_or_else(|_| "unknown".to_string())
        .trim()
        .to_string();

    // kernel version
    let kernel_version = fs::read_to_string("/proc/version")
        .await
        .unwrap_or_else(|_| String::new())
        .split_whitespace()
        .nth(2)
        .unwrap_or("unknown")
        .to_string();

    // os version from /etc/os-release
    let os_version = parse_os_release().await.unwrap_or_else(|| "NOVA OS".to_string());

    // uptime
    let uptime_seconds = parse_uptime().await.unwrap_or(0);

    // cpu model
    let cpu_model = parse_cpu_model().await.unwrap_or_else(|| "Unknown CPU".to_string());

    // total memory
    let total_memory_bytes = parse_total_memory().await.unwrap_or(0);

    Ok(SystemInfo {
        hostname,
        kernel_version,
        os_version,
        uptime_seconds,
        cpu_model,
        total_memory_bytes,
    })
}

#[cfg(target_os = "linux")]
async fn parse_os_release() -> Option<String> {
    let content = tokio::fs::read_to_string("/etc/os-release").await.ok()?;
    for line in content.lines() {
        if line.starts_with("PRETTY_NAME=") {
            return Some(
                line.trim_start_matches("PRETTY_NAME=")
                    .trim_matches('"')
                    .to_string(),
            );
        }
    }
    None
}

#[cfg(target_os = "linux")]
async fn parse_uptime() -> Option<u64> {
    let content = tokio::fs::read_to_string("/proc/uptime").await.ok()?;
    let secs: f64 = content.split_whitespace().next()?.parse().ok()?;
    Some(secs as u64)
}

#[cfg(target_os = "linux")]
async fn parse_cpu_model() -> Option<String> {
    let content = tokio::fs::read_to_string("/proc/cpuinfo").await.ok()?;
    for line in content.lines() {
        if line.starts_with("model name") {
            return Some(
                line.splitn(2, ':')
                    .nth(1)
                    .unwrap_or("Unknown")
                    .trim()
                    .to_string(),
            );
        }
    }
    None
}

#[cfg(target_os = "linux")]
pub async fn parse_total_memory() -> Option<u64> {
    let content = tokio::fs::read_to_string("/proc/meminfo").await.ok()?;
    for line in content.lines() {
        if line.starts_with("MemTotal:") {
            let kb: u64 = line
                .split_whitespace()
                .nth(1)?
                .parse()
                .ok()?;
            return Some(kb * 1024);
        }
    }
    None
}

#[cfg(not(target_os = "linux"))]
async fn gather_mock() -> Result<SystemInfo> {
    use sysinfo::System;
    let mut sys = System::new_all();
    sys.refresh_all();

    let hostname = System::host_name().unwrap_or_else(|| "unknown-host".to_string());
    let kernel_version = System::kernel_version().unwrap_or_else(|| "unknown-kernel".to_string());
    let os_version = System::os_version().unwrap_or_else(|| "NOVA Dev Environment".to_string());
    let uptime_seconds = System::uptime();
    let cpu_model = sys
        .cpus()
        .first()
        .map(|c| c.brand().to_string())
        .unwrap_or_else(|| "Generic CPU".to_string());
    let total_memory_bytes = sys.total_memory();

    Ok(SystemInfo {
        hostname,
        kernel_version,
        os_version,
        uptime_seconds,
        cpu_model,
        total_memory_bytes,
    })
}
