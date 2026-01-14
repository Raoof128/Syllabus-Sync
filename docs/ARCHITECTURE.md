# Architecture & Design Overview

This document outlines the high-level architecture and design principles of **Syllabus Sync**.

## 🏗️ System Architecture

Syllabus Sync is a full-stack Next.js application designed for scalability, security, and high-fidelity user experience.

### 1. Frontend: The "Apple Liquid Glass" Engine

- **Framework**: Next.js 16 (App Router) with React 19.
- **State Management**: Zustand with `persist` middleware for offline-first capabilities.
- **Styling**: Tailwind CSS utilizing a custom semantic token system (`mq-tokens.css`).
- **Visuals**: High-fidelity UI using Framer Motion for 60fps animations, SVG filter refractions for "liquid" effects, and dynamic mesh gradients.

### 2. Backend: Secure API Layer

- **API Routes**: Standardized response format (`jsonSuccess`, `jsonError`) with built-in request ID tracking.
- **Middleware**: A centralized middleware stack handling:
  - Global Rate Limiting (Upstash Redis).
  - CSRF Origin Validation.
  - Security Headers (CSP, HSTS, etc.).
  - Auth Session Validation.

### 3. Data Layer: Supabase & Redis

- **PostgreSQL**: Hosted on Supabase, leveraging Row Level Security (RLS) for multi-tenancy.
- **Redis**: Hosted on Upstash for distributed rate limiting and caching.
- **Storage**: Supabase Storage for user avatars and document uploads.

## 🗺️ Navigation & Map Logic

The campus map uses a hybrid approach:

1. **OSM Data**: Building footprints and metadata are cached locally from OpenStreetMap.
2. **Navigation Proxy**: A server-side proxy for OpenRouteService (ORS) to prevent API key exposure and bypass CORS restrictions.
3. **Handoff**: External links to Google/Apple Maps for turn-by-turn voice navigation.

## 🎮 Gamification Logic

The XP engine is designed to be tamper-resistant:

- **Event-Driven**: XP is awarded based on server-side triggers or verified API calls.
- **Throttling**: XP-earning events are rate-limited to prevent abuse.
- **Profiles**: Separate `gamification_profiles` table to isolate social data from core academic data.

## 🧪 Testing Strategy

- **Unit Tests**: Vitest for utility functions, stores, and business logic.
- **Component Tests**: React Testing Library for UI interaction verification.
- **E2E Tests**: Playwright for critical user journeys (Auth, Add Unit, Map Navigation).

---

**Syllabus Sync: Engineering for the Student Experience.**
