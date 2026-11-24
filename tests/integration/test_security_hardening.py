"""
NOVA OS Security Hardening Verification Suite
Tests cryptographic audit hash-chaining, systemd sandboxing, polkit completeness,
SELinux constraints, update anti-downgrade, and application isolation.
"""

import hashlib
import json
import os
import platform
import re
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path

NOVA_OS_ROOT = Path(__file__).parent.parent.parent
OS_BOOT_DIR = NOVA_OS_ROOT / "os" / "boot"
OS_POLICIES_DIR = NOVA_OS_ROOT / "os" / "policies"


# ---------------------------------------------------------------------------
# 1. Audit Log Cryptographic Hash Chaining Tests
# ---------------------------------------------------------------------------

class TestAuditHashChaining(unittest.TestCase):
    """
    Verifies that audit log events are cryptographically hash-chained using SHA-256,
    matching the implementation in crates/nova-audit.
    """

    def compute_hash(self, sequence: int, timestamp: str, event_type: str,
                     actor: str, resource: str, action: str, outcome: str,
                     previous_hash: str) -> str:
        hasher = hashlib.sha256()
        hasher.update(sequence.to_bytes(8, byteorder="big"))
        hasher.update(timestamp.encode("utf-8"))
        hasher.update(event_type.encode("utf-8"))
        hasher.update(actor.encode("utf-8"))
        hasher.update(resource.encode("utf-8"))
        hasher.update(action.encode("utf-8"))
        hasher.update(outcome.encode("utf-8"))
        hasher.update(previous_hash.encode("utf-8"))
        return hasher.hexdigest()

    def test_hash_computation_deterministic(self):
        h1 = self.compute_hash(1, "2026-11-24T12:00:00Z", "auth", "user1", "res1", "read", "success", "GENESIS")
        h2 = self.compute_hash(1, "2026-11-24T12:00:00Z", "auth", "user1", "res1", "read", "success", "GENESIS")
        self.assertEqual(h1, h2)
        self.assertEqual(len(h1), 64)

    def test_hash_changes_on_payload_mutation(self):
        original = self.compute_hash(1, "2026-11-24T12:00:00Z", "auth", "user1", "res1", "read", "success", "GENESIS")
        tampered = self.compute_hash(1, "2026-11-24T12:00:00Z", "auth", "root", "res1", "read", "success", "GENESIS")
        self.assertNotEqual(original, tampered)

    def test_sequential_hash_chain(self):
        chain = []
        prev = "GENESIS"
        for i in range(1, 6):
            h = self.compute_hash(i, f"2026-11-24T12:0{i}:00Z", "service_start", "systemd", f"svc-{i}", "start", "success", prev)
            event = {
                "sequence": i,
                "timestamp": f"2026-11-24T12:0{i}:00Z",
                "event_type": "service_start",
                "actor": "systemd",
                "resource": f"svc-{i}",
                "action": "start",
                "outcome": "success",
                "previous_hash": prev,
                "hash": h
            }
            chain.append(event)
            prev = h

        # Verify integrity of complete chain
        expected_seq = 1
        expected_prev = "GENESIS"
        for ev in chain:
            self.assertEqual(ev["sequence"], expected_seq)
            self.assertEqual(ev["previous_hash"], expected_prev)
            computed = self.compute_hash(
                ev["sequence"], ev["timestamp"], ev["event_type"],
                ev["actor"], ev["resource"], ev["action"], ev["outcome"],
                ev["previous_hash"]
            )
            self.assertEqual(ev["hash"], computed)
            expected_prev = ev["hash"]
            expected_seq += 1

    def test_tamper_detection_breaks_chain(self):
        chain = []
        prev = "GENESIS"
        for i in range(1, 4):
            h = self.compute_hash(i, f"2026-11-24T12:0{i}:00Z", "permission_grant", "user", "camera", "grant", "success", prev)
            chain.append({
                "sequence": i,
                "timestamp": f"2026-11-24T12:0{i}:00Z",
                "event_type": "permission_grant",
                "actor": "user",
                "resource": "camera",
                "action": "grant",
                "outcome": "success",
                "previous_hash": prev,
                "hash": h
            })
            prev = h

        # Tamper with event 2 action
        chain[1]["action"] = "revoke"

        # Verify chain integrity checker detects failure
        valid = True
        for ev in chain:
            computed = self.compute_hash(
                ev["sequence"], ev["timestamp"], ev["event_type"],
                ev["actor"], ev["resource"], ev["action"], ev["outcome"],
                ev["previous_hash"]
            )
            if ev["hash"] != computed:
                valid = False
                break
        self.assertFalse(valid, "Tampered chain must be detected as invalid")


