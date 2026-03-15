# Syllabus Sync — University Integration & Security Requirements (Draft)

**Version:** 0.1 (Draft)
**Date:** 15 March 2026
**Prepared by:** Syllabus Sync Development Team
**For:** Macquarie University IT Services / Office of the Deputy Vice-Chancellor (Academic)

---

## 1. Purpose

Syllabus Sync is a student-built mobile-first web application that helps Macquarie University students manage their academic schedules, track deadlines, discover campus events, and navigate the campus map — all in one place. The app is designed around the student lifecycle at MQ and is being prepared for a public launch at **Open Day in August 2026**.

This document outlines what the development team needs from the University to move from a working prototype to a production-quality, university-endorsed application. The goal is to identify the systems, access, and approvals required — and to start those conversations early enough to meet the August timeline.

---

## 2. Required University Systems & APIs

The following integrations would allow Syllabus Sync to display live, accurate data instead of manually entered information.

### 2.1 Timetable / eStudent Data

**What we need:** Read-only access to a student's enrolled units and their class schedule (unit code, name, day/time, room, building).

**Why:** Currently students must manually add their units and class times. If we could pull this from eStudent or the timetable system, the app would be pre-populated on first login — significantly reducing friction and improving accuracy.

**Ideal format:** REST API or structured data export (JSON/CSV) per authenticated student.

### 2.2 iLearn / Assessment Data

**What we need:** Read-only access to upcoming assessment dates, types, and weightings for enrolled units.

**Why:** Deadline tracking is a core feature. Auto-importing assessment dates from iLearn would mean students always have up-to-date deadlines without manual entry, and would reduce the risk of missed submissions.

**Ideal format:** LTI integration or API endpoint returning assessment metadata per unit.

### 2.3 Campus Events Feed

**What we need:** Access to the university's official events calendar (student events, career fairs, orientation activities, faculty events).

**Why:** Syllabus Sync has an Events tab that students use to discover campus activities. A live feed from the university's events system would keep this current and authoritative, rather than relying on manual data entry.

**Ideal format:** iCal feed, RSS, or REST API. Even a public URL we can scrape periodically would be a starting point.

### 2.4 Campus Map & Building Data

**What we need:** Official building metadata (names, codes, coordinates, accessibility info) and any wayfinding data.

**Why:** The app includes a full campus map with building search and navigation. We currently maintain our own building database (130+ entries sourced from OpenStreetMap), but official data would improve accuracy and let us include indoor wayfinding or accessibility routes.

**Ideal format:** GeoJSON, CSV, or access to the campus GIS system.

### 2.5 Student Directory (Optional)

**What we need:** Ability to look up basic student information (name, faculty) for social features like shared schedules.

**Why:** Future feature — allowing students to share schedules or find classmates. Not required for the initial launch.

---

## 3. Authentication & SSO

### Current State

The app currently uses Supabase Auth with email/password authentication, WebAuthn (passkeys), and optional MFA. Email verification is enforced via Resend.

### Requested Integration

We would like to integrate with **Macquarie University's SSO (Single Sign-On)** system so that students can log in with their MQ credentials.

**Requirements:**

- Support for **SAML 2.0** or **OpenID Connect (OIDC)** — either protocol works with our stack
- A registered client/application in the university's identity provider
- Scope: authenticated MQ students (and optionally staff)
- Claims/attributes needed: email, full name, student ID, faculty (if available)

**Benefits to MQ:**

- No separate credentials for students to manage
- University retains control of authentication and account lifecycle
- Session policies (timeout, MFA) can be enforced centrally

---

## 4. Security Requirements

### 4.1 Application Security

- **HTTPS everywhere** — all traffic encrypted via TLS 1.3 (enforced by Vercel)
- **Row-Level Security (RLS)** — every database table is protected; users can only access their own data
- **CSRF/XSS protection** — enforced by Next.js defaults and Content Security Policy headers
- **Rate limiting** — server-side rate limiting on all API endpoints and authentication flows
- **Input validation** — Zod schema validation on all user inputs (client and server)
- **Audit logging** — all sensitive operations (login, data changes, admin actions) are logged with IP, user agent, and timestamps; 90-day retention

### 4.2 Requested from MQ

- **Security review / penetration test:** We welcome a university-commissioned penetration test before any official endorsement or SSO integration.
- **Privacy Impact Assessment (PIA):** Guidance on conducting a PIA under the _Privacy and Personal Information Protection Act 1998_ (NSW) and the Australian Privacy Principles.
- **Data classification guidance:** Confirmation of the classification level for student schedule and assessment data, so we can ensure our hosting and handling meets the required standard.

