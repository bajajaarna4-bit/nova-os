# Contributing to NOVA OS

Thank you for your interest in contributing to NOVA OS.

## Development Workflow
1. Fork or branch from `main`.
2. Ensure all changes adhere to least-privilege security principles.
3. Add corresponding automated tests for any new system features.
4. Run formatting and linting:
   - `cargo fmt --all -- --check`
   - `cargo clippy --workspace`
5. Run tests:
   - `python -m unittest discover -s tests/integration -p "test_*.py" -v`

## Core Principles
- **No decorative features**: Every UI button or API endpoint must correspond to real system functionality or explicitly communicate future status.
- **Security-First**: Never lower SELinux or sandbox restrictions for convenience.
- **Honest reporting**: Never fabricate system health, security scores, or hardware states.