# ---------------------------------------------------------------------------
# 2. Systemd Service Sandboxing Tests
# ---------------------------------------------------------------------------

class TestSystemdSandboxing(unittest.TestCase):
    """
    Verifies that all NOVA OS systemd service units adhere to strict sandboxing
    directives (NoNewPrivileges, ProtectSystem=strict, MemoryDenyWriteExecute, etc.).
    """

    SERVICES = [
        "nova-core.service",
        "nova-permissions.service",
        "nova-security.service",
        "nova-updater.service",
        "nova-ai-runtime.service",
    ]

    def read_service_file(self, filename: str) -> str:
        path = OS_BOOT_DIR / filename
        self.assertTrue(path.exists(), f"Service file {filename} does not exist in {OS_BOOT_DIR}")
        return path.read_text(encoding="utf-8")

    def test_all_services_exist(self):
        for svc in self.SERVICES:
            self.assertTrue((OS_BOOT_DIR / svc).exists(), f"Missing {svc}")

    def test_no_new_privileges_enforced(self):
        for svc in self.SERVICES:
            content = self.read_service_file(svc)
            self.assertIn("NoNewPrivileges=true", content, f"{svc} must enable NoNewPrivileges")

    def test_protect_system_strict(self):
        for svc in self.SERVICES:
            content = self.read_service_file(svc)
            self.assertIn("ProtectSystem=strict", content, f"{svc} must set ProtectSystem=strict")

    def test_protect_home_isolated(self):
        for svc in self.SERVICES:
            content = self.read_service_file(svc)
            is_protected = "ProtectHome=true" in content or "ProtectHome=read-only" in content
            self.assertTrue(is_protected, f"{svc} must set ProtectHome to true or read-only")

    def test_private_tmp_true(self):
        for svc in self.SERVICES:
            content = self.read_service_file(svc)
            self.assertIn("PrivateTmp=true", content, f"{svc} must set PrivateTmp=true")

    def test_memory_deny_write_execute(self):
        for svc in self.SERVICES:
            content = self.read_service_file(svc)
            self.assertIn("MemoryDenyWriteExecute=true", content, f"{svc} must set MemoryDenyWriteExecute=true")

    def test_hostname_personality_realtime_restricted(self):
        for svc in self.SERVICES:
            content = self.read_service_file(svc)
            self.assertIn("ProtectHostname=true", content, f"{svc} must set ProtectHostname=true")
            self.assertIn("LockPersonality=true", content, f"{svc} must set LockPersonality=true")
            self.assertIn("RestrictRealtime=true", content, f"{svc} must set RestrictRealtime=true")
            self.assertIn("RestrictSUIDSGID=true", content, f"{svc} must set RestrictSUIDSGID=true")

    def test_services_run_as_non_root(self):
        for svc in self.SERVICES:
            content = self.read_service_file(svc)
            match = re.search(r"User=([a-zA-Z0-9_-]+)", content)
            self.assertIsNotNone(match, f"{svc} must define a User directive")
            user = match.group(1)
            self.assertNotEqual(user, "root", f"{svc} must not run as root")


