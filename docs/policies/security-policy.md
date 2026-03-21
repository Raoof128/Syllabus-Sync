# Security Vulnerability Disclosure Policy

**Syllabus Sync -- Coordinated Disclosure Program**

---

## 1. Our Commitment

We believe that security research conducted in good faith makes the internet safer. This policy describes how to report security vulnerabilities to us, what to expect from our response, and the protections we extend to researchers.

We commit to:

- **Acknowledgment within 48 hours** of receiving a report.
- **Transparent communication** throughout triage, validation, and remediation.
- **Credit and recognition** for valid findings, unless the researcher prefers anonymity.
- **Safe harbor** for good-faith research conducted within this policy's guidelines.

---

## 2. Scope

### In-Scope

- **Web application:** All routes and features at `*.syllabus-sync.dev`
- **API surface:** All endpoints under `/api/*`
- **Authentication systems:** Password, passkey (WebAuthn), MFA (TOTP/SMS), session management
- **Authorization:** Row-Level Security policies, SECURITY DEFINER RPCs, tenant isolation
- **Client-side security:** CSP, CSRF, SRI, client storage handling
- **Infrastructure:** Deployment configuration, CI/CD pipeline, secrets management
- **Dependencies:** First-party code and directly integrated third-party libraries

### Out of Scope

- **Third-party services we do not control** (e.g., vulnerabilities in Supabase's platform, Vercel's infrastructure, or upstream library bugs not caused by our integration)
- **Social engineering** (phishing, pretexting) targeting users or team members
- **Volumetric denial-of-service** attacks against production infrastructure
- **Spam or content policy violations** without a security impact
- **Findings that require physical access** to a user's device
- **Theoretical vulnerabilities** without a demonstrable proof of concept

---

## 3. How to Report

### Primary Channel

**Email:** security@syllabus-sync.dev

If you have a PGP key and would like to encrypt your report, contact us at the address above to exchange keys.

### Alternative Channel

**GitHub Private Security Advisory:** Use the "Report a vulnerability" button on the repository's Security tab. This creates a private advisory visible only to maintainers.

### What to Include

A good report enables fast triage. Please include:

1. **Vulnerability summary** -- A concise description of the issue and the affected component.
2. **Reproduction steps** -- Detailed, step-by-step instructions to reproduce the vulnerability. Include HTTP requests, curl commands, screenshots, or video as appropriate.
3. **Affected systems** -- Component name, version, environment (production, staging, local).
4. **Impact assessment** -- What can an attacker achieve? Consider confidentiality, integrity, and availability.
5. **CVSS score** (optional) -- A CVSS 3.1 vector string if you have assessed severity.
6. **Suggested remediation** (optional) -- Recommendations for fixing the issue.

### Report Template

```
## Vulnerability Summary
[Brief description]

## Affected Component
[File path, API route, or feature area]

## Reproduction Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Impact
[What data is exposed, what actions can be performed, what is the blast radius]

## CVSS Vector (optional)
[CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N]

## Suggested Fix (optional)
[Your recommendation]
```

---

## 4. Response Process

### Timeline

| Phase              | Duration            | Actions                                                |
| ------------------ | ------------------- | ------------------------------------------------------ |
| **Acknowledgment** | Within 48 hours     | Confirm receipt, assign tracking ID, begin triage      |
| **Triage**         | Within 7 days       | Validate the finding, classify severity, assess impact |
| **Remediation**    | Severity-dependent  | Develop, test, and deploy fix                          |
| **Disclosure**     | 14 days after patch | Coordinate public disclosure with the researcher       |

### Severity-Based Remediation Targets

| Severity     | Target Resolution | Examples                                                                                       |
| ------------ | ----------------- | ---------------------------------------------------------------------------------------------- |
| **Critical** | 7 days            | Authentication bypass, RLS policy circumvention, remote code execution, full data exfiltration |
| **High**     | 14 days           | Significant data exposure, privilege escalation, session hijacking                             |
| **Medium**   | 30 days           | Limited data exposure requiring specific preconditions, stored XSS with limited scope          |
| **Low**      | 60 days           | Information disclosure with minimal impact, minor configuration issues                         |

### Severity Classification

We use CVSS 3.1 as a starting point and adjust based on the specific context of our application:

