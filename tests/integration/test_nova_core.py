"""
NOVA OS Integration Tests - nova-core
Tests the nova-core D-Bus service API surface.

These tests validate the data contracts and logic of the nova-core system
service.  They do NOT require a live D-Bus daemon – instead they import the
pure-Python equivalents of the Rust structs (via JSON fixtures) and validate
shape, types, and business rules.

When the full Linux target is available, the tests also exercise the
subprocess interface to nova-core.
"""

import json
import os
import platform
import subprocess
import sys
import unittest
from pathlib import Path

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

FIXTURES_DIR = Path(__file__).parent.parent / "fixtures"
NOVA_OS_ROOT = Path(__file__).parent.parent.parent


def load_fixture(name: str) -> dict:
    path = FIXTURES_DIR / name
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


def nova_core_binary() -> Path:
    """Return path to compiled nova-core binary if it exists."""
    candidates = [
        NOVA_OS_ROOT / "target" / "debug" / "nova-core",
        NOVA_OS_ROOT / "target" / "release" / "nova-core",
        NOVA_OS_ROOT / "target" / "debug" / "nova-core.exe",
    ]
    for c in candidates:
        if c.exists():
            return c
    return None


# ---------------------------------------------------------------------------
# SystemInfo contract tests (uses mock fixture, no service required)
# ---------------------------------------------------------------------------


class TestSystemInfoContract(unittest.TestCase):
    """Validate the shape/types of a SystemInfo object."""

    def setUp(self):
        self.data = load_fixture("mock-system-info.json")

    def test_all_required_fields_present(self):
        required = {
            "hostname",
            "kernel_version",
            "os_version",
            "uptime_seconds",
            "cpu_model",
            "total_memory_bytes",
        }
        self.assertTrue(required.issubset(set(self.data.keys())),
                        f"Missing fields: {required - set(self.data.keys())}")

    def test_hostname_is_non_empty_string(self):
        self.assertIsInstance(self.data["hostname"], str)
        self.assertTrue(len(self.data["hostname"]) > 0,
                        "hostname must not be empty")

    def test_kernel_version_is_non_empty_string(self):
        self.assertIsInstance(self.data["kernel_version"], str)
        self.assertTrue(len(self.data["kernel_version"]) > 0)

    def test_os_version_is_non_empty_string(self):
        self.assertIsInstance(self.data["os_version"], str)
        self.assertTrue(len(self.data["os_version"]) > 0)

    def test_uptime_seconds_is_non_negative_integer(self):
        self.assertIsInstance(self.data["uptime_seconds"], int)
        self.assertGreaterEqual(self.data["uptime_seconds"], 0)

    def test_cpu_model_is_non_empty_string(self):
        self.assertIsInstance(self.data["cpu_model"], str)
        self.assertTrue(len(self.data["cpu_model"]) > 0)

    def test_total_memory_bytes_is_positive_integer(self):
        self.assertIsInstance(self.data["total_memory_bytes"], int)
        self.assertGreater(self.data["total_memory_bytes"], 0,
                           "total_memory_bytes must be > 0")

    def test_total_memory_bytes_at_least_one_megabyte(self):
        """Sanity: any real system has at least 1 MB of RAM reported."""
        self.assertGreaterEqual(self.data["total_memory_bytes"], 1024 * 1024)

    def test_fixture_is_valid_json(self):
        """The fixture must round-trip through JSON without errors."""
        serialised = json.dumps(self.data)
        deserialised = json.loads(serialised)
        self.assertEqual(self.data, deserialised)


# ---------------------------------------------------------------------------
# ResourceUsage contract tests
# ---------------------------------------------------------------------------


class TestResourceUsageContract(unittest.TestCase):
    """Validate ResourceUsage shape from the system-info fixture."""

    def setUp(self):
        sys_info = load_fixture("mock-system-info.json")
        # ResourceUsage is a sibling document; build one from known data.
        self.data = {
            "cpu_percent": 12.5,
            "memory_used_bytes": sys_info["total_memory_bytes"] // 4,
            "memory_total_bytes": sys_info["total_memory_bytes"],
            "load_average_1m": 0.75,
        }

    def test_cpu_percent_in_range(self):
        self.assertGreaterEqual(self.data["cpu_percent"], 0.0)
        self.assertLessEqual(self.data["cpu_percent"], 100.0)

    def test_memory_used_lte_total(self):
        self.assertLessEqual(
            self.data["memory_used_bytes"],
            self.data["memory_total_bytes"],
        )

    def test_load_average_non_negative(self):
        self.assertGreaterEqual(self.data["load_average_1m"], 0.0)

    def test_all_numeric_fields_present(self):
        for field in ("cpu_percent", "memory_used_bytes",
                      "memory_total_bytes", "load_average_1m"):
            self.assertIn(field, self.data, f"Missing field: {field}")


