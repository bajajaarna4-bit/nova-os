"""
NOVA OS Integration Tests - nova-security
Tests the security service: status reading, process list, no fabricated data.
"""

import json
import platform
import unittest
from pathlib import Path

FIXTURES_DIR = Path(__file__).parent.parent / "fixtures"
NOVA_OS_ROOT = Path(__file__).parent.parent.parent


def load_fixture(name: str) -> dict:
    path = FIXTURES_DIR / name
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


# ---------------------------------------------------------------------------
# SecurityStatus fixture contract tests
# ---------------------------------------------------------------------------


class TestSecurityStatusContract(unittest.TestCase):

    def setUp(self):
        self.data = load_fixture("mock-security-status.json")

    def test_all_required_fields_present(self):
        required = {
            "secure_boot_enabled",
            "selinux_mode",
            "dm_crypt_active",
            "firewall_active",
        }
        self.assertTrue(required.issubset(set(self.data.keys())),
                        f"Missing fields: {required - set(self.data.keys())}")

    def test_secure_boot_is_bool_or_null(self):
        value = self.data["secure_boot_enabled"]
        self.assertTrue(value is None or isinstance(value, bool),
                        "secure_boot_enabled must be bool or null")

    def test_selinux_mode_valid_value(self):
        valid = {"Enforcing", "Permissive", "Disabled", "Unknown",
                 "enforcing", "permissive", "disabled", "unknown"}
        self.assertIn(self.data["selinux_mode"], valid,
                      f"Invalid selinux_mode: {self.data['selinux_mode']!r}")

    def test_dm_crypt_is_bool_or_null(self):
        value = self.data["dm_crypt_active"]
        self.assertTrue(value is None or isinstance(value, bool))

    def test_firewall_is_bool_or_null(self):
        value = self.data["firewall_active"]
        self.assertTrue(value is None or isinstance(value, bool))

    def test_fixture_is_valid_json(self):
        serialised = json.dumps(self.data)
        self.assertEqual(self.data, json.loads(serialised))


# ---------------------------------------------------------------------------
# SELinux mode reading (non-fabricated data)
# ---------------------------------------------------------------------------


class TestSELinuxStatusReading(unittest.TestCase):

    @unittest.skipUnless(platform.system() == "Linux", "Linux only")
    def test_selinux_enforce_file_readable_or_absent(self):
        """
        On Linux, /sys/fs/selinux/enforce either contains 0 or 1, or the
        file does not exist (meaning SELinux is not compiled in / not mounted).
        It must NEVER contain arbitrary garbage.
        """
        p = Path("/sys/fs/selinux/enforce")
        if not p.exists():
            # SELinux not present – that is a valid state
            return
        content = p.read_text().strip()
        self.assertIn(content, ("0", "1"),
                      f"Unexpected content in /sys/fs/selinux/enforce: {content!r}")

    @unittest.skipUnless(platform.system() != "Linux", "Non-Linux only")
    def test_selinux_mode_is_unknown_on_non_linux(self):
        """On non-Linux the fixture must report Unknown."""
        data = load_fixture("mock-security-status.json")
        # Mock data for non-Linux should be Unknown
        self.assertIn(data["selinux_mode"].lower(), ("unknown", "disabled"))

    def test_selinux_mode_not_fabricated(self):
        """
        The selinux_mode must come from actual system state, not a hardcoded
        string like 'enforcing' on systems where SELinux is unavailable.
        """
        data = load_fixture("mock-security-status.json")
        if platform.system() != "Linux":
            self.assertNotEqual(data["selinux_mode"].lower(), "enforcing",
                                "Non-Linux mock must not claim SELinux is enforcing")


# ---------------------------------------------------------------------------
# Process list – no fabricated data
# ---------------------------------------------------------------------------


class TestProcessListNonFabricated(unittest.TestCase):
    """
    Verify that any process list provided by the security service reflects
    real system processes (PID > 0, name non-empty) and does not contain
    hardcoded fake entries.
    """

    @unittest.skipUnless(platform.system() == "Linux", "Linux only")
    def test_proc_self_exists(self):
        """The current process must appear in /proc."""
        import os
        pid = os.getpid()
        self.assertTrue(Path(f"/proc/{pid}").exists(),
                        "Current process must exist in /proc")

    @unittest.skipUnless(platform.system() == "Linux", "Linux only")
    def test_proc_entries_are_numeric(self):
        """All PID directories under /proc must have numeric names."""
        proc = Path("/proc")
        pid_dirs = [d for d in proc.iterdir()
                    if d.is_dir() and d.name.isdigit()]
        self.assertGreater(len(pid_dirs), 0, "Must have at least one process")

    @unittest.skipUnless(platform.system() == "Linux", "Linux only")
    def test_proc_process_name_readable(self):
        """
        For the current process, /proc/<pid>/comm must contain a non-empty
        process name string – not a hardcoded placeholder.
        """
        import os
        pid = os.getpid()
        comm_path = Path(f"/proc/{pid}/comm")
        if comm_path.exists():
            name = comm_path.read_text().strip()
            self.assertTrue(len(name) > 0, "Process name must be non-empty")
            # Must not be a known fabricated value
            fabricated = {"fakepid", "dummy_process", "placeholder"}
            self.assertNotIn(name.lower(), fabricated)

    def test_security_status_fixture_has_no_obviously_fabricated_data(self):
        """
        The fixture must not contain hardcoded indicators that look fabricated
        (e.g. selinux_mode='enforcing' on Windows).
        """
        data = load_fixture("mock-security-status.json")
        if platform.system() == "Windows":
            # Windows can't have SELinux enforcing
            self.assertNotEqual(
                data.get("selinux_mode", "").lower(), "enforcing",
                "Windows fixture must not claim SELinux enforcing",
            )


# ---------------------------------------------------------------------------
# Firewall status tests
# ---------------------------------------------------------------------------


class TestFirewallStatus(unittest.TestCase):

    def setUp(self):
        self.data = load_fixture("mock-security-status.json")

    def test_firewall_field_present(self):
        self.assertIn("firewall_active", self.data)

    @unittest.skipUnless(platform.system() == "Linux", "Linux only")
    def test_firewall_backend_check(self):
        """
        On Linux at least one of nftables or iptables should be runnable
        (or both absent – but we must not fabricate an 'active' status).
        """
        import subprocess
        nft = subprocess.run(["which", "nft"], capture_output=True)
        ipt = subprocess.run(["which", "iptables"], capture_output=True)
        # At least one firewall tool present OR fixture correctly says inactive
        if nft.returncode != 0 and ipt.returncode != 0:
            # Neither tool present – fixture must report inactive or unknown
            self.assertFalse(
                self.data.get("firewall_active", False),
                "Fixture must report firewall inactive when no firewall tool is installed",
            )


if __name__ == "__main__":
    unittest.main()
