# Changelog

All notable changes to Syllabus Sync are documented in this file.

---

## [1.0.0] — 2026-02-25

### Production Release

Full-featured campus management platform ready for Macquarie University deployment.

### Features

- **Academic Calendar** — Weekly, day, and agenda views with drag-and-drop scheduling, unit colour-coding, deadline tracking, exam management, and todo lists
- **Campus Map** — Leaflet-based interactive map with Google Maps Embed API v1 directions, 100+ MQ building locations, live GPS navigation, and building search with autocomplete
- **Events Feed** — Public and personal event management with category filtering, featured event banners, and detail modals
- **Home Dashboard** — KPI strip, week heat map, today's schedule, upcoming deadlines, unit overview, and quick actions FAB
- **Gamification** — XP system with level progression, streak tracking, badges, and animated level-up notifications
- **User Profiles** — Avatar upload, academic info (course/year from MQ catalogue), and multi-profile support
- **Settings** — 7 sections: General, Appearance, Experience, Notifications, Map, Privacy, Security, and About

### Authentication & Security

- Supabase Auth with email/password and OAuth (Google) sign-in
- WebAuthn/Passkey registration and login (FIDO2)
- Multi-Factor Authentication — TOTP (authenticator app) and SMS
- Custom email verification flow via Resend
- Nonce-based Content Security Policy (CSP)
- Origin-validated CSRF protection at proxy level
- Per-route rate limiting and brute-force protection on auth endpoints
- Inactivity auto-logout (5 min)
- Password breach checking (HaveIBeenPwned k-anonymity API)
- Session management with device fingerprinting

### Internationalisation

- 35 language packs with full key parity
- RTL support (Arabic, Hebrew, Farsi, Urdu)
- Dynamic locale switching with persisted preference

### Progressive Web App

- Service worker with offline fallback page
- Install prompt with dismissal
- Background sync and conflict resolution dialog
- Push notification scheduling

### Developer Experience

- 70+ test files with 498+ passing tests (Vitest + React Testing Library)
- ESLint + Prettier + TypeScript strict mode
- CI/CD via GitHub Actions (lint, test, build, deploy)
- Docker support for local development
- Lighthouse CI integration
- Comprehensive security evidence documentation

### Infrastructure

- Next.js 16 with App Router and React 19
- Tailwind CSS 4 with MQ design token system
- Zustand state management (15 stores)
- Supabase PostgreSQL with Row Level Security
- Vercel deployment with edge functions
- Sentry error monitoring

---

## Development History

This project was developed as part of a Macquarie University initiative to modernise the student campus experience. Development spanned from January to February 2026, with contributions from multiple team members focusing on frontend design, security hardening, internationalisation, and campus data integration.
