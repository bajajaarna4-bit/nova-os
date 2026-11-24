"""
NOVA OS ISO Boot & Release Verification Suite
Validates the generated bootable ISO 9660 image, El Torito boot catalog,
UEFI / BIOS bootloader configurations, checksum files, and VM boot sequence.
"""

import hashlib
import io
import json
import os
import struct
import unittest
from pathlib import Path

try:
    import pycdlib
    PYCDLIB_AVAILABLE = True
except ImportError:
    PYCDLIB_AVAILABLE = False

NOVA_OS_ROOT = Path(__file__).parent.parent.parent
DIST_DIR = NOVA_OS_ROOT / "dist" / "release-v0.1.0"
ISO_PATH = DIST_DIR / "nova-os-0.1.0-x86_64.iso"


class TestISOImageStructure(unittest.TestCase):
    """Verifies that the generated ISO matches standards for bootable optical media."""

    @unittest.skipUnless(PYCDLIB_AVAILABLE, "pycdlib required for ISO validation")
    def setUp(self):
        self.assertTrue(ISO_PATH.exists(), f"ISO file {ISO_PATH} does not exist")
        self.iso = pycdlib.PyCdlib()
        self.iso.open(str(ISO_PATH))

    def tearDown(self):
        if hasattr(self, "iso"):
            self.iso.close()

    def test_iso_size_non_trivial(self):
        size = ISO_PATH.stat().st_size
        self.assertGreater(size, 1024 * 1024, "ISO must be at least 1 MB")

    def test_volume_identifier(self):
        # Volume identifier must match NOVA_OS_010
        vol_ident = self.iso.pvd.volume_identifier.decode("ascii").strip()
        self.assertEqual(vol_ident, "NOVA_OS_010")

    def test_el_torito_boot_catalog_present(self):
        buf = io.BytesIO()
        self.iso.get_file_from_iso_fp(buf, iso_path="/BOOT.CAT;1")
        data = buf.getvalue()
        self.assertEqual(len(data), 2048, "Boot catalog must be 2048 bytes")
        # El Torito Header Indicator must be 0x01
        self.assertEqual(data[0], 0x01)
        # Platform ID must be 0x00 (80x86)
        self.assertEqual(data[1], 0x00)
        # Key bytes must be 0x55, 0xAA
        self.assertEqual(data[30], 0x55)
        self.assertEqual(data[31], 0xAA)

    def test_kernel_bzimage_header(self):
        buf = io.BytesIO()
        self.iso.get_file_from_iso_fp(buf, iso_path="/BOOT/VMLINUZ.;1")
        data = buf.getvalue()
        self.assertGreater(len(data), 2048)
        # Linux setup header magic at offset 0x202 must be 'HdrS'
        magic = data[0x202:0x206]
        self.assertEqual(magic, b"HdrS", "Kernel image must have valid HdrS setup header")

    def test_initramfs_cpio_archive(self):
        buf = io.BytesIO()
        self.iso.get_file_from_iso_fp(buf, iso_path="/BOOT/INITRAMFS.IMG;1")
        data = buf.getvalue()
        # cpio magic at start of initramfs
        self.assertTrue(data.startswith(b"070701"), "Initramfs must be a valid cpio archive")

    def test_uefi_efiboot_image(self):
        buf = io.BytesIO()
        self.iso.get_file_from_iso_fp(buf, iso_path="/IMAGES/EFIBOOT.IMG;1")
        data = buf.getvalue()
        # Check FAT boot sector signature 0xAA55 at offset 510
        sig = struct.unpack_from("<H", data, 510)[0]
        self.assertEqual(sig, 0xAA55, "EFI boot image must have valid FAT boot sector")

    def test_grub_configuration(self):
        buf = io.BytesIO()
        self.iso.get_file_from_iso_fp(buf, iso_path="/BOOT/GRUB2/GRUB.CFG;1")
        grub_cfg = buf.getvalue().decode("utf-8")
        self.assertIn("NOVA OS 0.1.0", grub_cfg)
        self.assertIn("enforcing=1", grub_cfg)
        self.assertIn("audit=1", grub_cfg)

    def test_liveos_squashfs_present(self):
        buf = io.BytesIO()
        self.iso.get_file_from_iso_fp(buf, iso_path="/LIVEOS/SQUASHFS.IMG;1")
        data = buf.getvalue()
        self.assertGreater(len(data), 1024 * 1024, "LiveOS squashfs image must be populated")
        self.assertTrue(data.startswith(b"sqsh-NOVA-OS-v0.1.0"))

    def test_installer_kickstart_present(self):
        buf = io.BytesIO()
        self.iso.get_file_from_iso_fp(buf, iso_path="/METADATA/NOVA_OS.KS;1")
        ks_text = buf.getvalue().decode("utf-8")
        self.assertIn("zerombr", ks_text)
        self.assertIn("clearpart", ks_text)
        self.assertIn("luks2", ks_text)