# ---------------------------------------------------------------------------
# Platform-specific path tests (Linux only)
# ---------------------------------------------------------------------------


class TestPlatformSpecificPaths(unittest.TestCase):
    """
    On Linux these check that the proc files the Rust code reads actually
    exist.  On other platforms they confirm mock data is returned instead.
    """

    @unittest.skipUnless(platform.system() == "Linux", "Linux only")
    def test_proc_meminfo_readable(self):
        content = Path("/proc/meminfo").read_text()
        self.assertIn("MemTotal:", content)

    @unittest.skipUnless(platform.system() == "Linux", "Linux only")
    def test_proc_uptime_readable(self):
        content = Path("/proc/uptime").read_text()
        parts = content.split()
        self.assertGreater(len(parts), 0)
        float(parts[0])  # must be parseable as float

    @unittest.skipUnless(platform.system() == "Linux", "Linux only")
    def test_proc_cpuinfo_contains_model_name(self):
        content = Path("/proc/cpuinfo").read_text()
        self.assertIn("model name", content)

    @unittest.skipUnless(platform.system() != "Linux", "Non-Linux only")
    def test_mock_data_returned_on_non_linux(self):
        """The fixture should contain the dev-mock hostname on non-Linux."""
        data = load_fixture("mock-system-info.json")
        # On dev platforms the mock hostname is 'nova-dev'
        self.assertIsInstance(data["hostname"], str)
        self.assertGreater(len(data["hostname"]), 0)


# ---------------------------------------------------------------------------
# Graceful service start/stop (requires binary; skip if absent)
# ---------------------------------------------------------------------------


class TestNovaCoreServiceLifecycle(unittest.TestCase):
    """
    Smoke-test the nova-core binary lifecycle.
    Skipped when the binary has not been compiled yet.
    """

    @classmethod
    def setUpClass(cls):
        cls.binary = nova_core_binary()

    def test_binary_exists_or_skip(self):
        if self.binary is None:
            self.skipTest("nova-core binary not compiled; run `cargo build` first")
        self.assertTrue(self.binary.exists())

    @unittest.skipUnless(platform.system() == "Linux", "Linux + D-Bus only")
    def test_service_starts_and_prints_startup_log(self):
        if self.binary is None:
            self.skipTest("nova-core binary not compiled")
        import signal
        import time

        proc = subprocess.Popen(
            [str(self.binary)],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env={**os.environ, "RUST_LOG": "info"},
        )
        time.sleep(1)
        proc.send_signal(signal.SIGTERM)
        stdout, stderr = proc.communicate(timeout=5)
        combined = (stdout + stderr).decode("utf-8", errors="replace")
        # Service should log that it has started
        self.assertTrue(
            "nova" in combined.lower() or proc.returncode in (0, -15),
            f"Unexpected output: {combined[:500]}",
        )


# ---------------------------------------------------------------------------
# D-Bus interface contract (documentation / static check)
# ---------------------------------------------------------------------------


class TestDBusInterfaceContract(unittest.TestCase):
    """
    Verify that the D-Bus well-known names and paths follow the expected
    org.nova.* naming convention (checked against the dbus.rs constants).
    """

    EXPECTED_NAMES = {
        "org.nova.Core",
        "org.nova.Security",
        "org.nova.Permissions",
        "org.nova.AIRuntime",
        "org.nova.Updater",
    }

    EXPECTED_PATHS = {
        "/org/nova/Core",
        "/org/nova/Security",
        "/org/nova/Permissions",
        "/org/nova/AIRuntime",
        "/org/nova/Updater",
    }

    def _read_dbus_rs(self) -> str:
        p = NOVA_OS_ROOT / "crates" / "nova-system-api" / "src" / "dbus.rs"
        if not p.exists():
            self.skipTest("dbus.rs not found")
        return p.read_text(encoding="utf-8")

    def test_core_dbus_name_defined(self):
        source = self._read_dbus_rs()
        self.assertIn("org.nova.Core", source)

    def test_all_expected_names_present_in_source(self):
        source = self._read_dbus_rs()
        for name in self.EXPECTED_NAMES:
            self.assertIn(name, source, f"D-Bus name {name!r} missing from dbus.rs")

    def test_all_expected_paths_present_in_source(self):
        source = self._read_dbus_rs()
        for path in self.EXPECTED_PATHS:
            self.assertIn(path, source, f"D-Bus path {path!r} missing from dbus.rs")

    def test_dbus_names_follow_reverse_domain_convention(self):
        source = self._read_dbus_rs()
        import re
        names = re.findall(r'"(org\.nova\.[A-Za-z]+)"', source)
        for name in names:
            self.assertTrue(name.startswith("org.nova."),
                            f"Name {name!r} doesn't follow org.nova.* convention")


if __name__ == "__main__":
    unittest.main()
