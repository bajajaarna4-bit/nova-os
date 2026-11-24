// nova-security/src/firewall.rs — Firewall status reader (nftables/iptables)

use nova_system_api::FirewallStatus;
use tokio::process::Command;

/// Query firewall status via nftables or iptables.
pub async fn read_firewall_status() -> FirewallStatus {
    #[cfg(target_os = "linux")]
    {
        read_linux_firewall().await
    }
    #[cfg(not(target_os = "linux"))]
    {
        FirewallStatus {
            active: false,
            backend: "unavailable".to_string(),
            rules_count: 0,
            default_policy: "unknown".to_string(),
        }
    }
}

#[cfg(target_os = "linux")]
async fn read_linux_firewall() -> FirewallStatus {
    // Try nftables first
    if let Ok(output) = Command::new("nft").args(["-j", "list", "ruleset"]).output().await {
        if output.status.success() {
            let rules_count = count_nft_rules(&output.stdout);
            return FirewallStatus {
                active: rules_count > 0,
                backend: "nftables".to_string(),
                rules_count,
                default_policy: "drop".to_string(),
            };
        }
    }

    // Fall back to iptables
    if let Ok(output) = Command::new("iptables").args(["-L", "-n"]).output().await {
        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let rules_count = stdout.lines().filter(|l| !l.starts_with("Chain") && !l.starts_with("target") && !l.is_empty()).count();
            return FirewallStatus {
                active: true,
                backend: "iptables".to_string(),
                rules_count,
                default_policy: extract_iptables_policy(&stdout).to_string(),
            };
        }
    }

    // No firewall detected
    FirewallStatus {
        active: false,
        backend: "none".to_string(),
        rules_count: 0,
        default_policy: "unknown".to_string(),
    }
}

#[cfg(target_os = "linux")]
fn count_nft_rules(json_bytes: &[u8]) -> usize {
    if let Ok(v) = serde_json::from_slice::<serde_json::Value>(json_bytes) {
        if let Some(arr) = v["nftables"].as_array() {
            return arr.iter().filter(|e| e.get("rule").is_some()).count();
        }
    }
    0
}

#[cfg(target_os = "linux")]
fn extract_iptables_policy(output: &str) -> &str {
    for line in output.lines() {
        if line.starts_with("Chain INPUT") {
            if line.contains("DROP") {
                return "drop";
            } else if line.contains("ACCEPT") {
                return "accept";
            }
        }
    }
    "unknown"
}
