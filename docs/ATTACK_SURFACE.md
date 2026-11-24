# NOVA OS — Attack Surface Inventory

> Version: 0.1-dev | Date: 2026-11-24  
> Subsystems: Core, Desktop Shell, Security, Permissions, Updater, AI Runtime

---

## 1. Attack Surface Overview

NOVA OS follows a **zero-trust, minimal-attack-surface** architecture. By default, no remote network services listen on non-loopback interfaces, system daemons run with dropped Linux capabilities under non-root service accounts, and IPC is strictly restricted via D-Bus access policies and PolicyKit.

```
┌────────────────────────────────────────────────────────┐
│                   Desktop Shell & Apps                 │
│         (Flatpak Sandboxes, Bubblewrap, Lit UI)        │
└──────────────────────────┬─────────────────────────────┘
                           │ Session Bus IPC
                           ▼
┌────────────────────────────────────────────────────────┐
│                     System Daemons                     │
│  org.nova.Core        org.nova.Permissions             │
│  org.nova.Security    org.nova.Updater                 │
│  org.nova.AIRuntime                                    │
└────────────┬─────────────┬─────────────┬───────────────┘
             │             │             │
             ▼             ▼             ▼
      Systemd Sandbox    SELinux     PolicyKit
      (strict/chroot)   (Type Enf)   (Default Deny)
             │             │             │
             └─────────────┼─────────────┘
                           ▼
                    Linux Kernel 6.x
```

---

## 2. Network Attack Surface

| Interface | Port / Protocol | Bound Address | Service | Exposed To | Security Controls |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **External Ethernet/Wi-Fi** | None | `0.0.0.0` | None | External Network | `nftables` default drop incoming; all ports closed |
| **Local Loopback** | `11434/TCP` (optional) | `127.0.0.1` | Ollama local model | Local user processes | Loopback-only binding; non-routable |
| **Outbound HTTPS** | `443/TCP` | Remote IP | AI Cloud / Update mirrors | Outbound only | TLS 1.3 enforced, system CA store, payload SHA-256 verification |
| **Local IPC Sockets** | AF_UNIX | `/run/dbus/system_bus_socket` | D-Bus System Bus | Local services | POSIX permissions (`0666`), authentication handshake, SELinux socket transition |

---

## 3. D-Bus IPC Attack Surface

All inter-process communication between desktop applications and system services occurs across the D-Bus system bus. Each service registers a well-known bus name protected by D-Bus configuration policies and PolicyKit rules.

### 3.1 `org.nova.Core`
- **Bus Path**: `/org/nova/Core`
- **Interface**: `org.nova.Core`
- **Methods**:
  - `GetSystemInfo() -> (s)`: Returns hardware model, kernel version, hostname, architecture. Read-only, unprivileged.
  - `GetSystemHealth() -> (s)`: Returns CPU, memory, storage utilization metrics. Read-only, unprivileged.
  - `RebootSystem()`: Triggers system reboot. Requires `org.nova.core.power-management` Polkit authorization.
  - `PowerOffSystem()`: Triggers system shutdown. Requires `org.nova.core.power-management` Polkit authorization.

### 3.2 `org.nova.Permissions`
- **Bus Path**: `/org/nova/Permissions`
- **Interface**: `org.nova.Permissions`
- **Methods**:
  - `CheckPermission(app_id: s, permission: s) -> (b)`: Checks if an application has been granted a specific device capability. Read-only, fast-path.
  - `RequestPermission(app_id: s, permission: s) -> (b)`: Prompts the user via desktop notification and Polkit consent dialog. Requires `org.nova.permissions.grant`.
  - `RevokePermission(app_id: s, permission: s) -> (b)`: Revokes previously granted permission and persists to state store. Requires `org.nova.permissions.revoke`.
  - `ListAppPermissions(app_id: s) -> (as)`: Returns list of granted capabilities for an application.

### 3.3 `org.nova.Security`
- **Bus Path**: `/org/nova/Security`
- **Interface**: `org.nova.Security`
- **Methods**:
  - `GetSecurityStatus() -> (s)`: Returns current status of Secure Boot, SELinux mode, LUKS disk encryption, and firewall. Read-only, honest system inspection.
  - `ListRunningProcesses() -> (as)`: Returns list of running processes with PIDs and resource consumption.
  - `SetSELinuxEnforcement(enforce: b) -> (b)`: Toggles SELinux enforcement mode. Strictly requires `org.nova.security.enforce-selinux` (admin authentication).
  - `SetFirewallState(active: b) -> (b)`: Enables or disables firewall packet filtering. Strictly requires `org.nova.security.modify-firewall` (admin authentication).

