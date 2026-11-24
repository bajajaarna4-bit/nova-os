# NOVA OS — Permission & Sandboxing Matrix

> Version: 0.1-dev | Date: 2026-11-24  
> Subsystems: Permissions, Desktop Shell, Security, Isolation

---

## 1. Application Isolation Tiers

NOVA OS groups applications into four distinct isolation tiers based on trust level, origin, and required system capabilities:

```
┌─────────────────────────────────────────────────────────────┐
│ Tier 0: Core OS Services (System daemons, minimal privs)    │
├─────────────────────────────────────────────────────────────┤
│ Tier 1: System Shell & Native Utilities (Lit Shell, D-Bus)   │
├─────────────────────────────────────────────────────────────┤
│ Tier 2: Sandboxed Flatpak Applications (Isolated namespaces)│
├─────────────────────────────────────────────────────────────┤
│ Tier 3: Untrusted Scripts & Ad-hoc Tools (Ephemeral bwrap)  │
└─────────────────────────────────────────────────────────────┘
```

- **Tier 0 (Core OS Services)**: `nova-core`, `nova-security`, `nova-updater`, `nova-permissions`, `nova-ai-runtime`. Isolated via systemd strict sandboxing, dedicated service users, and SELinux domains.
- **Tier 1 (Desktop Shell & Native Utilities)**: The desktop shell UI, Settings, Security Center, and Privacy Center. Communicates with Tier 0 over D-Bus via authenticated interfaces.
- **Tier 2 (Sandboxed Applications)**: Flatpak packages. Run in Bubblewrap namespaces with seccomp filtering, restricted D-Bus access, and dynamic portal capabilities.
- **Tier 3 (Ephemeral Sandboxes)**: User scripts, untrusted code snippets, and ephemeral testing containers. Spawned with zero network and read-only root filesystems.

---

## 2. Comprehensive Permission Matrix

| Application / Component | Tier | Camera | Mic | Network | File System Access | Device Nodes | D-Bus Access | Polkit Action Required |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **nova-core** | Tier 0 | ❌ No | ❌ No | Loopback / HTTP health | Read `/var/lib/nova`, Read `/var/log/nova` | No raw disks | Owns `org.nova.Core` | `org.nova.core.power-management` |
| **nova-permissions** | Tier 0 | ❌ No | ❌ No | ❌ No | Read/Write `/var/lib/nova/permissions` | None | Owns `org.nova.Permissions` | `org.nova.permissions.grant`, `org.nova.permissions.revoke` |
| **nova-security** | Tier 0 | ❌ No | ❌ No | ❌ No | Read `/proc`, Read `/sys` (BindReadOnly) | Netlink audit socket (`CAP_AUDIT_READ`) | Owns `org.nova.Security` | `org.nova.security.enforce-selinux`, `org.nova.security.modify-firewall` |
| **nova-updater** | Tier 0 | ❌ No | ❌ No | Outbound HTTPS | `/ostree/deploy`, `/run/nova` | Loop devices | Owns `org.nova.Updater` | `org.nova.updater.apply-update` |
| **nova-ai-runtime** | Tier 0 | ❌ No | ❌ No | Outbound HTTPS / Loopback | `/var/lib/nova/models`, `/var/cache/nova/ai` | `/dev/dri` (GPU inference) | Owns `org.nova.AIRuntime` | `org.nova.ai.execute-consequential-tool` |
| **NOVA Desktop Shell** | Tier 1 | ❌ No | ❌ No | Loopback (local proxy) | User preferences (`~/.config/nova`) | None | Calls `org.nova.*` | User authorization prompts |
| **NOVA File Manager** | Tier 1 | ❌ No | ❌ No | ❌ No | User home (`~/*`) via xdg-desktop-portal | Storage mounts | Accesses file portals | None (user-owned files) |
| **Web Browser (e.g., Firefox)** | Tier 2 | Prompt | Prompt | Outbound WAN | Downloads folder only; portals for other dirs | `/dev/dri`, `/dev/snd` | `org.freedesktop.portal.*` | User consent modal |
| **Video Conferencing App** | Tier 2 | Prompt | Prompt | Outbound WAN | Private app sandbox only | `/dev/video*`, `/dev/snd` | `org.freedesktop.portal.Camera` | User consent modal |
| **Text Editor / IDE** | Tier 2 | ❌ No | ❌ No | Optional | Project directories via file chooser portal | None | `org.freedesktop.portal.FileChooser` | User consent modal |
| **Terminal / CLI** | Tier 1 | ❌ No | ❌ No | As configured | User home | PTY allocation | Full user session bus | Polkit for `sudo`/`pkexec` |
| **Untrusted Code Sandbox** | Tier 3 | ❌ No | ❌ No | ❌ Denied | Ephemeral `/tmp` only | None | None | Admin override only |

---

## 3. Sandboxing & Containment Architecture

### 3.1 Bubblewrap Isolation Parameters
For all Tier 2 sandboxed applications, Bubblewrap (`bwrap`) is configured with the following baseline flags:

```bash
bwrap \
  --unshare-all \
  --ro-bind /usr /usr \
  --ro-bind /lib /lib \
  --ro-bind /lib64 /lib64 \
  --ro-bind /etc/ld.so.cache /etc/ld.so.cache \
  --ro-bind /etc/resolv.conf /etc/resolv.conf \
  --tmpfs /tmp \
  --tmpfs /var/tmp \
  --proc /proc \
  --dev /dev \
  --dir /run/user/${UID} \
  --ro-bind /run/user/${UID}/wayland-0 /run/user/${UID}/wayland-0 \
  --ro-bind /run/user/${UID}/bus /run/user/${UID}/bus \
  --bind ~/.var/app/${APP_ID} ~/.var/app/${APP_ID} \
  --new-session \
  --die-with-parent \
  --seccomp 9
```

- When `network` permission is **not** granted, `--unshare-net` is appended, isolating the container in an empty network namespace with only a disconnected `lo`.
- When `camera` permission is **not** granted, access to `/dev/video*` is mapped to `/dev/null` or filtered via the PipeWire portal.

### 3.2 Seccomp Syscall Filtering
All sandboxed processes operate under a strict seccomp-bpf filter that blocks:
- Dangerous kernel modifications: `reboot`, `kexec_load`, `init_module`, `delete_module`.
- Ptrace and debugging across sandbox boundaries: `ptrace`, `process_vm_readv`, `process_vm_writev`.
- Namespace tampering: `unshare`, `setns` (nested container escape prevention).
- Dangerous filesystem operations: `mount`, `umount2`, `pivot_root`.

---

## 4. Permission Lifecycle & Revocation

1. **Initial Access**:
   When an application requests a sensitive capability (e.g., Camera or Microphone) that has not been previously allowed, `nova-permissions` triggers a PolicyKit consent dialog through the desktop shell.
2. **Persistence**:
   Granted permissions are stored in `/var/lib/nova/permissions/permissions.json` using atomic rename writes. The file is owned by `nova-system:nova-system` (`0600`) and protected by SELinux type `nova_var_lib_t`.
3. **Revocation**:
   When a user clicks "Revoke" in the Privacy Center or Settings:
   - `nova-permissions` immediately updates its in-memory table.
   - A `PermissionRevoked(app_id, permission)` D-Bus signal is broadcast across `org.nova.Permissions`.
   - The device stream (e.g. PipeWire node or camera capture session) is immediately severed by the portal daemon.
   - The persistent state file is flushed atomically to disk.
