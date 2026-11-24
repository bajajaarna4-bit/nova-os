#!/usr/bin/env bash
# =============================================================================
# build-image.sh — Build the bootable NOVA OS container image and convert to bootable ISO / QCOW2
# =============================================================================
set -euo pipefail

IMAGE_TAG="${1:-v0.1.0-alpha}"
IMAGE_NAME="localhost/nova-os:${IMAGE_TAG}"
OUTPUT_DIR="$(pwd)/build-output"

echo "=== NOVA OS Image Builder ==="
echo "Target: ${IMAGE_NAME}"
echo "Output Directory: ${OUTPUT_DIR}"

# 1. Build the bootable container image using Containerfile
echo "[INFO] Building multi-stage container image with podman/docker..."
if command -v podman &>/dev/null; then
    CONTAINER_ENGINE="podman"
elif command -v docker &>/dev/null; then
    CONTAINER_ENGINE="docker"
else
    echo "[ERROR] Neither podman nor docker found in PATH." >&2
    exit 1
fi

"${CONTAINER_ENGINE}" build -t "${IMAGE_NAME}" -f os/image/Containerfile .

echo "[OK] Container image ${IMAGE_NAME} built successfully."

# 2. Instructions for bootc-image-builder conversion
mkdir -p "${OUTPUT_DIR}"
echo
echo "=== Bootable Artifact Generation (ISO & QCOW2) ==="
echo "To convert ${IMAGE_NAME} into a bootable QEMU/KVM disk image (qcow2) and bare-metal installer ISO, run:"
echo
echo "sudo ${CONTAINER_ENGINE} run --rm --privileged \\"
echo "  -v \"${OUTPUT_DIR}:/output\" \\"
echo "  -v /var/lib/containers/storage:/var/lib/containers/storage \\"
echo "  quay.io/centos-bootc/bootc-image-builder:latest \\"
echo "  --type qcow2 --type iso \\"
echo "  ${IMAGE_NAME}"
echo
echo "To boot in QEMU/KVM:"
echo "qemu-system-x86_64 -m 4G -smp 4 -enable-kvm -drive file=build-output/qcow2/disk.qcow2,format=qcow2"
