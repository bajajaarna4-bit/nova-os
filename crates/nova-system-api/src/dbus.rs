// nova-system-api/src/dbus.rs — D-Bus interface trait definitions

/// D-Bus well-known names
pub const DBUS_NAME_CORE: &str = "org.nova.Core";
pub const DBUS_PATH_CORE: &str = "/org/nova/Core";

pub const DBUS_NAME_SECURITY: &str = "org.nova.Security";
pub const DBUS_PATH_SECURITY: &str = "/org/nova/Security";

pub const DBUS_NAME_PERMISSIONS: &str = "org.nova.Permissions";
pub const DBUS_PATH_PERMISSIONS: &str = "/org/nova/Permissions";

pub const DBUS_NAME_AI_RUNTIME: &str = "org.nova.AIRuntime";
pub const DBUS_PATH_AI_RUNTIME: &str = "/org/nova/AIRuntime";

pub const DBUS_NAME_UPDATER: &str = "org.nova.Updater";
pub const DBUS_PATH_UPDATER: &str = "/org/nova/Updater";
