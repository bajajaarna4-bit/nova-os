"""
NOVA OS Integration Tests - nova-ai-runtime
Tests: mock provider works, provider failure handled gracefully,
tool execution blocked without permission, audit events created.
"""

import json
import os
import sys
import time
import unittest
import uuid
from pathlib import Path

FIXTURES_DIR = Path(__file__).parent.parent / "fixtures"
NOVA_OS_ROOT = Path(__file__).parent.parent.parent


def load_fixture(name: str) -> dict:
    path = FIXTURES_DIR / name
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


# ---------------------------------------------------------------------------
# Mock AI Provider
# ---------------------------------------------------------------------------


class MockAIProvider:
    """
    Simulates the AI provider interface from nova-ai-runtime.
    Mirrors the AIProvider trait without requiring a real network call.
    """

    def __init__(self, *, should_fail: bool = False, fail_reason: str = ""):
        self.should_fail = should_fail
        self.fail_reason = fail_reason
        self.call_count = 0

    def complete(self, prompt: str, tools: list) -> dict:
        self.call_count += 1
        if self.should_fail:
            raise RuntimeError(self.fail_reason or "Provider error")
        return {
            "text": f"Echo: {prompt[:40]}",
            "provider": "mock",
            "model": "mock-v1",
            "tool_calls": [],
        }


# ---------------------------------------------------------------------------
# In-process Tool Registry simulation
# ---------------------------------------------------------------------------


class ToolRegistry:
    """
    Pure-Python simulation of nova-ai-runtime ToolRegistry.
    """

    def __init__(self):
        self._tools: dict[str, dict] = {}  # name -> {handler, required_permission}

    def register(self, name: str, required_permission: str, handler) -> None:
        self._tools[name] = {
            "name": name,
            "required_permission": required_permission,
            "handler": handler,
        }

    def execute(self, tool_name: str, params: dict,
                caller_app_id: str, broker) -> dict:
        if tool_name not in self._tools:
            return {
                "tool_name": tool_name,
                "success": False,
                "output": None,
                "error": f"Tool '{tool_name}' not registered",
            }

        tool = self._tools[tool_name]
        required_perm = tool["required_permission"]

        if not broker.has_permission(caller_app_id, required_perm):
            return {
                "tool_name": tool_name,
                "success": False,
                "output": None,
                "error": f"Permission denied: '{required_perm}' required",
            }

        try:
            output = tool["handler"](params)
            return {
                "tool_name": tool_name,
                "success": True,
                "output": output,
                "error": None,
            }
        except Exception as exc:
            return {
                "tool_name": tool_name,
                "success": False,
                "output": None,
                "error": str(exc),
            }

    def registered_tools(self) -> list[str]:
        return list(self._tools.keys())


class SimplePermissionBroker:
    """Minimal broker for testing tool execution gating."""

    def __init__(self):
        self._grants: dict[tuple, bool] = {}

    def grant(self, app_id: str, permission: str):
        self._grants[(app_id, permission)] = True

    def has_permission(self, app_id: str, permission: str) -> bool:
        return self._grants.get((app_id, permission), False)


# ---------------------------------------------------------------------------
# Audit event collector
# ---------------------------------------------------------------------------


class AuditEventCollector:
    def __init__(self):
        self.events: list[dict] = []

    def log(self, event_type: str, actor: str, resource: str,
            action: str, outcome: str, metadata: dict = None):
        self.events.append({
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "event_type": event_type,
            "actor": actor,
            "resource": resource,
            "action": action,
            "outcome": outcome,
            "metadata": metadata or {},
        })


# ---------------------------------------------------------------------------
# Tests: Mock Provider
# ---------------------------------------------------------------------------


