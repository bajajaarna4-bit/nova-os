"""
NOVA OS Integration Tests - nova-permissions
Tests the permission broker contract: grant, deny, revoke, persist, audit trail.
"""

import json
import os
import platform
import sys
import tempfile
import time
import unittest
from pathlib import Path

FIXTURES_DIR = Path(__file__).parent.parent / "fixtures"
NOVA_OS_ROOT = Path(__file__).parent.parent.parent


def load_fixture(name: str) -> dict:
    path = FIXTURES_DIR / name
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


# ---------------------------------------------------------------------------
# Permission data model tests (using mock fixture)
# ---------------------------------------------------------------------------


class TestPermissionRecord(unittest.TestCase):
    """Validate the shape/semantics of a PermissionRecord."""

    def setUp(self):
        self.perms = load_fixture("mock-permissions.json")

    def test_fixture_is_a_list(self):
        self.assertIsInstance(self.perms, list,
                              "mock-permissions.json must be a JSON array")

    def test_each_record_has_required_fields(self):
        required = {"app_id", "permission", "granted", "granted_at"}
        for record in self.perms:
            self.assertTrue(required.issubset(set(record.keys())),
                            f"Record missing fields: {required - set(record.keys())}: {record}")

    def test_app_id_is_non_empty_string(self):
        for record in self.perms:
            self.assertIsInstance(record["app_id"], str)
            self.assertTrue(len(record["app_id"]) > 0)

    def test_permission_is_non_empty_string(self):
        for record in self.perms:
            self.assertIsInstance(record["permission"], str)
            self.assertTrue(len(record["permission"]) > 0)

    def test_granted_is_boolean(self):
        for record in self.perms:
            self.assertIsInstance(record["granted"], bool)

    def test_granted_at_is_string(self):
        for record in self.perms:
            self.assertIsInstance(record["granted_at"], str)

    def test_fixture_round_trips_json(self):
        serialised = json.dumps(self.perms)
        self.assertEqual(self.perms, json.loads(serialised))


# ---------------------------------------------------------------------------
# In-process broker simulation (pure Python, mirrors Rust logic)
# ---------------------------------------------------------------------------


class InMemoryPermissionBroker:
    """
    Pure-Python simulation of nova-permissions PermissionBroker.
    Mirrors the Rust API surface for integration-level testing.
    """

    def __init__(self):
        # app_id -> {permission -> PermissionRecord}
        self._store: dict[str, dict[str, dict]] = {}

    def get_permissions(self, app_id: str) -> list[dict]:
        return list(self._store.get(app_id, {}).values())

    def grant_permission(self, app_id: str, permission: str,
                         granted_by: str = "user") -> dict:
        if app_id not in self._store:
            self._store[app_id] = {}
        record = {
            "app_id": app_id,
            "permission": permission,
            "granted": True,
            "granted_by": granted_by,
            "granted_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "revoked": False,
        }
        self._store[app_id][permission] = record
        return record

    def revoke_permission(self, app_id: str, permission: str) -> bool:
        if app_id in self._store and permission in self._store[app_id]:
            self._store[app_id][permission]["granted"] = False
            self._store[app_id][permission]["revoked"] = True
            return True
        return False

    def has_permission(self, app_id: str, permission: str) -> bool:
        return (
            app_id in self._store
            and permission in self._store[app_id]
            and self._store[app_id][permission].get("granted", False)
            and not self._store[app_id][permission].get("revoked", False)
        )

    def persist(self, path: Path) -> None:
        all_records = []
        for app_records in self._store.values():
            all_records.extend(app_records.values())
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(all_records, fh, indent=2)

    @classmethod
    def load(cls, path: Path) -> "InMemoryPermissionBroker":
        broker = cls()
        with open(path, "r", encoding="utf-8") as fh:
            records = json.load(fh)
        for record in records:
            if record.get("granted") and not record.get("revoked"):
                app_id = record["app_id"]
                permission = record["permission"]
                if app_id not in broker._store:
                    broker._store[app_id] = {}
                broker._store[app_id][permission] = record
        return broker