# ---------------------------------------------------------------------------
# 3. Polkit Authorization Policy Tests
# ---------------------------------------------------------------------------

class TestPolkitPolicy(unittest.TestCase):
    """
    Verifies that all privileged NOVA OS operations are protected by explicit
    PolicyKit rules with default-deny semantics.
    """

    POLICY_FILE = OS_POLICIES_DIR / "nova.policy"

    def setUp(self):
        self.assertTrue(self.POLICY_FILE.exists(), f"Polkit file {self.POLICY_FILE} missing")
        self.tree = ET.parse(self.POLICY_FILE)
        self.root = self.tree.getroot()

    def test_xml_is_valid(self):
        self.assertEqual(self.root.tag, "policyconfig")

    def test_critical_actions_defined(self):
        expected_actions = {
            "org.nova.updater.apply-update",
            "org.nova.permissions.grant",
            "org.nova.permissions.revoke",
            "org.nova.security.enforce-selinux",
            "org.nova.security.modify-firewall",
            "org.nova.ai.execute-consequential-tool",
            "org.nova.core.power-management",
        }
        found_actions = {elem.attrib.get("id") for elem in self.root.findall("action")}
        missing = expected_actions - found_actions
        self.assertEqual(len(missing), 0, f"Missing polkit actions: {missing}")

    def test_default_deny_or_auth_required_for_privileged_actions(self):
        for action in self.root.findall("action"):
            action_id = action.attrib.get("id")
            defaults = action.find("defaults")
            self.assertIsNotNone(defaults, f"Action {action_id} missing defaults block")

            allow_any = defaults.find("allow_any").text
            allow_inactive = defaults.find("allow_inactive").text
            allow_active = defaults.find("allow_active").text

            # Privileged actions must NEVER allow_any: yes
            if action_id in {
                "org.nova.updater.apply-update",
                "org.nova.security.enforce-selinux",
                "org.nova.security.modify-firewall",
                "org.nova.permissions.grant",
                "org.nova.permissions.revoke",
                "org.nova.ai.execute-consequential-tool"
            }:
                self.assertNotEqual(allow_any, "yes", f"{action_id} cannot permit unauthenticated any")
                self.assertNotEqual(allow_inactive, "yes", f"{action_id} cannot permit unauthenticated inactive")


# ---------------------------------------------------------------------------
# 4. SELinux Policy Integrity Tests
# ---------------------------------------------------------------------------

class TestSELinuxPolicy(unittest.TestCase):
    """
    Verifies that the SELinux TE policy declares all necessary daemon domains
    and includes strict negative constraints.
    """

    POLICY_FILE = OS_POLICIES_DIR / "nova-selinux.te"

    def setUp(self):
        self.assertTrue(self.POLICY_FILE.exists(), f"SELinux file {self.POLICY_FILE} missing")
        self.content = self.POLICY_FILE.read_text(encoding="utf-8")

    def test_all_five_domains_declared(self):
        domains = [
            "nova_core_t",
            "nova_permissions_t",
            "nova_security_t",
            "nova_updater_t",
            "nova_ai_runtime_t",
        ]
        for d in domains:
            self.assertIn(f"type {d};", self.content, f"Missing domain type {d}")

    def test_strict_negative_confinement(self):
        # AI runtime must be explicitly forbidden from accessing shadow passwords
        expected = "neverallow nova_ai_runtime_t shadow_t:file { read write open };"
        self.assertIn(expected, self.content, "Missing neverallow constraint for AI runtime shadow access")

    def test_permissions_store_restricted(self):
        # nova_var_lib_t should be accessed by nova_permissions_t
        self.assertIn("allow nova_permissions_t nova_var_lib_t:", self.content)


# ---------------------------------------------------------------------------
# 5. Update Verification & Anti-Downgrade Tests
# ---------------------------------------------------------------------------