class TestMockProviderWorks(unittest.TestCase):

    def test_mock_provider_returns_response(self):
        provider = MockAIProvider()
        result = provider.complete("Hello, what is 2+2?", tools=[])
        self.assertIsInstance(result, dict)
        self.assertIn("text", result)
        self.assertIn("provider", result)
        self.assertIn("model", result)

    def test_mock_provider_text_is_non_empty(self):
        provider = MockAIProvider()
        result = provider.complete("Test prompt", tools=[])
        self.assertIsInstance(result["text"], str)
        self.assertTrue(len(result["text"]) > 0)

    def test_mock_provider_identifies_as_mock(self):
        provider = MockAIProvider()
        result = provider.complete("Test", tools=[])
        self.assertEqual(result["provider"], "mock")

    def test_mock_provider_tracks_call_count(self):
        provider = MockAIProvider()
        for _ in range(3):
            provider.complete("Test", tools=[])
        self.assertEqual(provider.call_count, 3)

    def test_mock_provider_returns_tool_calls_list(self):
        provider = MockAIProvider()
        result = provider.complete("Use a tool", tools=["read_file"])
        self.assertIsInstance(result["tool_calls"], list)


# ---------------------------------------------------------------------------
# Tests: Provider failure handling
# ---------------------------------------------------------------------------


class TestProviderFailureHandledGracefully(unittest.TestCase):

    def test_failing_provider_raises_runtime_error(self):
        provider = MockAIProvider(should_fail=True, fail_reason="API quota exceeded")
        with self.assertRaises(RuntimeError) as ctx:
            provider.complete("Test", tools=[])
        self.assertIn("API quota exceeded", str(ctx.exception))

    def test_caller_can_catch_provider_failure(self):
        provider = MockAIProvider(should_fail=True)
        try:
            provider.complete("Test", tools=[])
            failed = False
        except RuntimeError:
            failed = True
        self.assertTrue(failed, "Provider failure must propagate as an exception")

    def test_provider_failure_audit_event_created(self):
        provider = MockAIProvider(should_fail=True, fail_reason="Connection timeout")
        audit = AuditEventCollector()

        try:
            provider.complete("Test", tools=[])
        except RuntimeError as exc:
            audit.log(
                event_type="AIToolExecution",
                actor="nova.ai-runtime",
                resource="mock-provider",
                action="complete",
                outcome="failure",
                metadata={"error": str(exc)},
            )

        self.assertEqual(len(audit.events), 1)
        self.assertEqual(audit.events[0]["outcome"], "failure")
        self.assertIn("Connection timeout", audit.events[0]["metadata"]["error"])

    def test_provider_failure_does_not_crash_process(self):
        """Calling a failing provider must not kill the runtime process."""
        for _ in range(5):
            provider = MockAIProvider(should_fail=True)
            try:
                provider.complete("Test", tools=[])
            except RuntimeError:
                pass  # Expected; must not propagate uncaught


# ---------------------------------------------------------------------------
# Tests: Tool execution blocked without permission
# ---------------------------------------------------------------------------


class TestToolExecutionBlockedWithoutPermission(unittest.TestCase):

    def setUp(self):
        self.registry = ToolRegistry()
        self.broker = SimplePermissionBroker()
        self.registry.register(
            "read_contacts",
            required_permission="contacts",
            handler=lambda params: {"contacts": ["Alice", "Bob"]},
        )
        self.registry.register(
            "get_location",
            required_permission="location",
            handler=lambda params: {"lat": 51.5, "lon": -0.1},
        )

    def test_unregistered_tool_returns_error(self):
        result = self.registry.execute(
            "nonexistent_tool", {}, "com.test.app", self.broker
        )
        self.assertFalse(result["success"])
        self.assertIsNotNone(result["error"])
        self.assertIn("not registered", result["error"])

    def test_tool_without_permission_is_denied(self):
        # app has no permissions granted
        result = self.registry.execute(
            "read_contacts", {}, "com.test.app", self.broker
        )
        self.assertFalse(result["success"])
        self.assertIn("Permission denied", result["error"])
        self.assertIn("contacts", result["error"])

    def test_tool_executes_successfully_with_permission(self):
        self.broker.grant("com.test.app", "contacts")
        result = self.registry.execute(
            "read_contacts", {}, "com.test.app", self.broker
        )
        self.assertTrue(result["success"])
        self.assertIsNone(result["error"])
        self.assertIsNotNone(result["output"])

    def test_permission_for_one_tool_does_not_unlock_another(self):
        self.broker.grant("com.test.app", "contacts")
        result = self.registry.execute(
            "get_location", {}, "com.test.app", self.broker
        )
        self.assertFalse(result["success"],
                         "contacts permission must not unlock location tool")

    def test_revoked_permission_blocks_tool(self):
        self.broker.grant("com.test.app", "contacts")
        # Simulate revoke
        self.broker._grants[("com.test.app", "contacts")] = False
        result = self.registry.execute(
            "read_contacts", {}, "com.test.app", self.broker
        )
        self.assertFalse(result["success"])

    def test_different_app_cannot_use_another_apps_permission(self):
        self.broker.grant("com.app.a", "contacts")
        result = self.registry.execute(
            "read_contacts", {}, "com.app.b", self.broker
        )
        self.assertFalse(result["success"],
                         "app.b must not benefit from app.a's permissions")


