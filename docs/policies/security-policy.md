# Security Vulnerability Disclosure Policy

**Responsible Disclosure Program for Security Researchers**

## 🎯 Our Commitment

At The Syllabus Sync, we take security seriously and value the work of security researchers in helping us maintain a secure platform for our users. We commit to:

- **Prompt Response:** Acknowledge receipt of reports within 48 hours
- **Transparent Communication:** Keep you informed throughout the resolution process
- **Fair Recognition:** Appropriate credit and bounties for valid findings
- **Safe Harbor:** Legal protection for good-faith security research

## 📋 What to Report

### **In-Scope Vulnerabilities**

- **Web Application:** All features and APIs at `*.syllabus-sync.dev` and `*.mq.edu.au` domains
- **Mobile Applications:** iOS and Android applications
- **Infrastructure:** Core services, databases, and APIs
- **Third-Party Services:** Dependencies and integrations we maintain
- **Authentication Systems:** Login, passkey, and session management
- **Data Protection:** Encryption, storage, and transmission

### **Vulnerability Types**

- **Authentication Bypass:** Methods to impersonate other users
- **Data Exposure:** Unauthorized access to sensitive information
- **Injection:** SQL, XSS, command injection, template injection
- **Privilege Escalation:** Gaining elevated access rights
- **Denial of Service:** Disrupting service availability
- **Cryptographic Issues:** Weak encryption or insecure implementations
- **Configuration Errors:** Exposed credentials or misconfigurations
- **Session Management:** Session fixation, hijacking, or prediction
- **Cross-Site Scripting (XSS):** Reflected, stored, or DOM-based
- **Cross-Site Request Forgery (CSRF):** Forced actions on behalf of users

### **Out-of-Scope Items**

- **Third-Party Services:** Vulnerabilities in services we don't control
- **Social Engineering:** Physical security, phishing, or user education
- **Denial of Service:** Network-level attacks against our infrastructure
- **Spam/Abuse:** Content policy violations without security implications
- **Theoretical Issues:** Vulnerabilities without demonstrated exploit

## 📧 How to Report

### **Primary Method (Encrypted)**

1. **Generate PGP Key:** Use our public key below
2. **Encrypt Report:** Include vulnerability details and proof of concept
3. **Send Email:** `security@syllabus-sync.dev`

### **Alternative Methods**

- **GitHub Security Advisory:** Create a private security advisory
- **Bug Bounty Platform:** Report through our HackerOne program
- **Direct Contact:** For urgent security issues only

### **Report Format**

```markdown
## Vulnerability Summary

Brief description of the security issue

## CVSS Score

[Optional] CVSS v3.1 score and vector

## Affected Systems

List of affected components, versions, and environments

## Proof of Concept

Detailed steps to reproduce the vulnerability
Include screenshots, videos, or code examples

## Impact Assessment

Business and technical impact of the vulnerability
Potential data exposure or system compromise

## Suggested Fix

Recommendations for remediation (if known)

## Timeline

Discovery date, report date, and any disclosure plans
```

## 🔐 PGP Public Key

```
-----BEGIN PGP PUBLIC KEY-----

[Insert your actual PGP public key here]

-----END PGP PUBLIC KEY-----
```

Fingerprint: `ABCD 1234 EFGH 5678 IJKL 9012 MNOP 3456`
Key ID: `0xABCD1234EFGH5678`

## 🏆 Bounty Program

### **Reward Tiers**

| Severity      | Bounty Range     | Examples                                         |
| ------------- | ---------------- | ------------------------------------------------ |
| Critical      | $3,000 - $10,000 | Remote code execution, full data compromise      |
| High          | $1,000 - $3,000  | Significant data exposure, authentication bypass |
| Medium        | $300 - $1,000    | Limited data exposure, privilege escalation      |
| Low           | $100 - $300      | Information disclosure, minor security issues    |
| Informational | $50 - $100       | Best practice violations, minor issues           |

### **Severity Definitions**

- **Critical:** Can compromise application security or data integrity
- **High:** Significant impact on confidentiality, integrity, or availability
- **Medium:** Limited impact, requires specific conditions or user interaction
- **Low:** Minimal security impact, minor exploitability
- **Informational:** Security best practice violations or informational findings

### **Bonus Awards**

