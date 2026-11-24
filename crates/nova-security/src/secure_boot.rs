// nova-security/src/secure_boot.rs — Secure Boot status reader

/// Check if Secure Boot is enabled by reading EFI variables.
/// Returns None if the information is unavailable.
pub async fn read_secure_boot_status() -> Option<bool> {
    #[cfg(target_os = "linux")]
    {
        read_linux_secure_boot().await
    }
    #[cfg(not(target_os = "linux"))]
    {
        None
    }
}

#[cfg(target_os = "linux")]
async fn read_linux_secure_boot() -> Option<bool> {
    // EFI variable path: /sys/firmware/efi/vars/SecureBoot-*/data
    // or /sys/firmware/efi/efivars/SecureBoot-8be4df61-93ca-11d2-aa0d-00e098032b8c
    let efi_var_path =
        "/sys/firmware/efi/efivars/SecureBoot-8be4df61-93ca-11d2-aa0d-00e098032b8c";

    match tokio::fs::read(efi_var_path).await {
        Ok(data) => {
            // EFI variable format: 4-byte attributes + 1-byte value
            // Value at index 4: 1 = enabled, 0 = disabled
            if data.len() >= 5 {
                Some(data[4] == 1)
            } else {
                None
            }
        }
        Err(_) => {
            // Try alternate path
            let alt_path = "/sys/firmware/efi/vars/SecureBoot-8be4df61-93ca-11d2-aa0d-00e098032b8c/data";
            match tokio::fs::read(alt_path).await {
                Ok(data) => data.first().map(|&b| b == 1),
                Err(_) => None,
            }
        }
    }
}