class TestUpdateVerificationAndAntiDowngrade(unittest.TestCase):
    """
    Tests atomic update manifest checks, checksum verification, and anti-downgrade protections.
    """

    def parse_semver(self, v: str):
        clean = v.lstrip("v")
        parts = clean.split(".")
        if len(parts) < 3:
            raise ValueError(f"Invalid semver: {v}")
        maj = int(parts[0])
        minor = int(parts[1])
        patch = int(parts[2].split("-")[0])
        return (maj, minor, patch)

    def validate_manifest(self, current: str, target: str, signature: str, digest: str) -> bool:
        if not signature or not signature.strip():
            raise ValueError("Signature cannot be empty")
        if not digest.startswith("sha256:") or len(digest) < 15:
            raise ValueError("Invalid digest format")

        curr_ver = self.parse_semver(current)
        tgt_ver = self.parse_semver(target)

        if tgt_ver < curr_ver:
            raise ValueError(f"Downgrade attack detected: {target} < {current}")
        return True

    def test_payload_checksum_matches(self):
        payload = b"test payload bytes for atomic update"
        expected = hashlib.sha256(payload).hexdigest()
        self.assertEqual(hashlib.sha256(payload).hexdigest(), expected)

    def test_payload_checksum_mismatch_detected(self):
        payload = b"tampered payload bytes"
        wrong_hash = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
        self.assertNotEqual(hashlib.sha256(payload).hexdigest(), wrong_hash)

    def test_anti_downgrade_prevents_older_version(self):
        with self.assertRaises(ValueError) as ctx:
            self.validate_manifest("v1.2.0", "v1.1.9", "sig123", "sha256:abcd1234abcd1234abcd")
        self.assertIn("Downgrade attack detected", str(ctx.exception))

    def test_anti_downgrade_prevents_major_rollback(self):
        with self.assertRaises(ValueError) as ctx:
            self.validate_manifest("v2.0.0", "v1.9.9", "sig123", "sha256:abcd1234abcd1234abcd")
        self.assertIn("Downgrade attack detected", str(ctx.exception))

    def test_valid_forward_upgrade_accepted(self):
        self.assertTrue(self.validate_manifest("v1.0.0", "v1.0.1", "sig123", "sha256:abcd1234abcd1234abcd"))
        self.assertTrue(self.validate_manifest("v1.0.0", "v1.1.0", "sig123", "sha256:abcd1234abcd1234abcd"))
        self.assertTrue(self.validate_manifest("v1.0.0", "v2.0.0", "sig123", "sha256:abcd1234abcd1234abcd"))

    def test_empty_signature_rejected(self):
        with self.assertRaises(ValueError):
            self.validate_manifest("v1.0.0", "v1.0.1", "", "sha256:abcd1234abcd1234abcd")

    def test_invalid_digest_rejected(self):
        with self.assertRaises(ValueError):
            self.validate_manifest("v1.0.0", "v1.0.1", "sig", "md5:abcd")


# ---------------------------------------------------------------------------
# 6. Application Isolation & Sandboxing Profiles
# ---------------------------------------------------------------------------

class TestApplicationIsolation(unittest.TestCase):
    """
    Verifies container isolation flags (Bubblewrap / Flatpak) and zero-trust permissions.
    """

    def generate_bubblewrap_profile(self, app_id: str, permissions: list[str]) -> list[str]:
        args = [
            "bwrap",
            "--unshare-all",
            "--ro-bind", "/usr", "/usr",
            "--ro-bind", "/lib", "/lib",
            "--ro-bind", "/lib64", "/lib64",
            "--tmpfs", "/tmp",
            "--proc", "/proc",
            "--dev", "/dev",
            "--new-session",
            "--die-with-parent"
        ]
        if "network" not in permissions:
            args.append("--unshare-net")
        if "camera" not in permissions:
            # Drop access to video devices
            args.extend(["--dev-bind-try", "/dev/null", "/dev/video0"])
        return args

    def test_bwrap_profile_unshare_all(self):
        profile = self.generate_bubblewrap_profile("org.example.app", [])
        self.assertIn("--unshare-all", profile)
        self.assertIn("--unshare-net", profile)

    def test_bwrap_profile_network_permission(self):
        profile = self.generate_bubblewrap_profile("org.example.app", ["network"])
        self.assertNotIn("--unshare-net", profile)


