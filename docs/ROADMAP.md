# NOVA OS Engineering Roadmap

## Milestone 0.1: Foundation & Prototype (Current)
- [x] Repository modular architecture and workspace scaffolding
- [x] Architecture, Threat Model, Security, Privacy, and Accessibility specifications
- [x] NOVA Core D-Bus service contracts and system monitoring
- [x] NOVA Permissions broker with audit log pipeline
- [x] NOVA Security Center status inspection and non-fabricated data guarantees
- [x] NOVA AI Runtime with provider abstraction and allowlisted tool execution
- [x] NOVA Desktop Shell web prototype with glassmorphism UI
- [x] Automated integration test suite

## Milestone 0.2: Native Wayland Shell
- [ ] Smithay-based Wayland compositor integration
- [ ] Direct rendering of desktop shell via iced / slint / webview
- [ ] Polkit authentication agent dialog integration
- [ ] NetworkManager and WirePlumber D-Bus bindings

## Milestone 0.3: Hardware Enablement & Verification
- [ ] Bootable UEFI ISO verified in QEMU/KVM automation
- [ ] PipeWire audio and input event latency tuning
- [ ] Flatpak application sandbox portal integration
- [ ] Secure Boot key enrollment tooling

## Milestone 1.0: Production Release
- [ ] Dual A/B atomic deployment verified with automated rollback
- [ ] Encrypted root partition with TPM2 auto-unlock
- [ ] Ecosystem package repository and developer documentation
