# Security Posture & Hardening Report

**System:** Syllabus Sync Campus Platform  
**Target Audience:** Security Architects, Compliance Auditors, Technical Reviewers

---

## 1. Executive Summary

Syllabus Sync operates on a strict **Defense-in-Depth** and **Zero-Trust** architecture. We assume the network is hostile and that application-layer logic may contain flaws. Therefore, security controls are layered hierarchically—from Edge Middleware routing constraints down to PostgreSQL Row-Level Security (RLS) execution policies.

This document catalogues the actively implemented and evidenced cybersecurity controls within the current production repository.

## 2. Threat Model (STRIDE Snapshot)

Our threat model focuses on the unique risks of a university campus platform, specifically targeting student data privacy and account integrity.

| Threat Category            | Mitigating Controls                                                                                            |
| :------------------------- | :------------------------------------------------------------------------------------------------------------- |
| **Spoofing** (Identity)    | FIDO2 WebAuthn (Passkeys), TOTP/SMS MFA, Email Verification Gates, Device Fingerprinting.                      |
| **Tampering** (Data)       | API Request Signing (HMAC), Zod Schema Validation, Database-level atomicity (Triggers).                        |
| **Repudiation**            | Centralized `audit_logs` tracking IP, User Agent, and action types for all sensitive mutations.                |
| **Information Disclosure** | Strict RLS (Tenant Isolation), Encrypted Storage (AES-256), TLS 1.3 in transit, Sanitized API error responses. |
| **Denial of Service**      | Redis-backed sliding-window Rate Limiting, IP Anomaly Detection, Edge caching.                                 |
| **Elevation of Privilege** | RPC `SECURITY DEFINER` constraints, segregated `service_role` execution, strict session token validation.      |

---

## 3. Implemented Control Catalogue

_Note: All controls listed below are fully implemented in the codebase and can be cross-referenced via the [Security Evidence Index](./SECURITY_EVIDENCE_INDEX.md)._

### 3.1 Authentication & Identity (AuthN)

- **WebAuthn / Passkeys:** Fully integrated FIDO2 passwordless authentication, backed by dedicated `webauthn_credentials` tables.
  - _Implementation Detail:_ The authenticator scope is explicitly restricted to `platform` authenticators (e.g., FaceID, TouchID, Windows Hello) via the `authenticatorAttachment` configuration. This prioritizes a frictionless, biometric user experience on mobile devices over cross-platform roaming authenticators (like YubiKeys).
- **Multi-Factor Authentication:** Support for hardware/app-based TOTP and SMS fallback, complete with secure, hashed backup code generation.
- **Session Lifecycle:** Explicit session termination logic for global sign-outs and automatic invalidation upon password resets.
- **Email Verification Gates:** Edge middleware intercepts unverified users attempting to access protected routes, eliminating incomplete-profile states.

### 3.2 Authorization & Access Control (AuthZ)

- **Row-Level Security (RLS):** Every table containing user or academic data is protected by RLS. The `auth.uid()` must match the record owner, enforcing multi-tenant isolation at the database engine level.
- **Secure RPC Execution:** Gamification and critical state mutations bypass the API layer and execute via PostgreSQL Stored Procedures. These are locked down via `SECURITY DEFINER SET search_path = public` to prevent cross-user IDOR attacks.

### 3.3 Network & Application Security (AppSec)

- **Edge Zero-Trust Middleware:** All routing, CSRF origin checking, and initial JWT validation occur at the Vercel Edge before serverless compute is invoked. To prevent upstream latency from breaking edge execution limits, proxy auth calls use a strict `6,000ms` fail-fast deadline.
- **Content Security Policy (CSP):** A highly restrictive, dynamically generated CSP (with reporting endpoints) mitigates Cross-Site Scripting (XSS).
- **Subresource Integrity (SRI):** Enforced on external CDN assets to prevent supply chain tampering.
- **API Request Validation:** Every API endpoint implements strict Zod schema parsing. Invalid payloads are rejected with 400 Bad Request before hitting business logic.

### 3.4 Resilience & Abuse Prevention

- **IP Anomaly Detection:** Real-time analysis of incoming request IPs to detect and flag suspicious login patterns or credential stuffing.
- **Password Breach Checking:** Integration with the `HaveIBeenPwned` API during signup and password resets to prevent the use of known compromised credentials.
- **Distributed Rate Limiting:** Granular, route-specific rate limiting (e.g., stricter limits on `/api/auth` vs. `/api/units`) backed by Upstash Redis. _Note: In-memory rate limiting is explicitly blocked in production to prevent bypass attacks across serverless instances._

### 3.5 Auditing & Observability

- **Centralized Audit Logging:** An `audit_logs` table (managed via secure RPCs) tracks critical events (e.g., security setting changes, failed MFA attempts), providing a tamper-evident trail for forensic analysis.
  - _PII Handling Note:_ Sensitive payload data (like passwords or API keys) is redacted via `sanitizeForAudit` prior to storage. However, to facilitate threat hunting and IP anomaly detection, the actor's IP address (`inet`) and User Agent (`text`) are currently logged in plaintext.
- **Security Headers Validation:** Automated internal tooling (`lib/security/headers-scanner.ts`) continuously verifies the presence of required headers (HSTS, X-Frame-Options, CORP/COOP).

---

## 4. Compliance & Privacy Readiness

Syllabus Sync's architecture is designed to map cleanly to standard compliance frameworks (e.g., GDPR, local university privacy policies).

- **Data Minimization:** We collect only what is necessary for academic tracking.
- **Right to Erasure:** A dedicated, cascaded deletion flow ensures all user traces (profiles, units, logs, webauthn credentials) are purged upon account deletion.
- **Transparency:** Data handling practices are explicitly documented in the [Privacy Policy](../policies/privacy-policy.md).
