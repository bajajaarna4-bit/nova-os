// nova-security/src/selinux.rs — SELinux status reader

use nova_system_api::SeLinuxMode;

/// Read SELinux enforcement mode from /sys/fs/selinux/enforce.
/// Returns None if SELinux is not available on this system.
pub async fn read_selinux_mode() -> SeLinuxMode {
    #[cfg(target_os = "linux")]
    {
        // Check if SELinux filesystem is mounted
        match tokio::fs::read_to_string("/sys/fs/selinux/enforce").await {
            Ok(content) => match content.trim() {
                "1" => SeLinuxMode::Enforcing,
                "0" => SeLinuxMode::Permissive,
                _ => SeLinuxMode::Unknown,
            },
            Err(_) => {
                // Try /selinux/enforce for older kernels
                match tokio::fs::read_to_string("/selinux/enforce").await {
                    Ok(content) => match content.trim() {
                        "1" => SeLinuxMode::Enforcing,
                        "0" => SeLinuxMode::Permissive,
                        _ => SeLinuxMode::Unknown,
                    },
                    Err(_) => SeLinuxMode::Disabled,
                }
            }
        }
    }
    #[cfg(not(target_os = "linux"))]
    {
        SeLinuxMode::Unknown
    }
}
