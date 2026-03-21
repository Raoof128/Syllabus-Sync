# Integration White Paper: University Systems & Ecosystem Interoperability

**Status:** Technical Proposal / Draft  
**Target:** University IT Services, Office of the Deputy Vice-Chancellor (Academic)  
**Version:** 1.0 (Portfolio Ready)

---

## 1. Executive Summary

Syllabus Sync is an enterprise-grade campus management platform designed to unify the student experience. While functional as a standalone tool, the platform's value increases exponentially when integrated with authoritative university data sources.

This white paper outlines the technical requirements, integration patterns, and security frameworks necessary to transition from a student-driven data model to a university-endorsed, pre-populated ecosystem.

---

## 2. Targeted Data Integrations

To eliminate data entry friction and improve academic accuracy, Syllabus Sync targets the following integration points:

### 2.1 Student Information & Timetabling (eStudent)

- **Objective:** Read-only synchronization of enrolled units and class schedules (unit code, location, building, time).
- **Interface:** RESTful API or webhook-driven JSON exports per authenticated student.
- **Impact:** Immediate platform utility upon first login, ensuring students never miss a class due to stale timetable data.

### 2.2 Learning Management Systems (iLearn / Canvas)

- **Objective:** Real-time extraction of assessment deadlines, weightings, and submission statuses.
- **Interface:** LTI (Learning Tools Interoperability) 1.3 or dedicated OAuth2-scoped API endpoints.
- **Impact:** Automated population of the "Deadlines" tracker, enabling stress-aware predictive notifications and reducing missed assessment risk.

### 2.3 Campus GIS & Infrastructure Data

- **Objective:** Official building metadata, accessibility route parameters, and indoor wayfinding nodes.
- **Interface:** GeoJSON feeds or direct integration with the University’s GIS (Geographic Information System).
- **Impact:** Enhances the high-accuracy pedestrian routing engine with official accessibility and point-of-interest data.

---

## 3. Identity & Access Management (SSO)

We propose migrating from the current internal authentication model to **Single Sign-On (SSO)** via the University’s Identity Provider (IdP).

- **Standard:** SAML 2.0 or OpenID Connect (OIDC).
- **Requirements:** Registered application client with scopes for `email`, `full_name`, and `student_id`.
- **Benefit:** Centralized account lifecycle management, enforcement of university MFA policies, and improved user trust.

---

## 4. Security & Compliance Framework

Syllabus Sync is built on a **Zero-Trust** security architecture, ready for university-level audit.

### 4.1 Data Governance

- **Residency:** All data is hosted within the Sydney AWS region (ap-southeast-2) via Supabase.
- **Encryption:** AES-256 at rest and TLS 1.3 in transit.
- **Minimization:** Only necessary academic metadata is stored; personal identifiers are restricted to the minimum required for SSO mapping.

### 4.2 Application Hardening

- **Middleware Gates:** Every request is validated at the Vercel Edge for session integrity and CSRF compliance.
- **Tenant Isolation:** Enforced via PostgreSQL Row-Level Security (RLS) at the database layer.
- **Auditability:** Centralized, tamper-evident logging of all sensitive data access and system mutations.

---

## 5. Proposed Implementation Roadmap

| Phase       | Milestone       | Focus                                                              |
| :---------- | :-------------- | :----------------------------------------------------------------- |
| **Phase 1** | Security Review | University IT audit of the security posture and RLS policies.      |
| **Phase 2** | SSO Integration | Configuration of SAML/OIDC client and university-wide login.       |
| **Phase 3** | Data Pilot      | API integration with a single faculty's timetable/assessment data. |
| **Phase 4** | Scale           | Full campus rollout with real-time LMS synchronization.            |

---

## 6. Conclusion

Syllabus Sync represents a significant leap forward in the student experience. By bridging the gap between static university databases and an intuitive, mobile-first interface, we can provide a cohesive "Campus OS" that drives engagement and academic success.

_We welcome the opportunity to discuss these technical requirements with the University IT and Security teams._