### 4.3 Data Handling

- **Storage:** All user data is stored in Supabase (hosted on AWS ap-southeast-2, Sydney region).
- **Encryption:** Data encrypted at rest (AES-256) and in transit (TLS 1.3).
- **Data minimisation:** We only store what the student explicitly provides or what is needed for the app's functionality.
- **Right to deletion:** Users can delete their account and all associated data via the app (GDPR-aligned `clear_user_data` function).
- **No data sharing:** Student data is not shared with third parties, advertisers, or analytics platforms beyond basic Vercel analytics.

---

## 5. Infrastructure & Hosting

### Current Stack

| Component             | Provider                                    | Region                     |
| --------------------- | ------------------------------------------- | -------------------------- |
| Frontend + API        | Vercel                                      | Sydney (syd1)              |
| Database              | Supabase                                    | AWS ap-southeast-2         |
| Email (transactional) | Resend                                      | US (sender domain pending) |
| Maps                  | OpenStreetMap + Leaflet (self-hosted tiles) |

### What We Need from MQ

1. **Custom domain approval:** We would like to serve the app from a `*.mq.edu.au` subdomain (e.g., `syllabus-sync.mq.edu.au` or `sync.students.mq.edu.au`). This requires a DNS CNAME record pointing to Vercel.

2. **Sender domain for email:** To send emails from an `@mq.edu.au` address (e.g., `noreply@syllabus-sync.mq.edu.au`), we need MX/SPF/DKIM records configured for our email provider (Resend).

3. **Push notification credentials:** The app supports web push notifications. No university infrastructure is needed, but if MQ has an existing push notification platform for student apps, we could integrate with it.

4. **Production environment variables:** If SSO is approved, we will need the IdP metadata URL, client ID, and client secret for the production environment.

---

## 6. Risks & Mitigations

| Risk                                 | Impact                                                          | Mitigation                                                                                                                    |
| ------------------------------------ | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **API access delayed**               | Demo relies on manual data; less impressive for Open Day        | Maintain high-quality seed data; plan a compelling demo flow that works without live APIs                                     |
| **SSO integration timeline**         | Students can't log in with MQ credentials at launch             | Keep existing email/password + passkey auth as fallback; SSO can be added post-launch                                         |
| **Data accuracy**                    | Timetable/assessment data may be stale or inconsistent          | Display "last synced" timestamps; allow manual overrides; implement graceful fallbacks                                        |
| **Availability**                     | App downtime during Open Day would be embarrassing              | Vercel provides 99.99% uptime SLA; Supabase has automatic failover; we will load-test before the event                        |
| **Privacy/compliance concerns**      | University may hesitate to endorse an app handling student data | Conduct PIA early; offer to go through the university's vendor risk assessment process; open-source the security architecture |
| **Rate limiting on university APIs** | High traffic on Open Day could hit API limits                   | Implement caching (5–15 min TTL); use stale-while-revalidate pattern; pre-cache demo data                                     |

---

## 7. Proposed Timeline

| Phase                | Timeframe       | Milestones                                                                                   |
| -------------------- | --------------- | -------------------------------------------------------------------------------------------- |
| **Now (March)**      | March 2026      | Demo account ready; requirements document shared with IT; initial meeting requested          |
| **Discovery**        | April 2026      | Meeting with IT Services; identify API contacts; begin SSO application process               |
| **Development**      | May–June 2026   | Build API integrations (timetable, events); SSO integration; security hardening              |
| **Access & Testing** | Early July 2026 | API access credentials received; end-to-end testing with real student data; penetration test |
| **Staging**          | Mid-July 2026   | Staging environment on `*.mq.edu.au` subdomain; UAT with select students                     |
| **Launch Prep**      | Late July 2026  | Load testing; final security review; marketing materials for Open Day                        |
| **Open Day**         | August 2026     | Public demo at Open Day; QR codes for student sign-up; live onboarding flow                  |

**Critical path:** API access and SSO credentials by early July are essential for a confident Open Day launch. Without these, we can still demo the app with seed data, but the "wow factor" of live data will be missing.

---

## 8. Next Steps

1. Schedule a meeting with Richard and the IT Services team to discuss feasibility and process.
2. Submit a formal application for API access (timetable, events, assessment data).
3. Begin the SSO client registration process.
4. Share this document with relevant stakeholders for feedback.

---

_This document is a draft prepared by the Syllabus Sync development team. It is intended to start a conversation, not to prescribe solutions. We are open to alternative approaches and welcome guidance from the university's IT and security teams._
