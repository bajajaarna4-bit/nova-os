# Security Policy

## Supported Versions

NOVA OS is currently in pre-release (development preview). Only the latest
commit on the `main` branch receives security fixes. No stable releases exist
yet; this table will expand as versioned releases are made.

| Version | Supported |
|---------|-----------|
| `main` (HEAD) | ✅ Yes — active development |
| `0.1.0` | ⚠️ Best-effort only (pre-release) |

## Reporting a Vulnerability

**DO NOT create a public GitHub issue for security vulnerabilities.**

Publicly disclosing a vulnerability before a fix is available puts all users at
risk. Please follow responsible disclosure.

### Contact

| Channel | Address |
|---------|---------|
| **Security email** | `security@nova-os.dev` *(placeholder — configure before public release)* |
| **GPG key fingerprint** | *(to be published before first stable release)* |
| **GitHub private advisory** | Use [GitHub Security Advisories](https://github.com/nova-os/nova-os/security/advisories/new) |

### Response Timeline

| Milestone | Target |
|-----------|--------|
| Initial acknowledgment | 72 hours |
| Triage and severity assessment | 7 days |
| Fix development begins | Based on severity (see below) |
| Fix released / advisory published | Coordinated with reporter |

### Severity Response Times

| Severity | CVSS Range | Fix Target |
|----------|-----------|------------|
| Critical | 9.0–10.0 | 48 hours from triage |
| High | 7.0–8.9 | 7 days from triage |
| Medium | 4.0–6.9 | 30 days from triage |
| Low | 0.1–3.9 | 90 days / next minor release |
| Informational | N/A | Best effort |

## Disclosure Policy

We follow a **coordinated disclosure** model:

1. Reporter submits vulnerability details privately.
2. NOVA OS team acknowledges within 72 hours.
3. Team triages and assigns a severity within 7 days.
4. Fix is developed, reviewed, and tested.
5. Advisory draft shared with reporter for review.
6. Fix released and public advisory published simultaneously.
7. Reporter credited in the advisory (unless anonymity is requested).

The standard embargo period is **90 days** from initial report. We may request
an extension with the reporter's agreement if the fix is complex. We will
never ask for more than 120 days without exceptional justification.

## In-Scope Areas

The following are in scope for security reports:

- **NOVA Core D-Bus service** — privilege escalation, authentication bypass
- **NOVA Permissions broker** — policy bypass, unauthorized permission grant
- **NOVA AI Runtime** — prompt injection leading to system access, data exfiltration
- **NOVA Audit logger** — log tampering, deletion without authorization
- **NOVA Security Monitor** — bypass of detection, false negative injection
- **Desktop shell** — sandbox escape, unauthorized capability acquisition
- **SELinux policy** — domain transition exploits, type enforcement bypass
- **Polkit policies** — privilege escalation via policy logic flaws
- **Build / supply chain** — compromised dependencies, build reproducibility
- **Website** — XSS, CSP bypass (medium or higher impact only)

## Out of Scope

- Vulnerabilities in upstream Linux kernel, Fedora, or Flatpak (report those upstream)
- Denial of service requiring physical access
- Social engineering of NOVA OS team members
- Security of end-user applications running inside Flatpak sandboxes
- Theoretical attacks with no demonstrated exploitability

## Security Architecture

For the full security architecture, see [`docs/SECURITY.md`](docs/SECURITY.md).

Key design decisions:

- **SELinux enforcing** — Mandatory Access Control on all NOVA services
- **seccomp BPF** — System call filtering on every service
- **Linux namespaces** — PID, mount, network, IPC isolation per service
- **Polkit** — Fine-grained D-Bus method authorization
- **Principle of least privilege** — No capabilities by default; added only where required
- **Audit logging** — Every security-relevant event logged to tamper-evident store
- **Local-first AI** — No data leaves the device without explicit user consent

## Bug Bounty

There is no formal bug bounty program at this time. We will recognize
responsible disclosures in release notes and security advisories.

---

*This policy applies to the NOVA OS project maintained at*
*https://github.com/nova-os/nova-os. Last updated: 2026-11-24.*