- **Critical (CVSS 9.0-10.0):** Can compromise application security, tenant isolation, or data integrity for multiple users.
- **High (CVSS 7.0-8.9):** Significant impact on confidentiality, integrity, or availability for individual users or limited scope.
- **Medium (CVSS 4.0-6.9):** Limited impact, requires specific conditions, user interaction, or authenticated access.
- **Low (CVSS 0.1-3.9):** Minimal security impact, defense-in-depth improvement, or informational finding.

---

## 5. Safe Harbor

### Legal Protection

We will not initiate legal action against researchers who:

- Discover and report vulnerabilities in accordance with this policy.
- Avoid actions that could harm users, disrupt services, or destroy data.
- Do not access data beyond what is necessary to demonstrate the vulnerability.
- Provide reasonable time for remediation before any public disclosure.
- Keep vulnerability details confidential until coordinated disclosure.

This commitment is consistent with the [disclose.io](https://disclose.io) Safe Harbor framework.

### Research Guidelines

To stay within the scope of this policy:

- **Test only against accounts you own.** Do not access, modify, or delete data belonging to other users.
- **Avoid destructive actions.** Do not degrade service availability or corrupt data.
- **Minimize data access.** If you discover a data exposure vulnerability, access only the minimum data needed to prove the issue exists. Do not exfiltrate, copy, or store exposed data.
- **Do not pivot.** If you discover access to one system, do not use it to probe other systems.
- **Stop and report.** If you accidentally access sensitive data, stop immediately and report the finding.

---

## 6. Disclosure Coordination

### Our Process

1. **Researcher reports vulnerability** through a channel defined in Section 3.
2. **We acknowledge receipt** within 48 hours and assign a tracking ID.
3. **We validate and classify** the finding within 7 days. We share our assessment with the researcher.
4. **We develop and test a fix.** The researcher may be consulted for validation.
5. **We deploy the fix** to production.
6. **We coordinate public disclosure** with the researcher within 14 days of patch deployment.

### Public Disclosure

- We publish a security advisory describing the vulnerability, its impact, and the fix.
- The researcher receives credit by name (or pseudonym) unless they request anonymity.
- We assign a CVE identifier when appropriate.

### Exceptions

- **Active exploitation:** If we detect that a vulnerability is being actively exploited, we may deploy an emergency fix and issue a public advisory before the standard coordination timeline.
- **Third-party involvement:** If the vulnerability affects a third-party dependency, we coordinate with the upstream maintainer and may adjust the disclosure timeline accordingly.

---

## 7. Recognition

We recognize researchers who report valid vulnerabilities:

- **Public acknowledgment** in our security advisories and documentation.
- **LinkedIn recommendation** for significant findings (with the researcher's permission).
- **Certificate of recognition** for validated reports.

We do not currently operate a paid bug bounty program. If this changes, the details will be published in this policy.

---

## 8. What We Ask of You

- **Report promptly.** The sooner we know about a vulnerability, the sooner we can protect users.
- **Provide detail.** Clear reproduction steps dramatically reduce triage time.
- **Be patient.** Some fixes require careful testing to avoid regressions. We will keep you informed.
- **Coordinate disclosure.** Please do not publish vulnerability details until we have confirmed that the fix is deployed.

---

## 9. Contact

| Channel                  | Address                    | Use Case                                     |
| ------------------------ | -------------------------- | -------------------------------------------- |
| Security reports         | security@syllabus-sync.dev | Vulnerability reports and security questions |
| GitHub Security Advisory | Repository Security tab    | Alternative reporting channel                |
| General inquiries        | contact@syllabus-sync.dev  | Non-security questions                       |

---

## 10. References

- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/) -- Methodology for web application security testing
- [OWASP Top 10 (2021)](https://owasp.org/www-project-top-ten/) -- Most critical web application security risks
- [NIST 800-53 Rev. 5](https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final) -- Security and privacy controls catalog
- [disclose.io](https://disclose.io) -- Safe Harbor framework for vulnerability disclosure
- [RFC 9116](https://www.rfc-editor.org/rfc/rfc9116) -- security.txt specification
- [CVSS 3.1 Calculator](https://www.first.org/cvss/calculator/3.1) -- Severity scoring

---

_This policy is effective as of 2026-03-21 and will be reviewed quarterly._
