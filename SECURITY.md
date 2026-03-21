# Security Policy

**Syllabus Sync -- Coordinated Vulnerability Disclosure**

---

## Scope

This policy covers the Syllabus Sync web application, its API surface (`/api/*`), database layer (Supabase PostgreSQL), edge middleware, and all first-party client code deployed to production.

## Supported Versions

| Version | Status | Security Support     |
| ------- | ------ | -------------------- |
| 1.0.x   | Active | Patch and advisory   |
| < 1.0   | EOL    | No longer maintained |

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.** Public disclosure of an unpatched vulnerability puts users at risk.

### Preferred Channel

Email **security@syllabus-sync.dev** with:

1. **Description** -- What the vulnerability is and which component it affects.
2. **Reproduction steps** -- A minimal, reliable proof-of-concept. Include HTTP requests, screenshots, or code as appropriate.
3. **Impact assessment** -- Your best estimate of severity (consider confidentiality, integrity, availability). A CVSS 3.1 vector is helpful but not required.
4. **Suggested remediation** -- If you have one.

### Alternative Channel

Use GitHub's **Private Security Advisory** feature on this repository to submit findings directly through the GitHub interface.

### What to Expect

| Stage          | Timeline                       | What Happens                                                                              |
| -------------- | ------------------------------ | ----------------------------------------------------------------------------------------- |
| Acknowledgment | Within 48 hours                | We confirm receipt and assign a tracking identifier.                                      |
| Triage         | Within 7 days                  | We validate the finding, assign a severity, and share our assessment with you.            |
| Remediation    | Severity-dependent (see below) | We develop and test a fix.                                                                |
| Disclosure     | 14 days after patch deployment | We coordinate public disclosure with you. You receive credit unless you prefer anonymity. |

**Target remediation windows:**

- Critical / High: 7-14 days
- Medium: 30 days
- Low / Informational: Next scheduled release

### Safe Harbor

We will not pursue legal action against researchers who:

- Act in good faith and comply with this policy.
- Avoid privacy violations, data destruction, and service disruption.
- Report findings exclusively through the channels above.
- Allow reasonable time for remediation before any disclosure.

This commitment aligns with the [disclose.io](https://disclose.io) Safe Harbor framework.

## Security Architecture Overview

Syllabus Sync implements a **defense-in-depth** strategy grounded in **Zero Trust** principles. No single control is treated as sufficient; security is enforced at every layer of the stack.

### Layer Model

```
                     Internet
                        |
            +-----------+-----------+
            |   Vercel Edge Network  |
            |   (TLS 1.3 termination)|
            +-----------+-----------+
                        |
            +-----------+-----------+
            | Edge Middleware (proxy) |  <-- JWT validation, CSP injection,
            | lib/proxy.ts           |      CSRF enforcement, rate limiting
            +-----------+-----------+
                        |
            +-----------+-----------+
            |  Next.js API Routes    |  <-- Zod schema validation, HMAC
            |  app/api/*             |      request signing, audit logging
            +-----------+-----------+
                        |
            +-----------+-----------+
            |  Supabase PostgreSQL   |  <-- Row-Level Security (RLS),
            |  + Auth (GoTrue)       |      SECURITY DEFINER RPCs,
            |                        |      encrypted storage (AES-256)
            +------------------------+
```

### Key Controls

| Domain               | Control                                                                                                   | Why It Matters                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Identity**         | FIDO2 WebAuthn (Passkeys), TOTP MFA, email verification gates                                             | Phishing-resistant authentication eliminates the largest class of account takeover attacks (OWASP A07:2021).                                          |
| **Tenant Isolation** | PostgreSQL Row-Level Security on every user-data table                                                    | Authorization is enforced by the database engine, not application code. A bug in a route handler cannot leak another tenant's data (NIST AC-3, AC-4). |
| **Transport**        | TLS 1.3, nonce-based CSP, SRI on CDN assets, `__Host-` CSRF cookies                                       | Defense against XSS, supply-chain tampering, and request forgery (OWASP A03:2021).                                                                    |
| **Abuse Prevention** | Distributed sliding-window rate limiting (Upstash Redis), IP anomaly detection, HIBP credential screening | Mitigates credential stuffing, brute-force, and denial-of-service vectors. Security-critical limiters fail closed.                                    |
| **Observability**    | Centralized `audit_logs` table with IP, user-agent, action type, and severity                             | Tamper-evident audit trail for incident response and forensic analysis (NIST AU-2, AU-3).                                                             |

### Further Reading

- [Security Posture Report](./docs/security/SECURITY_POSTURE.md) -- Threat model (STRIDE), full control catalogue, and compliance mapping.
- [Security Evidence Index](./docs/security/SECURITY_EVIDENCE_INDEX.md) -- File-level evidence matrix for auditors.
- [Privacy Policy](./docs/policies/privacy-policy.md) -- Data inventory, retention, and third-party processors.
- [Security Disclosure Policy](./docs/policies/security-policy.md) -- Extended responsible-disclosure program details.