### 3.4 `org.nova.Updater`
- **Bus Path**: `/org/nova/Updater`
- **Interface**: `org.nova.Updater`
- **Methods**:
  - `CheckForUpdates() -> (s)`: Queries update registry for newer signed bootc/OSTree image tags. Read-only.
  - `DeployUpdate(target_version: s, digest: s, signature: s) -> (b)`: Validates update manifest against downgrade attacks and applies atomic deployment. Requires `org.nova.updater.apply-update`.
  - `GetUpdateHistory() -> (as)`: Returns historical record of applied atomic updates.

### 3.5 `org.nova.AIRuntime`
- **Bus Path**: `/org/nova/AIRuntime`
- **Interface**: `org.nova.AIRuntime`
- **Methods**:
  - `Query(prompt: s) -> (s)`: Sends query to configured AI provider (local or cloud) with streaming responses.
  - `ExecuteTool(tool_name: s, params: s) -> (s)`: Executes allowlisted system tool. If the tool is consequential (file deletion, system modification), requires `org.nova.ai.execute-consequential-tool` Polkit consent.

---

## 4. Filesystem & State Storage Attack Surface

| Path | Owner / Group | Permissions | SELinux Type | Content & Threat Vectors |
| :--- | :--- | :--- | :--- | :--- |
| `/usr` | `root:root` | `0755` (read-only) | `usr_t` | OS binaries and libraries. Protected by `dm-verity` and OSTree immutability. |
| `/etc/nova` | `root:nova-system` | `0644` | `etc_t` | Static OS configuration. Modifications require root privileges. |
| `/var/lib/nova/permissions` | `nova-system:nova-system` | `0700` | `nova_var_lib_t` | Application permission state store. Restricted strictly to `nova_permissions_t`. |
| `/var/log/nova/audit.log` | `nova-system:nova-system` | `0640` | `nova_audit_log_t` | Append-only cryptographically hash-chained audit logs. Tamper-evident. |
| `/var/lib/nova/models` | `nova-ai:nova-ai` | `0750` | `nova_var_lib_t` | Local AI GGUF/Safetensors model weights. Read-only for inference. |
| `/run/nova` | `nova-system:nova-system` | `0755` | `var_run_t` | Ephemeral runtime state and Unix domain sockets. |

---

## 5. Privilege & Authorization Boundaries

### 5.1 PolicyKit Action Controls
Every consequential operation triggers a PolicyKit authorization check before execution. Default rules:
- `org.nova.updater.apply-update`: `allow_any = auth_admin`, `allow_active = auth_admin_keep`
- `org.nova.security.enforce-selinux`: `allow_any = no`, `allow_active = auth_admin`
- `org.nova.security.modify-firewall`: `allow_any = no`, `allow_active = auth_admin`
- `org.nova.permissions.grant`: `allow_any = no`, `allow_active = auth_self`
- `org.nova.permissions.revoke`: `allow_any = no`, `allow_active = auth_self`
- `org.nova.ai.execute-consequential-tool`: `allow_any = no`, `allow_active = auth_self`
- `org.nova.core.power-management`: `allow_any = auth_admin`, `allow_active = yes`

### 5.2 Systemd Sandboxing Directives
Every daemon unit applies:
- `NoNewPrivileges=true`
- `ProtectSystem=strict`
- `ProtectHome=true` (or `read-only` for `nova-core`)
- `PrivateTmp=true`
- `ProtectHostname=true`
- `LockPersonality=true`
- `RestrictRealtime=true`
- `RestrictSUIDSGID=true`
- `MemoryDenyWriteExecute=true`

---

## 6. AI Operating Layer Attack Surface

1. **Prompt Injection**: Untrusted inputs (web text, user documents) could attempt prompt injection to issue instructions to the AI assistant.
   - *Mitigation*: The assistant cannot execute arbitrary shell commands. It can only call an allowlisted tool registry.
2. **Tool Argument Smuggling**: Malicious queries attempting to pass path traversal (`../../etc/shadow`) or malicious arguments into safe tools.
   - *Mitigation*: Tool registry strictly parses, validates, and normalizes paths, rejecting paths outside the allowed sandbox.
3. **Consequential Operation Gating**: High-impact actions (deleting files, creating cron tasks, changing network configuration) require an interactive modal with full action previews and PolicyKit authorization.
