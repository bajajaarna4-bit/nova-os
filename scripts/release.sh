#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# NOVA OS Release Script
# Usage: ./scripts/release.sh v0.1.0
#
# This script:
#   1. Validates the version tag format
#   2. Checks for clean git state
#   3. Builds all Rust binaries (--release)
#   4. Builds the desktop shell
#   5. Creates the release artifacts directory
#   6. Generates SHA-256 and SHA-512 checksums
#   7. Signs checksums with GPG (if key is available)
#   8. Prints a summary
# =============================================================================

VERSION=${1:?Usage: $0 '<version>  (e.g. v0.1.0)'}
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARTIFACTS_DIR="${REPO_ROOT}/dist/release-${VERSION}"

# ── Color helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()  { echo -e "${CYAN}[INFO]${RESET}  $*"; }
ok()    { echo -e "${GREEN}[OK]${RESET}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${RESET}  $*"; }
error() { echo -e "${RED}[ERROR]${RESET} $*" >&2; exit 1; }

# ── Validate version format ──────────────────────────────────────────────────
if [[ ! "${VERSION}" =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
  error "Version must match vMAJOR.MINOR.PATCH (e.g. v0.1.0 or v1.0.0-rc.1)"
fi

echo -e "${BOLD}╔══════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║   NOVA OS Release: ${VERSION}        ${RESET}"
echo -e "${BOLD}╚══════════════════════════════════════╝${RESET}"
echo

# ── Pre-flight checks ────────────────────────────────────────────────────────
info "Checking prerequisites..."

command -v cargo   >/dev/null 2>&1 || error "cargo not found — install Rust from https://rustup.rs"
command -v pnpm    >/dev/null 2>&1 || error "pnpm not found — install with: npm install -g pnpm"
command -v sha256sum >/dev/null 2>&1 || error "sha256sum not found (install coreutils)"
command -v sha512sum >/dev/null 2>&1 || error "sha512sum not found (install coreutils)"

ok "Prerequisites satisfied"

# ── Git cleanliness check ────────────────────────────────────────────────────
if git -C "${REPO_ROOT}" diff-index --quiet HEAD -- 2>/dev/null; then
  ok "Git working tree is clean"
else
  warn "Git working tree has uncommitted changes — release may not be reproducible"
  read -rp "Continue anyway? [y/N] " reply
  [[ "${reply}" =~ ^[Yy]$ ]] || error "Aborted by user"
fi

# ── Tag check ───────────────────────────────────────────────────────────────
if git -C "${REPO_ROOT}" rev-parse "${VERSION}" >/dev/null 2>&1; then
  ok "Git tag ${VERSION} exists"
else
  warn "Git tag ${VERSION} does not exist yet"
  warn "Create it with: git tag -s ${VERSION} -m 'Release ${VERSION}'"
fi

# ── Build Rust binaries ──────────────────────────────────────────────────────
info "Building Rust binaries (--release)..."
cargo build --release --workspace --manifest-path "${REPO_ROOT}/Cargo.toml"
ok "Rust build complete"

# ── Build desktop shell ──────────────────────────────────────────────────────
SHELL_DIR="${REPO_ROOT}/desktop/shell"
if [ -d "${SHELL_DIR}" ]; then
  info "Building desktop shell..."
  (cd "${SHELL_DIR}" && pnpm install --frozen-lockfile && pnpm build)
  ok "Desktop shell build complete"
else
  warn "desktop/shell directory not found — skipping desktop shell build"
fi

# ── Create artifacts directory ───────────────────────────────────────────────
info "Creating artifacts directory: ${ARTIFACTS_DIR}"
mkdir -p "${ARTIFACTS_DIR}"

# Copy binaries
TARGETS=(
  nova-core
  nova-permissions
  nova-ai-runtime
  nova-security
  nova-updater
)
BINARY_DIR="${REPO_ROOT}/target/release"
for binary in "${TARGETS[@]}"; do
  if [ -f "${BINARY_DIR}/${binary}" ]; then
    cp "${BINARY_DIR}/${binary}" "${ARTIFACTS_DIR}/"
    ok "Copied ${binary}"
  elif [ -f "${BINARY_DIR}/${binary}.exe" ]; then
    cp "${BINARY_DIR}/${binary}.exe" "${ARTIFACTS_DIR}/"
    ok "Copied ${binary}.exe"
  else
    warn "Binary not found: ${binary} — skipping"
  fi
done

# Copy desktop shell dist
SHELL_DIST="${SHELL_DIR}/dist"
if [ -d "${SHELL_DIST}" ]; then
  cp -r "${SHELL_DIST}" "${ARTIFACTS_DIR}/desktop-shell"
  ok "Copied desktop shell dist"
fi

# Copy documentation
cp "${REPO_ROOT}/README.md"      "${ARTIFACTS_DIR}/" 2>/dev/null || true
cp "${REPO_ROOT}/CHANGELOG.md"   "${ARTIFACTS_DIR}/" 2>/dev/null || true
cp "${REPO_ROOT}/SECURITY.md"    "${ARTIFACTS_DIR}/" 2>/dev/null || true
cp "${REPO_ROOT}/LICENSE"        "${ARTIFACTS_DIR}/" 2>/dev/null || true

# ── Generate checksums ───────────────────────────────────────────────────────
info "Generating checksums..."

# Check for ISO (optional — won't exist in dev builds)
ISO_FILES=("${ARTIFACTS_DIR}"/nova-os-*.iso)
if [ -f "${ISO_FILES[0]}" ]; then
  sha256sum "${ISO_FILES[@]}" > "${ARTIFACTS_DIR}/SHA256SUMS"
  sha512sum "${ISO_FILES[@]}" > "${ARTIFACTS_DIR}/SHA512SUMS"
  ok "Generated SHA256SUMS and SHA512SUMS for ISO(s)"
else
  warn "No ISO files found — generating checksums for binaries instead"
  # Checksum all non-checksum files
  find "${ARTIFACTS_DIR}" -maxdepth 1 -type f \
    ! -name 'SHA256SUMS' ! -name 'SHA512SUMS' ! -name '*.asc' \
    -exec sha256sum {} \; | sed "s|${ARTIFACTS_DIR}/||g" \
    > "${ARTIFACTS_DIR}/SHA256SUMS"
  find "${ARTIFACTS_DIR}" -maxdepth 1 -type f \
    ! -name 'SHA256SUMS' ! -name 'SHA512SUMS' ! -name '*.asc' \
    -exec sha512sum {} \; | sed "s|${ARTIFACTS_DIR}/||g" \
    > "${ARTIFACTS_DIR}/SHA512SUMS"
  ok "Generated SHA256SUMS and SHA512SUMS"
fi

# ── GPG signing ──────────────────────────────────────────────────────────────
GPG_KEY="nova-os@example.com"
if command -v gpg >/dev/null 2>&1 && gpg --list-keys "${GPG_KEY}" >/dev/null 2>&1; then
  info "Signing checksums with GPG key ${GPG_KEY}..."
  gpg --batch --yes --detach-sign --armor \
      --local-user "${GPG_KEY}" \
      "${ARTIFACTS_DIR}/SHA256SUMS"
  ok "GPG signature: ${ARTIFACTS_DIR}/SHA256SUMS.asc"
else
  warn "GPG key ${GPG_KEY} not found — skipping signature"
  warn "To sign: gpg --detach-sign --armor ${ARTIFACTS_DIR}/SHA256SUMS"
fi

# ── Write release metadata ───────────────────────────────────────────────────
GIT_HASH=$(git -C "${REPO_ROOT}" rev-parse --short HEAD 2>/dev/null || echo "unknown")
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

cat > "${ARTIFACTS_DIR}/release-metadata.json" <<EOF
{
  "version": "${VERSION}",
  "build_date": "${BUILD_DATE}",
  "git_commit": "${GIT_HASH}",
  "build_host": "$(uname -s)-$(uname -m)",
  "rust_version": "$(cargo --version 2>/dev/null || echo 'unknown')",
  "nova_os_project": "https://github.com/nova-os/nova-os"
}
EOF
ok "Written release-metadata.json"

# ── Summary ──────────────────────────────────────────────────────────────────
echo
echo -e "${BOLD}╔══════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║   Release ${VERSION} artifacts ready           ${RESET}"
echo -e "${BOLD}╠══════════════════════════════════════════════╣${RESET}"
echo -e "${BOLD}║${RESET}  Directory: ${ARTIFACTS_DIR}"
echo -e "${BOLD}║${RESET}  Git commit: ${GIT_HASH}"
echo -e "${BOLD}║${RESET}  Built at:   ${BUILD_DATE}"
echo -e "${BOLD}╚══════════════════════════════════════════════╝${RESET}"
echo

echo "Files in ${ARTIFACTS_DIR}:"
ls -lh "${ARTIFACTS_DIR}"

echo
echo -e "${GREEN}✅ Release ${VERSION} complete${RESET}"
echo
echo "Next steps:"
echo "  1. Verify checksums:   sha256sum -c ${ARTIFACTS_DIR}/SHA256SUMS"
echo "  2. Push git tag:       git push origin ${VERSION}"
echo "  3. Upload to GitHub:   gh release create ${VERSION} ${ARTIFACTS_DIR}/*"
echo "  4. Update website download links for version ${VERSION}"
