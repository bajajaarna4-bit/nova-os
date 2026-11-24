// nova-core/src/lib.rs — Library exports
pub mod config;
pub mod resource_monitor;
pub mod system_info;

pub use config::NovaConfig;
pub use nova_system_api::{ResourceUsage, ServiceState, ServiceStatus, SystemInfo};