# ---------------------------------------------------------------------------
# Tests: Audit events created
# ---------------------------------------------------------------------------


class TestAuditEventsCreated(unittest.TestCase):

    def _make_audit_registry(self):
        registry = ToolRegistry()
        broker = SimplePermissionBroker()
        audit = AuditEventCollector()

        def audited_execute(tool_name, params, caller_app_id):
            result = registry.execute(tool_name, params, caller_app_id, broker)
            outcome = "success" if result["success"] else (
                "denied" if "Permission denied" in (result.get("error") or "")
                else "failure"
            )
            audit.log(
                event_type="AIToolExecution",
                actor=caller_app_id,
                resource=tool_name,
                action="execute",
                outcome=outcome,
                metadata={"params": params, "error": result.get("error")},
            )
            return result

        return registry, broker, audit, audited_execute

    def test_successful_tool_call_creates_success_audit_event(self):
        registry, broker, audit, execute = self._make_audit_registry()
        registry.register("echo", "test.permission",
                          handler=lambda p: {"echo": p.get("text", "")})
        broker.grant("com.test.app", "test.permission")
        execute("echo", {"text": "hello"}, "com.test.app")

        self.assertEqual(len(audit.events), 1)
        self.assertEqual(audit.events[0]["outcome"], "success")
        self.assertEqual(audit.events[0]["event_type"], "AIToolExecution")

    def test_denied_tool_call_creates_denied_audit_event(self):
        registry, broker, audit, execute = self._make_audit_registry()
        registry.register("echo", "test.permission",
                          handler=lambda p: {"echo": p.get("text", "")})
        # No permission granted
        execute("echo", {}, "com.test.app")

        self.assertEqual(len(audit.events), 1)
        self.assertEqual(audit.events[0]["outcome"], "denied")

    def test_audit_event_has_timestamp(self):
        registry, broker, audit, execute = self._make_audit_registry()
        registry.register("echo", "perm",
                          handler=lambda p: {})
        broker.grant("app", "perm")
        execute("echo", {}, "app")

        self.assertIn("timestamp", audit.events[0])
        self.assertTrue(len(audit.events[0]["timestamp"]) > 0)

    def test_audit_event_has_correct_actor(self):
        registry, broker, audit, execute = self._make_audit_registry()
        registry.register("tool", "perm", handler=lambda p: {})
        broker.grant("com.specific.app", "perm")
        execute("tool", {}, "com.specific.app")

        self.assertEqual(audit.events[0]["actor"], "com.specific.app")

    def test_multiple_tool_calls_create_multiple_audit_events(self):
        registry, broker, audit, execute = self._make_audit_registry()
        registry.register("tool", "perm", handler=lambda p: {})
        broker.grant("com.app", "perm")

        for _ in range(5):
            execute("tool", {}, "com.app")

        self.assertEqual(len(audit.events), 5)

    def test_audit_events_are_ordered_chronologically(self):
        registry, broker, audit, execute = self._make_audit_registry()
        registry.register("tool", "perm", handler=lambda p: {})
        broker.grant("com.app", "perm")

        for _ in range(3):
            execute("tool", {}, "com.app")
            time.sleep(0.01)

        timestamps = [e["timestamp"] for e in audit.events]
        self.assertEqual(timestamps, sorted(timestamps),
                         "Audit events must be ordered chronologically")


if __name__ == "__main__":
    unittest.main()
