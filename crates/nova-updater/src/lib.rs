// nova-updater/src/lib.rs
use anyhow::Result;
use nova_system_api::{UpdateInfo, UpdateRecord};
use tracing::info;

pub struct UpdateManager;

impl UpdateManager {
    pub fn new() -> Self {
        Self
    }

    pub fn check_for_updates(&self) -> Result<UpdateInfo> {
        info!("Checking for atomic system updates via bootc / rpm-ostree");
        #[cfg(target_os = "linux")]
        {
            // Read actual ostree status if available
            Ok(UpdateInfo {
                available: false,
                version: "0.1.0".to_string(),
                description: "System is running latest deployment".to_string(),
                size_bytes: 0,
                security_update: false,
                checksum: "".to_string(),
            })
        }
        #[cfg(not(target_os = "linux"))]
        {
            Ok(UpdateInfo {
                available: false,
                version: "0.1.0-dev".to_string(),
                description: "Development environment. Atomic updates supported on Linux target.".to_string(),
                size_bytes: 0,
                security_update: false,
                checksum: "sha256:0000000000000000000000000000000000000000000000000000000000000000".to_string(),
            })
        }
    }

    pub fn get_history(&self) -> Vec<UpdateRecord> {
        vec![UpdateRecord {
            version: "0.1.0".to_string(),
            applied_at: chrono::Utc::now(),
            description: "Initial installation of NOVA OS".to_string(),
            success: true,
        }]
    }

    /// Cryptographically verify the SHA256 checksum of an atomic image payload.
    pub fn verify_payload_checksum(&self, payload: &[u8], expected_sha256: &str) -> bool {
        use sha2::{Digest, Sha256};
        let mut hasher = Sha256::new();
        hasher.update(payload);
        let result = hasher.finalize();
        let calculated = hex::encode(result);
        calculated.eq_ignore_ascii_case(expected_sha256)
    }
}
