# NOVA OS v0.1.0 Official Release Bundle

This directory contains the official signed distribution artifacts for NOVA OS v0.1.0 (x86_64).

## Files Included

- `nova-os-0.1.0-x86_64.iso`: Bootable dual BIOS + UEFI live and installer ISO image.
- `SHA256SUMS`: Cryptographic SHA-256 verification sums.
- `SHA512SUMS`: Cryptographic SHA-512 verification sums.
- `release-manifest.json`: Machine-readable metadata, build info, and verified hardware targets.
- `RELEASE_NOTES.md`: Comprehensive release notes and changelog.

## Verifying Download Integrity

```bash
sha256sum -c SHA256SUMS
```

Expected SHA-256:
`477a7bb5d2f01b57244579121dbb8077ffc715e617181c45074806b2ef568e88  nova-os-0.1.0-x86_64.iso`

## Booting in QEMU / KVM

```bash
qemu-system-x86_64 -m 4G -smp 4 -enable-kvm -cdrom nova-os-0.1.0-x86_64.iso -boot d -vga virtio
```
