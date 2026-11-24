# Building NOVA OS

## Prerequisites
- **Operating System**: Linux (Fedora 40/41 or RHEL 9 recommended for native ISO creation). Windows/macOS supported for development prototype and tests.
- **Build Tools**:
  - Rust 1.75+ & Cargo
  - Node.js 20+ & pnpm 9+
  - Python 3.11+
  - Podman or Docker
  - `bootc` (v1.1+) or `rpm-ostree`
  - `lorax` / `mkksiso` for bootable ISO generation

## Building Components

### 1. Rust System Services
```bash
cargo build --workspace
cargo test --workspace
```

### 2. Desktop Shell
```bash
cd desktop/shell
pnpm install
pnpm run build
```

### 3. Container Image (OCI Bootable Image)
```bash
podman build -f os/image/Containerfile -t localhost/nova-os:latest .
```

### 4. Bootable ISO Generation
Using `bootc-image-builder`:
```bash
podman run \
  --rm \
  --privileged \
  -v ./config.json:/config.json:ro \
  -v ./output:/output \
  -v /var/lib/containers/storage:/var/lib/containers/storage \
  quay.io/centos-bootc/bootc-image-builder:latest \
  --type iso \
  localhost/nova-os:latest
```

## Running the Development Prototype
To run the interactive desktop in your browser:
```bash
cd desktop/shell
pnpm run dev
```
Open `http://localhost:5173` to explore the shell, launcher, and system apps.
