# NOVA OS

> A modern, zero-trust, AI-native operating system distribution built on an atomic Linux foundation.

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](.github/workflows/build.yml)

## Architecture Highlights
- **Atomic Base**: Built using bootc / rpm-ostree containerized system images.
- **Zero-Trust Security**: SELinux enforcing by default, systemd service sandboxing, polkit authorization, and least-privilege service design.
- **NOVA Intelligence**: Local-first AI subsystem with an allowlisted tool registry and permission broker.
- **Modern Desktop Shell**: Fluid, high-contrast dark theme with violet and blue accents, accessible window management, and rapid app launching.

## Subsystems
- **NOVA Core** (`crates/nova-core`): System telemetry, health, resource monitoring.
- **NOVA Security** (`crates/nova-security`): Hardware security posture, SELinux status, firewall monitoring.
- **NOVA Permissions** (`crates/nova-permissions`): Per-application permission broker.
- **NOVA AI Runtime** (`crates/nova-ai-runtime`): Safe AI provider integration with tool allowlists.
- **NOVA Desktop** (`desktop/shell`): Responsive Wayland-ready desktop environment.

## Quick Start
To run the development desktop shell:
```bash
cd desktop/shell
pnpm install
pnpm run dev
```

To run the full test suite:
```bash
python -m unittest discover -s tests/integration -p "test_*.py" -v
```

## Documentation
- [Architecture Details](docs/ARCHITECTURE.md)
- [Threat Model](docs/THREAT_MODEL.md)
- [Security Model](docs/SECURITY.md)
- [Privacy Architecture](docs/PRIVACY.md)
- [Accessibility](docs/ACCESSIBILITY.md)
- [Build Instructions](docs/BUILD.md)
- [Roadmap](docs/ROADMAP.md)

## License
Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.
