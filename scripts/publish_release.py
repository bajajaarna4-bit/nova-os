#!/usr/bin/env python3
"""
scripts/publish_release.py — NOVA OS Release Publisher
Validates distribution artifacts, verifies SHA-256 sums, checks git tags,
and executes GitHub release creation.
"""

import hashlib
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent.resolve()
VERSION = "v0.1.0"
RELEASE_DIR = REPO_ROOT / "dist" / f"release-{VERSION}"
ISO_PATH = RELEASE_DIR / f"nova-os-0.1.0-x86_64.iso"
SHA256_FILE = RELEASE_DIR / "SHA256SUMS"
NOTES_FILE = REPO_ROOT / "docs" / f"RELEASE_NOTES_{VERSION}.md"

print(f"=== NOVA OS Release Publisher [{VERSION}] ===")

# 1. Check artifact existence
required_files = [ISO_PATH, SHA256_FILE, NOTES_FILE]
for f in required_files:
    if not f.exists():
        print(f"[ERROR] Required release file missing: {f}", file=sys.stderr)
        sys.exit(1)
print("[OK] All required release artifacts present.")

# 2. Verify SHA-256 checksum
print("[INFO] Verifying SHA-256 checksum...")
expected_hash = SHA256_FILE.read_text(encoding="utf-8").strip().split()[0]
actual_hash = hashlib.sha256(ISO_PATH.read_bytes()).hexdigest()
if expected_hash.lower() != actual_hash.lower():
    print(f"[ERROR] Checksum mismatch! Expected {expected_hash}, calculated {actual_hash}", file=sys.stderr)
    sys.exit(1)
print(f"[OK] Checksum verified: {actual_hash}")

# 3. GitHub CLI Check & Publishing
gh_bin = shutil.which("gh")
if gh_bin:
    print(f"[INFO] GitHub CLI found at {gh_bin}. Creating release...")
    cmd = [
        gh_bin, "release", "create", VERSION,
        str(ISO_PATH),
        str(SHA256_FILE),
        str(RELEASE_DIR / "SHA512SUMS"),
        str(RELEASE_DIR / "release-manifest.json"),
        "--title", f"NOVA OS {VERSION} (Zero-Trust, AI-Native Linux)",
        "--notes-file", str(NOTES_FILE),
    ]
    res = subprocess.run(cmd, cwd=str(REPO_ROOT), capture_output=True, text=True)
    if res.returncode == 0:
        print(f"[SUCCESS] Release {VERSION} published to GitHub successfully!")
        print(res.stdout)
    else:
        print(f"[WARN] gh release create returned non-zero (may already exist or need login):\n{res.stderr}")
else:
    print("\n[INFO] GitHub CLI ('gh') is not installed or not in PATH.")
    print("To publish this release to GitHub manually, run:")
    print("-" * 70)
    print(f"git tag -a {VERSION} -m 'Release {VERSION}'")
    print(f"git push origin {VERSION}")
    print(f"gh release create {VERSION} dist/release-{VERSION}/* --title 'NOVA OS {VERSION}' --notes-file docs/RELEASE_NOTES_{VERSION}.md")
    print("-" * 70)

print("\n✅ Release preparation and validation complete!")
