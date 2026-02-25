# Syllabus Sync — Development Guide

## Project Overview

**Syllabus Sync** is an enterprise-grade campus management platform built for Macquarie University students. It combines academic schedule management, campus navigation, and student productivity tools into a single Progressive Web App.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + MQ Design Tokens |
| Auth | Supabase Auth + WebAuthn/Passkeys + MFA (TOTP & SMS) |
| Database | Supabase (PostgreSQL + Row Level Security) |
| State | Zustand (15 stores) |
| Forms | React Hook Form + Zod validation |
| Maps | Leaflet + Google Maps Embed API v1 |
| Email | Resend transactional email |
| Testing | Vitest + React Testing Library |
| Deployment | Vercel |

## Project Structure

```
syllabus-sync/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/                # 59 REST API endpoints
│   ├── home/               # Dashboard
│   ├── calendar/           # Academic calendar
│   ├── feed/               # Events feed
│   ├── map/                # Campus map & navigation
│   ├── settings/           # User preferences (7 sections)
│   ├── login/              # Authentication
│   ├── signup/             # Registration
│   └── manage-profiles/    # Profile management
├── components/             # Shared UI components
│   └── ui/mq/              # MQ-branded design system
├── features/               # Feature modules (calendar, map, feed, etc.)
├── lib/                    # Core libraries
│   ├── security/           # CSP, CSRF, WebAuthn, MFA
│   ├── store/              # Zustand state stores
│   ├── supabase/           # Database client & middleware
│   └── hooks/              # Shared React hooks
├── locales/                # i18n (35 languages)
├── config/                 # Build & tool configuration
├── tests/                  # Test suites (70+ test files)
├── tools/                  # Build scripts & i18n utilities
├── docs/                   # Documentation & security evidence
└── infra/                  # Docker deployment config
```

## Key Features

1. **Academic Calendar** — Weekly/day/agenda views with unit colour-coding, deadline tracking, exam scheduling, and todo management
2. **Campus Map** — Leaflet-based interactive map with Google Maps embedded directions, building search, and live GPS navigation
3. **Events Feed** — Public and personal event management with filtering and detail modals
4. **Gamification** — XP system, streaks, level badges, and progress tracking
5. **Security** — Nonce-based CSP, origin-validated CSRF, WebAuthn passkeys, TOTP/SMS MFA, rate limiting, and brute-force protection
6. **PWA** — Offline support, install prompt, service worker updates, push notifications
7. **i18n** — Full internationalisation with 35 language packs
8. **Accessibility** — ARIA landmarks, skip links, keyboard navigation, screen reader support

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run test         # Run test suite
npm run lint         # ESLint check
npm run typecheck    # TypeScript type check
npm run check        # Full CI check (secrets + format + types + lint + test + build)
npm run check:i18n   # Verify translation parity across locales
```

## Architecture Notes

- **Next.js 16 Proxy**: Uses `proxy.ts` (not `middleware.ts`) for request interception — handles auth redirects, CSP nonce injection, and CSRF validation
- **Config Re-exports**: Root-level config files (`next.config.ts`, `tailwind.config.ts`, `tsconfig.json`) are thin re-exports from `config/` directory
- **API Guard Pattern**: `withApiGuard()` middleware combines CSRF validation + auth + rate limiting + error wrapping per route
- **State Management**: Zustand stores with Supabase sync — local-first with conflict resolution dialog
