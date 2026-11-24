// nova-core/src/lib.rs — Library exports
pub mod resource_monitor;
pub mod system_info;

pub use nova_system_api::{ResourceUsage, ServiceState, ServiceStatus, SystemInfo};
