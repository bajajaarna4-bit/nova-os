# Changelog

All notable changes to NOVA OS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Wayland compositor integration (wlroots-based)
- Bootable ISO build pipeline (Fedora Atomic base)
- Full AT-SPI2 accessibility integration
- Hardware security key (FIDO2) authentication
- Encrypted backup with key escrow
- Multi-monitor support in desktop shell

## [0.1.0] - 2026-11-24

### Added

#### Core System
- Initial NOVA OS prototype — development preview
- **NOVA Core** system service (D-Bus, system info, resource monitoring)
  - `org.nova.Core` D-Bus interface on session bus
  - `GetSystemInfo()` — hostname, kernel version, OS version, uptime, CPU, RAM
  - `GetResourceUsage()` — CPU %, memory used/total, load average
  - `GetServiceStatus(name)` — per-service health checks
  - Graceful shutdown on SIGTERM, full tracing with `tracing` crate
  - Windows mock data for cross-platform development
- **NOVA Permissions** broker
  - `org.nova.Permissions` D-Bus interface
  - `CheckPermission(app_id, permission)` — policy lookup and enforcement
  - `GrantPermission` / `RevokePermission` — dynamic permission management
  - Persistent JSON-based permission store
  - Audit event emission on every access decision
- **NOVA AI Runtime** with provider abstraction
  - `org.nova.AI` D-Bus interface
  - `ProcessQuery(prompt, context)` — provider-agnostic LLM calls
  - `GetCapabilities()` — runtime feature discovery
  - Local Ollama provider (privacy-first, no network)
  - Gemini API provider (opt-in, explicit consent required)
  - Full mock provider for testing
  - Automatic provider fallback chain
- **NOVA Audit** logger
  - `org.nova.Audit` D-Bus interface
  - Append-only structured log (JSON Lines)
  - Query with filters: actor, action, resource, time range
  - Log rotation and size limits
  - Signed log entries (placeholder — GPG integration planned)
- **NOVA Security Monitor**
  - Real-time security event detection
  - Policy violation alerting
  - Integration with SELinux AVC log
  - Risk level calculation per event

#### Desktop Shell
- NOVA Desktop shell — web prototype (Tauri-ready)
  - **Desktop canvas** with animated particle background
  - **Application dock** — pinned apps, running app indicators, bounce animation
  - **Status bar** — live clock, network, battery, volume, notifications badge
  - **Application launcher** with real-time search and category filtering
  - **Window management** — open, close, minimize, z-ordering, focus tracking
  - **Notification center** — dismiss individual or all, timestamp display
  - **Quick settings panel** — Wi-Fi, Bluetooth, Do Not Disturb, Dark Mode, brightness, volume
  - **AI Assistant interface** — chat UI, suggested prompts, provider display
  - **Settings application** — tabbed UI for Appearance, Privacy, Security, Accessibility, AI
  - **Security Center** — threat level gauge, service status, recent events, action buttons
  - **File Manager** — sidebar navigation, grid/list view, file operations
  - **Terminal emulator** — interactive bash-like REPL, command history, ANSI colors

#### Security Infrastructure
- SELinux policy module (`nova.pp`)
  - Type definitions for all NOVA services
  - File context labeling
  - D-Bus interface access rules
  - Polkit integration rules
- Polkit authorization policies (`org.nova.policy`)
  - Fine-grained action rules for all NOVA D-Bus methods
  - Administrator vs. user permission split
  - Active console session enforcement
- Systemd service units with security hardening:
  - `ProtectSystem=strict`, `ProtectHome=read-only`
  - `NoNewPrivileges=yes`, `PrivateTmp=yes`, `PrivateNetwork=yes`
  - `RestrictNamespaces=yes`, `RestrictSUIDSGID=yes`
  - `SystemCallFilter=@system-service`
  - `MemoryDenyWriteExecute=yes`
  - `CapabilityBoundingSet=` (empty — no capabilities by default)

#### Documentation
- `docs/ARCHITECTURE.md` — Full system architecture with Mermaid diagrams
- `docs/THREAT_MODEL.md` — STRIDE analysis, threat actors, risk register
- `docs/SECURITY.md` — Security architecture, SELinux, seccomp, audit
- `docs/PRIVACY.md` — Data minimization, local-first AI, GDPR alignment
- `docs/ACCESSIBILITY.md` — WCAG 2.2 AA plan, AT-SPI2, keyboard nav
- `docs/BUILD.md` — Build prerequisites, rpm-ostree, CI pipeline
- `docs/ROADMAP.md` — v0.1 → v1.0 phased roadmap
- `docs/TESTING.md` — Test strategy: unit, integration, security, a11y
- `README.md` — Project overview, quick start, contributing guide
- `CONTRIBUTING.md` — Branch naming, PR process, code style
- `SECURITY.md` — Vulnerability disclosure policy

#### CI/CD
- GitHub Actions pipeline (`.github/workflows/ci.yml`)
  - `check` job: rustfmt, clippy, cargo check
  - `test` job: `cargo test --workspace`, coverage via llvm-cov
  - `desktop-test` job: pnpm install, pnpm test, pnpm build
  - `security` job: cargo-audit, cargo-deny, Trivy scan
  - `docs` job: broken link check, mdBook build
  - Dependabot configuration for Cargo and npm
  - Branch protection rule enforcement

#### Website
- Public website (`website/index.html`, `website/styles.css`)
  - Full landing page: hero, features, architecture, privacy, download, docs, footer
  - Interactive desktop demo (`website/nova-os-demo.html`)
  - Design system: dark theme, violet/blue gradient, glass morphism, Inter font
- Release automation script (`scripts/release.sh`)

### Known Limitations (v0.1)

- **Wayland compositor not yet integrated** — desktop runs as web prototype in browser
- **No bootable ISO** — actual disk image requires Linux build environment with rpm-ostree
- **AI provider requires external API key** — Gemini provider needs `GEMINI_API_KEY` env var
- **Security status shows Unknown on non-Linux** — SELinux, seccomp checks require Linux kernel
- **Accessibility screen reader integration requires AT-SPI2** — Linux-only AT-SPI2 bus
- **D-Bus services Linux-only** — Windows/macOS builds use mock D-Bus adapter
- **GPG release signing** — placeholder; requires a signing key before public release
- **Hardware keys not yet supported** — FIDO2/WebAuthn planned for v0.2
- **Multi-monitor** — not yet implemented in desktop shell

### Security

No CVEs addressed in this release (first prototype; not yet deployed to production).

---

[Unreleased]: https://github.com/nova-os/nova-os/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/nova-os/nova-os/releases/tag/v0.1.0
