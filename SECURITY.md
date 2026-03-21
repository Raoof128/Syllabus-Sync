# Security Policy & Vulnerability Disclosure

Security is a foundational pillar of Syllabus Sync. This document outlines our vulnerability disclosure policy and provides a high-level overview of our secure-by-design architecture.

## Supported Versions

We actively maintain and provide security patches for the following versions:

| Version | Supported | Notes                    |
| ------- | --------- | ------------------------ |
| 1.0.x   | ✅ Yes    | Active production branch |
| < 1.0   | ❌ No     | Deprecated prototypes    |

## Reporting a Vulnerability

We deeply appreciate the efforts of security researchers and our community in keeping Syllabus Sync secure.

**If you discover a security vulnerability, please DO NOT report it via public GitHub issues.**

Instead, please adhere to the following process:

1. **Email:** Report the vulnerability directly to `security@syllabus-sync.dev`.
2. **Details:** Include a clear description of the vulnerability, steps to reproduce it, and the potential impact.
3. **Response:** Our security team will acknowledge receipt of your email within 48 hours and provide an estimated timeline for resolution.
4. **Resolution:** We ask that you maintain confidentiality until we have patched the vulnerability and deployed the fix to our production environments.

We review all reports and will attempt to coordinate public disclosure with you once the issue is resolved.

## Our Secure-By-Design Philosophy

Syllabus Sync implements a defense-in-depth strategy, operating under a Zero-Trust model where every request is treated as potentially hostile until proven otherwise.

### Core Security Tenets

1. **Zero-Trust Edge:** All incoming traffic passes through Vercel Edge Middleware. This layer validates authentication JWTs, enforces IP-based rate limiting, and injects strict Content Security Policies (CSP) before any application logic is executed.
2. **Database-Level Isolation:** We do not rely solely on application-layer checks. Supabase PostgreSQL Row-Level Security (RLS) policies act as the ultimate gatekeeper, ensuring tenant isolation at the query execution level.
3. **Hardware-Backed Auth:** We prioritize strong authentication, offering FIDO2 WebAuthn (Passkeys) and hardware-backed MFA over legacy SMS or purely password-based flows.
4. **Resilient Data Protection:** All user data is encrypted at rest (AES-256) and in transit (TLS 1.3). We employ cryptographic hashing for all sensitive identifiers and strict parameter validation (Zod) on all API boundaries.

> 📚 **Auditors & Reviewers:** For a detailed breakdown of our implemented controls, threat models, and evidence matrices, please consult the [Security Posture Report](./docs/security/SECURITY_POSTURE.md) and the [Security Evidence Index](./docs/security/SECURITY_EVIDENCE_INDEX.md).