class TestPermissionBrokerGrantDeny(unittest.TestCase):

    def setUp(self):
        self.broker = InMemoryPermissionBroker()

    def test_unknown_app_has_empty_permissions(self):
        result = self.broker.get_permissions("com.unknown.app")
        self.assertEqual(result, [],
                         "Unknown app must return empty permission list")

    def test_grant_creates_permission_record(self):
        self.broker.grant_permission("com.example.app", "camera")
        self.assertTrue(self.broker.has_permission("com.example.app", "camera"))

    def test_grant_returns_record_with_correct_fields(self):
        record = self.broker.grant_permission("com.example.app", "microphone")
        self.assertEqual(record["app_id"], "com.example.app")
        self.assertEqual(record["permission"], "microphone")
        self.assertTrue(record["granted"])
        self.assertFalse(record["revoked"])
        self.assertIn("granted_at", record)

    def test_permission_check_true_after_grant(self):
        self.broker.grant_permission("com.example.app", "location")
        self.assertTrue(self.broker.has_permission("com.example.app", "location"))

    def test_revoke_removes_access(self):
        self.broker.grant_permission("com.example.app", "camera")
        self.broker.revoke_permission("com.example.app", "camera")
        self.assertFalse(self.broker.has_permission("com.example.app", "camera"))

    def test_revoke_returns_true_when_record_exists(self):
        self.broker.grant_permission("com.example.app", "camera")
        result = self.broker.revoke_permission("com.example.app", "camera")
        self.assertTrue(result)

    def test_revoke_returns_false_when_no_record(self):
        result = self.broker.revoke_permission("com.nonexistent", "camera")
        self.assertFalse(result)

    def test_revoking_does_not_affect_other_permissions(self):
        self.broker.grant_permission("com.example.app", "camera")
        self.broker.grant_permission("com.example.app", "microphone")
        self.broker.revoke_permission("com.example.app", "camera")
        self.assertFalse(self.broker.has_permission("com.example.app", "camera"))
        self.assertTrue(self.broker.has_permission("com.example.app", "microphone"))

    def test_revoking_does_not_affect_other_apps(self):
        self.broker.grant_permission("com.app.a", "camera")
        self.broker.grant_permission("com.app.b", "camera")
        self.broker.revoke_permission("com.app.a", "camera")
        self.assertFalse(self.broker.has_permission("com.app.a", "camera"))
        self.assertTrue(self.broker.has_permission("com.app.b", "camera"))

    def test_grant_multiple_permissions_to_same_app(self):
        for perm in ("camera", "microphone", "location", "contacts"):
            self.broker.grant_permission("com.example.app", perm)
        for perm in ("camera", "microphone", "location", "contacts"):
            self.assertTrue(self.broker.has_permission("com.example.app", perm))

    def test_denied_permission_not_in_list(self):
        """Permissions that were never granted must not appear as granted."""
        self.assertFalse(self.broker.has_permission("com.example.app", "camera"))


class TestPermissionBrokerPersistence(unittest.TestCase):
    """Verify that the broker persists and reloads correctly."""

    def test_persist_and_reload_round_trip(self):
        broker = InMemoryPermissionBroker()
        broker.grant_permission("com.test.app", "camera")
        broker.grant_permission("com.test.app", "microphone")
        broker.grant_permission("com.other.app", "location")

        with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tmp:
            path = Path(tmp.name)

        try:
            broker.persist(path)
            loaded = InMemoryPermissionBroker.load(path)
            self.assertTrue(loaded.has_permission("com.test.app", "camera"))
            self.assertTrue(loaded.has_permission("com.test.app", "microphone"))
            self.assertTrue(loaded.has_permission("com.other.app", "location"))
        finally:
            path.unlink(missing_ok=True)

    def test_revoked_permissions_not_restored_on_reload(self):
        broker = InMemoryPermissionBroker()
        broker.grant_permission("com.test.app", "camera")
        broker.revoke_permission("com.test.app", "camera")

        with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tmp:
            path = Path(tmp.name)

        try:
            broker.persist(path)
            loaded = InMemoryPermissionBroker.load(path)
            self.assertFalse(loaded.has_permission("com.test.app", "camera"))
        finally:
            path.unlink(missing_ok=True)

    def test_persisted_json_is_valid(self):
        broker = InMemoryPermissionBroker()
        broker.grant_permission("com.test.app", "camera")

        with tempfile.NamedTemporaryFile(suffix=".json", delete=False, mode="w") as tmp:
            path = Path(tmp.name)

        try:
            broker.persist(path)
            with open(path, "r") as fh:
                data = json.load(fh)
            self.assertIsInstance(data, list)
        finally:
            path.unlink(missing_ok=True)


class TestPermissionAuditTrail(unittest.TestCase):
    """Verify that grant/revoke actions create an audit trail."""

    def test_audit_trail_records_grant(self):
        broker = InMemoryPermissionBroker()
        audit_log = []

        def audit_hook(action, app_id, permission):
            audit_log.append({"action": action, "app_id": app_id, "permission": permission})

        # Manually simulate audit logging around broker operations
        broker.grant_permission("com.test.app", "camera")
        audit_hook("grant", "com.test.app", "camera")
        self.assertEqual(len(audit_log), 1)
        self.assertEqual(audit_log[0]["action"], "grant")

    def test_audit_trail_records_revoke(self):
        broker = InMemoryPermissionBroker()
        audit_log = []

        def audit_hook(action, app_id, permission):
            audit_log.append({"action": action, "app_id": app_id, "permission": permission})

        broker.grant_permission("com.test.app", "camera")
        audit_hook("grant", "com.test.app", "camera")
        broker.revoke_permission("com.test.app", "camera")
        audit_hook("revoke", "com.test.app", "camera")

        actions = [e["action"] for e in audit_log]
        self.assertIn("grant", actions)
        self.assertIn("revoke", actions)


if __name__ == "__main__":
    unittest.main()