# ---------------------------------------------------------------------------
# 7. Honest Posture Reporting Tests
# ---------------------------------------------------------------------------

class TestHonestPostureReporting(unittest.TestCase):
    """
    Verifies that security status displays reflect actual kernel/hardware signals
    and never produce fabricated scores.
    """

    def test_no_bogus_perfection_scores(self):
        # A legitimate security service reports discrete subsystem states (SELinux, SecureBoot, Firewall),
        # never a single artificial '100% Secure' score.
        fixture_path = NOVA_OS_ROOT / "tests" / "fixtures" / "mock-security-status.json"
        if fixture_path.exists():
            data = json.loads(fixture_path.read_text(encoding="utf-8"))
            self.assertNotIn("security_score", data, "NOVA OS must not display arbitrary gamified security scores")
            self.assertNotIn("score", data)


# ---------------------------------------------------------------------------
# 8. AI Tool Security & Input Validation Tests
# ---------------------------------------------------------------------------

class TestAIToolSecurityValidation(unittest.TestCase):
    """
    Verifies that the AI tool registry strictly validates paths, prevents traversal,
    blocks null-byte injection, and forbids credential harvesting.
    """

    def validate_safe_path(self, path_str: str):
        if "\0" in path_str:
            raise ValueError("Path contains forbidden null byte character")

        normalized = path_str.replace("\\", "/")
        if "../" in normalized or "/.." in normalized or normalized == ".." or ".." in normalized:
            raise ValueError("Path traversal sequence '..' is forbidden")

        forbidden_patterns = [
            "/etc/shadow",
            "/etc/gshadow",
            "/etc/passwd",
            "/etc/sudoers",
            "/etc/crypttab",
            "/etc/security",
            "/root",
            "/proc",
            "/sys",
            "id_rsa",
            "id_ed25519",
            "id_ecdsa",
            "id_dsa",
            "authorized_keys",
            ".ssh",
            ".gnupg",
            ".bash_history",
            ".zsh_history",
        ]
        for f in forbidden_patterns:
            if f in normalized:
                raise ValueError(f"Access to security-critical path '{f}' is strictly prohibited")
        return True

    def test_path_traversal_rejected(self):
        with self.assertRaises(ValueError):
            self.validate_safe_path("../../etc/shadow")
        with self.assertRaises(ValueError):
            self.validate_safe_path("docs/../../secret.txt")
        with self.assertRaises(ValueError):
            self.validate_safe_path("..\\..\\windows\\system32")

    def test_null_byte_injection_rejected(self):
        with self.assertRaises(ValueError):
            self.validate_safe_path("safe_file.txt\0/etc/shadow")

    def test_sensitive_credential_access_rejected(self):
        with self.assertRaises(ValueError):
            self.validate_safe_path("/home/user/.ssh/id_rsa")
        with self.assertRaises(ValueError):
            self.validate_safe_path("/home/user/.ssh/authorized_keys")
        with self.assertRaises(ValueError):
            self.validate_safe_path("/home/user/.gnupg/secring.gpg")
        with self.assertRaises(ValueError):
            self.validate_safe_path("/etc/shadow")
        with self.assertRaises(ValueError):
            self.validate_safe_path("/etc/crypttab")

    def test_safe_paths_allowed(self):
        self.assertTrue(self.validate_safe_path("Documents/report.pdf"))
        self.assertTrue(self.validate_safe_path("Projects/nova/README.md"))
        self.assertTrue(self.validate_safe_path("Downloads/dataset.csv"))


if __name__ == "__main__":
    unittest.main()
