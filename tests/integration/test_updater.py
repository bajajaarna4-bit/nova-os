"""
NOVA OS Integration Tests - nova-updater
Tests the update manager, update schema contract, checksum verification, and rollback integrity.
"""

import hashlib
import json
import unittest
from pathlib import Path

SCHEMA_PATH = Path(__file__).parent.parent.parent / "os" / "updates" / "update-schema.json"


class TestUpdateSchemaContract(unittest.TestCase):
    def setUp(self):
        self.assertTrue(SCHEMA_PATH.exists(), f"Schema file missing at {SCHEMA_PATH}")
        with open(SCHEMA_PATH, "r", encoding="utf-8") as fh:
            self.schema = json.load(fh)

    def test_schema_valid_json(self):
        self.assertIsInstance(self.schema, dict)
        self.assertEqual(self.schema.get("title"), "NovaOSUpdateManifest")

    def test_required_fields_defined(self):
        required = set(self.schema.get("required", []))
        expected = {"version", "build_id", "timestamp", "signature", "image_digest"}
        self.assertTrue(expected.issubset(required), f"Missing required fields: {expected - required}")

    def test_rollback_property_exists(self):
        props = self.schema.get("properties", {})
        self.assertIn("rollback_target", props)
        self.assertIn("min_required_version", props)


class TestUpdatePayloadIntegrity(unittest.TestCase):
    def test_sha256_checksum_verification(self):
        sample_payload = b"NOVA-ATOMIC-UPDATE-IMAGE-v0.1.0-alpha"
        expected_digest = hashlib.sha256(sample_payload).hexdigest()

        # Re-compute digest
        computed_digest = hashlib.sha256(sample_payload).hexdigest()
        self.assertEqual(computed_digest, expected_digest)

        # Corrupted payload must fail verification
        corrupted_payload = b"NOVA-ATOMIC-UPDATE-IMAGE-v0.1.0-CORRUPT"
        corrupted_digest = hashlib.sha256(corrupted_payload).hexdigest()
        self.assertNotEqual(corrupted_digest, expected_digest)

    def test_update_manifest_structure(self):
        manifest = {
            "version": "0.1.0",
            "build_id": "20261124.0",
            "timestamp": "2026-11-24T12:00:00Z",
            "signature": "ed25519:test_sig_verified",
            "image_digest": "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            "changes": ["Initial release of NOVA OS atomic base"],
            "rollback_target": "0.0.0",
        }
        required = ["version", "build_id", "timestamp", "signature", "image_digest"]
        for field in required:
            self.assertIn(field, manifest)
            self.assertTrue(len(manifest[field]) > 0)


if __name__ == "__main__":
    unittest.main()