- **Quality Reports:** Detailed, well-documented findings (+20%)
- **Chain Vulnerabilities:** Multiple related vulnerabilities (+30%)
- **Zero-Day Exploits:** Previously unknown vulnerabilities (+50%)
- **Automation:** Tools or scripts for detection (+25%)

## ⏱️ Response Timeline

### **Initial Response (Within 48 Hours)**

- Acknowledge receipt of report
- Assign tracking number and priority
- Begin initial triage and analysis
- Request additional information if needed

### **Detailed Assessment (Within 7 Days)**

- Complete vulnerability validation
- Severity classification and bounty determination
- Impact assessment and risk analysis
- Begin remediation planning

### **Resolution Timeline**

- **Critical:** 7-14 days for fix and deployment
- **High:** 14-30 days for fix and deployment
- **Medium:** 30-60 days for next release cycle
- **Low:** 60-90 days or next major version

## 🎁 Recognition Program

### **Hall of Fame**

- Public recognition on our security page
- LinkedIn recommendation (with permission)
- Conference invitations and speaking opportunities
- Priority consideration for future opportunities

### **Swag**

- Syllabus Sync security team t-shirt
- Branded security researcher hoodie
- Custom security challenge coin
- Certificate of recognition

### **Career Support**

- Referrals to security teams
- Resume review and interview preparation
- Technical skill development resources

## 📊 Disclosure Policy

### **Coordination Process**

1. **Report Receipt:** Immediate confirmation and tracking number
2. **Triage Period:** Initial validation within 48 hours
3. **Validation Phase:** Detailed analysis within 7 days
4. **Remediation:** Development and testing of fixes
5. **Disclosure:** Public disclosure after fix deployment

### **Public Disclosure**

- **Fixed Vulnerabilities:** Published within 14 days of patch deployment
- **Coordinated Disclosure:** Work with researchers on timing
- **Credit Recognition:** Public acknowledgment of researcher contribution
- **Detailed Advisories:** Technical blog posts with CVE details

### **Exception Handling**

- **Active Exploitation:** Immediate disclosure and user notification
- **Widespread Attacks:** Early public warning and mitigation guidance
- **Third-Party Issues:** Coordination with affected vendors

## 🔍 Safe Harbor

### **Legal Protection**

We commit to legal protection for security researchers who:

- Report vulnerabilities in good faith
- Don't violate applicable laws
- Don't damage systems or data
- Provide reasonable time for remediation
- Keep vulnerability details confidential

### **Research Guidelines**

- **Authorized Testing:** Only on systems you own or have explicit permission
- **Non-Destructive:** Avoid actions that could damage systems or data
- **Limited Scope:** Focus on reported vulnerability, avoid lateral movement
- **Data Privacy:** Only access data necessary for vulnerability demonstration
- **Responsible Disclosure:** Maintain confidentiality until coordinated disclosure

## 📞 Contact Information

### **Security Team**

- **Email:** `security@syllabus-sync.dev` (PGP encrypted preferred)
- **PGP Key:** Available at bottom of this policy
- **Response Time:** Within 48 hours for initial acknowledgment

### **General Inquiries**

- **Security Questions:** `security@syllabus-sync.dev`
- **Business Issues:** `contact@syllabus-sync.dev`
- **Press Inquiries:** `press@syllabus-sync.dev`

### **Emergency Contacts**

For active exploitation or critical security incidents:

- **24/7 Hotline:** `+61-2-XXXX-XXXX` (if applicable)
- **Emergency Email:** `emergency@syllabus-sync.dev`
- **Post-Mortem:** Public disclosure within 72 hours of resolution

## 📚 Resources

### **Security Tools**

- **OWASP Testing Guide:** Comprehensive web application testing methodology
- **Burp Suite:** Professional web application security testing platform
- **OWASP ZAP:** Free, open-source web application security scanner
- **Nmap:** Network discovery and security auditing tool

### **Educational Resources**

- **OWASP Top 10:** Most critical web application security risks
- **SANS Security Training:** Professional security education and certification
- **Bug Bounty Field Manual:** Guide to successful security research

---

## 🔐 Trusted Security Research Partners

We work with the following security platforms and researchers:

- **HackerOne:** Enterprise bug bounty program management
- **Bugcrowd:** Private vulnerability disclosure coordination
- **Intigriti:** Independent security research community
- **Synack:** Premium private bug bounty platform

---

**Thank you for helping keep The Syllabus Sync secure! 🛡️**

_Your responsible security research helps protect thousands of Macquarie University students._
