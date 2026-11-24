# NOVA OS Verification & Testing Strategy

## Overview
NOVA OS enforces verification at every layer of the architecture, from Rust unit logic to end-to-end user workflows.

## Test Matrix

### 1. Unit & Subsystem Tests (Rust)
All crates under `crates/` contain module-level unit tests validating:
- Type serialization and D-Bus interfaces
- Permission broker grant, persistence, and revocation
- Allowlisted tool dispatch in `nova-ai-runtime`
- Audit log append-only immutability

Run command:
```bash
cargo test --workspace
```

### 2. Integration Tests (Python)
Automated tests in `tests/integration/` validate cross-service contracts, mock fixtures, and security invariants:
- `test_nova_core.py`: Validates system metrics and interface contracts.
- `test_permissions.py`: Validates permission broker behavior and persistence.
- `test_security.py`: Validates honest status reporting and absence of fabricated security scores.
- `test_ai_runtime.py`: Validates allowlist enforcement and graceful fallback upon provider failure.

Run command:
```bash
python -m unittest discover -s tests/integration -p "test_*.py" -v
```

### 3. Desktop Component Tests
Web component tests in `desktop/shell/` ensure UI state updates and keyboard handling function correctly.

Run command:
```bash
cd desktop/shell && pnpm test
```
