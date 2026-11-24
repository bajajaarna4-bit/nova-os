// nova-core/src/resource_monitor.rs — CPU/memory monitoring

use anyhow::Result;
use nova_system_api::ResourceUsage;

/// Collect current resource usage. Linux reads /proc; other platforms return mock data.
pub async fn collect_resource_usage() -> Result<ResourceUsage> {
    #[cfg(target_os = "linux")]
    {
        collect_linux().await
    }
    #[cfg(not(target_os = "linux"))]
    {
        collect_mock().await
    }
}

#[cfg(target_os = "linux")]
async fn collect_linux() -> Result<ResourceUsage> {
    let (memory_used_bytes, memory_total_bytes) = parse_meminfo().await.unwrap_or((0, 0));
    let load_average_1m = parse_loadavg().await.unwrap_or(0.0);
    let cpu_percent = estimate_cpu_percent().await.unwrap_or(0.0);

    Ok(ResourceUsage {
        cpu_percent,
        memory_used_bytes,
        memory_total_bytes,
        load_average_1m,
    })
}

#[cfg(target_os = "linux")]
async fn parse_meminfo() -> Option<(u64, u64)> {
    let content = tokio::fs::read_to_string("/proc/meminfo").await.ok()?;
    let mut total_kb: Option<u64> = None;
    let mut available_kb: Option<u64> = None;

    for line in content.lines() {
        if line.starts_with("MemTotal:") {
            total_kb = line.split_whitespace().nth(1)?.parse().ok();
        } else if line.starts_with("MemAvailable:") {
            available_kb = line.split_whitespace().nth(1)?.parse().ok();
        }
        if total_kb.is_some() && available_kb.is_some() {
            break;
        }
    }

    let total = total_kb? * 1024;
    let available = available_kb? * 1024;
    let used = total.saturating_sub(available);
    Some((used, total))
}

#[cfg(target_os = "linux")]
async fn parse_loadavg() -> Option<f64> {
    let content = tokio::fs::read_to_string("/proc/loadavg").await.ok()?;
    content.split_whitespace().next()?.parse().ok()
}

/// Estimate CPU% by sampling /proc/stat twice with a short delay.
#[cfg(target_os = "linux")]
async fn estimate_cpu_percent() -> Option<f64> {
    fn read_stat_values(line: &str) -> Option<(u64, u64)> {
        // cpu  user nice system idle iowait irq softirq steal guest guest_nice
        let parts: Vec<u64> = line
            .split_whitespace()
            .skip(1)
            .filter_map(|s| s.parse().ok())
            .collect();
        if parts.len() < 4 {
            return None;
        }
        let idle = parts[3];
        let total: u64 = parts.iter().sum();
        Some((idle, total))
    }

    let read_first = || async {
        let content = tokio::fs::read_to_string("/proc/stat").await.ok()?;
        let first_line = content.lines().next()?;
        read_stat_values(first_line)
    };

    let (idle1, total1) = read_first().await?;
    tokio::time::sleep(std::time::Duration::from_millis(100)).await;
    let (idle2, total2) = read_first().await?;

    let d_total = total2.saturating_sub(total1) as f64;
    let d_idle = idle2.saturating_sub(idle1) as f64;

    if d_total == 0.0 {
        return Some(0.0);
    }

    Some(100.0 * (1.0 - d_idle / d_total))
}

#[cfg(not(target_os = "linux"))]
async fn collect_mock() -> Result<ResourceUsage> {
    Ok(ResourceUsage {
        cpu_percent: 12.5,
        memory_used_bytes: 2 * 1024 * 1024 * 1024,
        memory_total_bytes: 8 * 1024 * 1024 * 1024,
        load_average_1m: 0.75,
    })
}
