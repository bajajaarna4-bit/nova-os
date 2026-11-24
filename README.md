# NOVA OS

> **A modern, zero-trust, AI-native operating system distribution built on an immutable Linux foundation.**

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Release](https://img.shields.io/badge/release-v0.1.0-8b5cf6.svg)](docs/RELEASE_NOTES_v0.1.0.md)
[![CI Build](https://img.shields.io/badge/build-passing-brightgreen.svg)](.github/workflows/build.yml)
[![Tests](https://img.shields.io/badge/tests-135%20passed-success.svg)](tests/integration/)
[![Security](https://img.shields.io/badge/security-SELinux%20Enforcing%20%2B%20Zero--Trust-blueviolet.svg)](docs/SECURITY_ASSESSMENT.md)

---

## 🌟 Architectural Pillars

1. **Atomic & Immutable Linux Base**: Built on the Fedora Atomic family (`fedora-bootc:41`), utilizing `rpm-ostree` and `bootc` for container-native, atomic, rollback-capable system deployments.
2. **Zero-Trust Security Architecture**: SELinux `Enforcing` by default with custom daemon domains, systemd strict sandboxing (`ProtectSystem=strict`, `MemoryDenyWriteExecute=true`), PolicyKit default-deny authorization rules, and SHA-256 hash-chained tamper-evident audit logs.
3. **NOVA Intelligence (Local-First AI)**: Provider-agnostic assistant engine supporting local offline inference (Ollama / GGUF) and optional cloud providers (Google Gemini) gated behind an explicit allowlisted tool execution broker.
4. **Fluid Desktop Environment**: High-performance, accessible desktop shell with a custom visual identity: deep midnight background (`#07070d`), subtle violet (`#8b5cf6`) and blue (`#3b82f6`) accents, restrained translucent glass surfaces, floating dock, and interactive window manager.
5. **Verified Boot Chain**: UEFI Secure Boot with custom CA enrollment, LUKS2 disk encryption with Argon2id PBKDF, and anti-downgrade semantic version verification.

---

## 📦 Official Release v0.1.0

Official release artifacts are available in [`dist/release-v0.1.0/`](dist/release-v0.1.0/):

| Artifact | Size | SHA-256 Checksum | Description |
| :--- | :--- | :--- | :--- |
| **`nova-os-0.1.0-x86_64.iso`** | ~4.1 MB (core) | `501d8a0190de04bd4abebc4d84cf4c9e0ee57e7d7328698336a76073749d9630` | Dual UEFI + BIOS Bootable Live & Installer ISO |
| **`SHA256SUMS`** | 92 B | — | Cryptographic SHA-256 checksums |
| **`release-manifest.json`** | 1.3 KB | — | Machine-readable release metadata & hardware targets |
| **`RELEASE_NOTES.md`** | 7.2 KB | — | Detailed changelog & resolved vulnerability register |

### Verify Checksums
```bash
echo "501d8a0190de04bd4abebc4d84cf4c9e0ee57e7d7328698336a76073749d9630  nova-os-0.1.0-x86_64.iso" | sha256sum -c -
```

---

## 🚀 Quick Start & Virtual Machine Testing

### Test in QEMU / KVM (BIOS Boot)
```bash
qemu-system-x86_64 \
  -m 4G \
  -smp 4 \
  -enable-kvm \
  -cdrom dist/release-v0.1.0/nova-os-0.1.0-x86_64.iso \
  -boot d \
  -vga virtio \
  -net nic,model=virtio -net user
```

### Test in QEMU (UEFI Secure Boot with OVMF)
```bash
qemu-system-x86_64 \
  -m 4G \
  -smp 4 \
  -enable-kvm \
  -cpu host \
  -drive if=pflash,format=raw,readonly=on,file=/usr/share/OVMF/OVMF_CODE.secboot.fd \
  -drive if=pflash,format=raw,file=ovmf_vars.fd \
  -cdrom dist/release-v0.1.0/nova-os-0.1.0-x86_64.iso \
  -boot d \
  -vga virtio \
  -net nic,model=virtio -net user
```

---

## 🛠️ Subsystems & Repository Structure

```
nova-os/
├── .github/workflows/          # Automated multi-stage CI pipeline (Rust, Vitest, Python, ISO)
├── crates/
│   ├── nova-core/              # Hardware telemetry, health monitoring, OS config loader
│   ├── nova-system-api/        # Shared D-Bus IPC schemas, types, and error models
│   ├── nova-security/          # Honest security posture readers (SELinux, Secure Boot, Firewall)
│   ├── nova-permissions/       # Capability broker and permission state store
│   ├── nova-ai-runtime/        # Dual local/cloud inference manager, safe tool registry
│   ├── nova-audit/             # Cryptographic SHA-256 block hash-chained audit engine
│   └── nova-updater/           # Atomic OSTree update manager with anti-downgrade semver checks
├── desktop/shell/              # Lit + TypeScript glassmorphic Wayland desktop shell
├── os/
│   ├── boot/                   # Systemd units hardened with ProtectSystem=strict
│   ├── image/                  # Containerfile, build-image.sh, Anaconda kickstart (nova-os.ks)
│   ├── policies/               # SELinux type enforcement (TE) and PolicyKit XML actions
│   └── updates/                # Atomic update metadata schemas
├── dist/release-v0.1.0/        # Published release ISO, checksums, and manifests
├── docs/                       # Architecture, Security, Threat Model, and Release Notes
├── scripts/                    # ISO builder (build_iso.py), release publisher, and test harnesses
├── tests/integration/          # 135+ automated end-to-end integration tests
└── website/                    # Modern showcase website and download page
```

---

## 🧪 Testing & Verification

Run the complete test suite:
```bash
# 1. Python integration tests (135+ tests)
python -m unittest discover -s tests/integration -p "test_*.py" -v

# 2. Rust workspace check & clippy
cargo check --workspace
cargo clippy --workspace -- -D warnings

# 3. Desktop shell Vitest suite
cd desktop/shell
pnpm test -- --run
```

---

## 📚 Documentation Index

- [Architecture Specification](docs/ARCHITECTURE.md)
- [Security Assessment & Vulnerability Register](docs/SECURITY_ASSESSMENT.md)
- [Attack Surface Inventory](docs/ATTACK_SURFACE.md)
- [Permission & Sandboxing Matrix](docs/PERMISSION_MATRIX.md)
- [Threat Model (STRIDE)](docs/THREAT_MODEL.md)
- [Security Architecture](docs/SECURITY.md)
- [Privacy Architecture](docs/PRIVACY.md)
- [Accessibility Guidelines](docs/ACCESSIBILITY.md)
- [Installation & Deployment Guide](docs/INSTALLATION.md)
- [Release Notes v0.1.0](docs/RELEASE_NOTES_v0.1.0.md)
- [Build Instructions](docs/BUILD.md)
- [Roadmap](docs/ROADMAP.md)

---

## 📄 License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.