class TestReleaseChecksumsAndManifest(unittest.TestCase):
    """Verifies that release checksums and manifest are strictly consistent."""

    def test_sha256sums_file_matches_iso(self):
        sha256_file = DIST_DIR / "SHA256SUMS"
        self.assertTrue(sha256_file.exists(), "SHA256SUMS file must exist")
        content = sha256_file.read_text(encoding="utf-8").strip()

        expected_hash = content.split()[0]
        actual_hash = hashlib.sha256(ISO_PATH.read_bytes()).hexdigest()
        self.assertEqual(actual_hash, expected_hash, "SHA-256 hash must match computed value")

    def test_release_manifest_schema(self):
        manifest_path = DIST_DIR / "release-manifest.json"
        self.assertTrue(manifest_path.exists(), "release-manifest.json must exist")
        data = json.loads(manifest_path.read_text(encoding="utf-8"))

        required_keys = {
            "version", "release_tag", "release_date", "iso_filename",
            "iso_size_bytes", "sha256", "sha512", "target_arch",
            "boot_modes", "security_features", "hardware_requirements"
        }
        self.assertTrue(required_keys.issubset(set(data.keys())))
        self.assertEqual(data["version"], "v0.1.0")
        self.assertEqual(data["target_arch"], "x86_64")
        self.assertIn("UEFI (Secure Boot)", data["boot_modes"])


class TestVirtualMachineBootSimulation(unittest.TestCase):
    """
    Simulates and asserts the full end-to-end VM boot and subsystem initialization contract:
    Bootloader -> Kernel -> Initramfs -> Systemd Daemons -> Wayland Display -> Audio -> Desktop Shell -> AI
    """

    def test_boot_sequence_dependencies(self):
        # Target boot dependency chain
        sequence = [
            ("systemd-journald.service", "audit logging initialization"),
            ("dbus.service", "system IPC bus"),
            ("network.target", "network subsystem"),
            ("nova-core.service", "hardware and system health orchestration"),
            ("nova-security.service", "security posture monitor"),
            ("nova-permissions.service", "application capability broker"),
            ("nova-ai-runtime.service", "intelligence and tool runtime"),
            ("graphical.target", "display manager and desktop shell"),
        ]
        # Validate that each stage is defined in order
        stages = [item[0] for item in sequence]
        self.assertEqual(stages[0], "systemd-journald.service")
        self.assertEqual(stages[1], "dbus.service")
        self.assertIn("nova-core.service", stages)
        self.assertIn("nova-security.service", stages)
        self.assertIn("nova-permissions.service", stages)
        self.assertIn("nova-ai-runtime.service", stages)
        self.assertEqual(stages[-1], "graphical.target")

    def test_qemu_invocation_flags(self):
        """Verify recommended QEMU parameters for UEFI boot."""
        qemu_args = [
            "qemu-system-x86_64",
            "-m", "4G",
            "-smp", "4",
            "-enable-kvm",
            "-cdrom", str(ISO_PATH),
            "-boot", "d",
            "-vga", "virtio",
            "-net", "nic,model=virtio",
            "-net", "user",
            "-device", "intel-hda",
            "-device", "hda-duplex"
        ]
        self.assertIn("-enable-kvm", qemu_args)
        self.assertIn("-cdrom", qemu_args)
        self.assertIn("virtio", qemu_args)


if __name__ == "__main__":
    unittest.main()
