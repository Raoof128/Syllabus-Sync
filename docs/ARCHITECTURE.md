# Architecture & Design Overview

This document outlines the high-level architecture and design principles of **Syllabus Sync**.

## System Architecture

Syllabus Sync is a full-stack Next.js application designed for scalability, security, and high-fidelity user experience.

```
+------------------+     +------------------+     +------------------+
|                  |     |                  |     |                  |
|    Browser       |<--->|   Next.js App    |<--->|    Supabase      |
|    (React 19)    |     |   (API Routes)   |     |   (PostgreSQL)   |
|                  |     |                  |     |                  |
+------------------+     +------------------+     +------------------+
        |                        |                        |
        v                        v                        v
+------------------+     +------------------+     +------------------+
|  Service Worker  |     |  Upstash Redis   |     |  Row Level       |
|  (PWA/Offline)   |     |  (Rate Limiting) |     |  Security (RLS)  |
+------------------+     +------------------+     +------------------+
```

### 1. Frontend: The "Apple Liquid Glass" Engine

- **Framework**: Next.js 16 (App Router) with React 19
- **State Management**: Zustand with `persist` middleware for offline-first capabilities
- **Styling**: Tailwind CSS utilizing a custom semantic token system (`mq-tokens.css`)
- **Visuals**: High-fidelity UI using Framer Motion for 60fps animations, SVG filter refractions for "liquid" effects, and dynamic mesh gradients
- **Components**: Atomic design pattern with Radix UI primitives

### 2. Backend: Secure API Layer

- **API Routes**: Standardized response format (`jsonSuccess`, `jsonError`) with built-in request ID tracking
- **Middleware Stack**:
  - Global Rate Limiting (Upstash Redis)
  - CSRF Origin Validation
  - Security Headers (CSP, HSTS, X-Frame-Options)
  - Auth Session Validation
  - Body Size Limits (DoS prevention)
  - Request Logging

### 3. Data Layer: Supabase & Redis

- **PostgreSQL**: Hosted on Supabase, leveraging Row Level Security (RLS) for multi-tenancy
- **Redis**: Hosted on Upstash for distributed rate limiting
- **Migrations**: SQL-based schema with version tracking

## Directory Structure

```
syllabus-sync/
├── app/                      # Next.js 16 App Router
│   ├── api/                  # REST API endpoints
│   │   ├── _lib/            # Shared API utilities
│   │   │   ├── middleware.ts # Auth, rate limiting, validation
│   │   │   ├── response.ts   # Standard response helpers
│   │   │   └── mappers.ts    # DB row to API object mappers
│   │   ├── auth/            # Authentication endpoints
│   │   ├── units/           # Unit CRUD
│   │   ├── deadlines/       # Deadline CRUD
│   │   ├── notifications/   # Notification management
│   │   ├── gamification/    # XP and leveling
│   │   └── navigate/        # ORS routing proxy
│   ├── home/                # Dashboard page
│   ├── calendar/            # Calendar view
│   ├── map/                 # Campus map
│   └── settings/            # User settings
│
├── components/              # React components
│   ├── ui/                 # Base UI primitives (Shadcn)
│   │   └── mq/             # MQ-branded variants
│   ├── layout/             # Header, Sidebar, Footer
│   ├── home/               # Dashboard widgets
│   ├── calendar/           # Calendar components
│   ├── map/                # Map overlays and controls
│   ├── gamification/       # XP, badges, levels
│   └── ErrorBoundary.tsx   # Error handling
│
├── lib/                    # Business logic & utilities
│   ├── store/              # Zustand stores
│   │   ├── unitsStore.ts
│   │   ├── deadlinesStore.ts
│   │   ├── notificationsStore.ts
│   │   ├── gamificationStore.ts
│   │   └── languageStore.ts
│   ├── security/           # Security modules
│   │   ├── csrf.ts         # CSRF protection
│   │   └── csp.ts          # Content Security Policy
│   ├── services/           # External services
│   │   └── rateLimitService.ts
│   ├── hooks/              # Custom React hooks
│   ├── map/                # Building data, navigation
│   ├── i18n/               # Internationalization
│   └── utils/              # Utility functions
│
├── locales/                # Translation files (19 languages)
├── tests/                  # Test files
├── public/                 # Static assets, PWA manifest
└── docs/                   # Documentation
```

## Security Architecture

### Authentication Flow

```
1. User submits credentials
2. Supabase Auth validates
3. Session cookie set (HttpOnly, Secure, SameSite=Lax)
4. Subsequent requests include cookie automatically
5. API middleware validates session via getUser()
```

### CSRF Protection

- Origin/Referer header validation on all mutation endpoints
- Same-origin policy enforcement
- Optional double-submit cookie pattern

### Rate Limiting Strategy

| Category        | Limit | Window | Fail Mode |
| --------------- | ----- | ------ | --------- |
| Auth endpoints  | 5-10  | 15 min | Closed    |
| Mutations       | 30    | 1 min  | Closed    |
| Read operations | 100   | 1 min  | Open      |

### Row Level Security (RLS)

All database tables enforce user-scoped access:

```sql
-- Example RLS policy
CREATE POLICY "Users can only see their own data"
ON units FOR SELECT
USING (auth.uid() = user_id);
```

## State Management

### Zustand Store Pattern

```typescript
// Typical store structure
interface Store {
  // Data
  items: Item[];
  isLoading: boolean;

  // Actions
  loadItems: () => Promise<void>;
  addItem: (item: Item) => Promise<Item | null>;
  updateItem: (id: string, data: Partial<Item>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
}

// Persistence with migrations
persist(storeImplementation, {
  name: 'store-key',
  version: 1,
  migrate: (state, version) => {
    /* handle migrations */
  },
});
```

### Optimistic Updates

1. Update local state immediately
2. Make API request
3. On success: sync with server response
4. On failure: rollback to previous state, show error

## Navigation & Map Logic

The campus map uses a hybrid approach:

1. **OSM Data**: Building footprints and metadata cached locally
2. **Navigation Proxy**: Server-side proxy for OpenRouteService (ORS)
   - Prevents API key exposure
   - Bypasses CORS restrictions
   - Adds caching layer
3. **Handoff**: External links to Google/Apple Maps for voice navigation

## Gamification Engine

### XP Event System

```typescript
type XPEventType =
  | 'deadline_completed' // 50 XP
  | 'deadline_early' // +25 bonus
  | 'daily_login' // 10 XP
  | 'streak_bonus' // 5 XP per day
  | 'unit_added' // 25 XP
  | 'event_attended' // 30 XP
  | 'level_up_bonus'; // 50 XP
```

### Tamper Prevention

- XP awarded via server-side triggers
- Rate limiting on XP-earning events
- Audit logging in `xp_events` table
- Separate `gamification_profiles` table

## Internationalization (i18n)

### 19 Supported Languages

Including RTL support for: Arabic, Persian, Urdu, Hebrew

### Lazy Loading

```typescript
// Only load current language
const translations = {
  en: staticImport, // Always loaded (fallback)
  [language]: await import(`@/locales/${language}/translations.json`),
};
```

## Testing Strategy

### Test Pyramid

```
        /\
       /  \      E2E Tests (Playwright)
      /----\     - Critical user journeys
     /      \    - Multi-browser testing
    /--------\   Component Tests (Testing Library)
   /          \  - UI interactions
  /------------\ - Accessibility (axe-core)
 /              \ Unit Tests (Vitest)
/________________\ - Utilities, stores, API middleware
```

### CI/CD Pipeline

1. Type checking (`tsc --noEmit`)
2. Linting (`eslint`)
3. Unit tests (`vitest`)
4. Security audit (`npm audit`)
5. CSP hash validation
6. Lighthouse performance
7. Accessibility tests (WCAG 2.1 AA)
8. E2E tests (Chromium, Firefox, WebKit, Mobile)

## Performance Optimizations

- **Package Import Optimization**: Tree-shaking for Radix UI, date-fns
- **Code Splitting**: Automatic via Turbopack
- **Image Optimization**: WebP/AVIF with Next.js Image
- **PWA**: Service worker for offline support
- **Suspense**: Skeleton loaders for async components

## Error Handling

### Error Boundary Pattern

```
App → ErrorBoundary → Page Components
           │
           └── On error: Log → Retry → Fallback UI
```

### Reporting Pipeline

1. Log to console (development)
2. Store in localStorage (debugging)
3. Report to Vercel logs (production, high severity)
4. Sentry integration ready (see `reportToService()`)

---

**Built with enterprise standards for the Macquarie University community.**

_Last Audit: January 15, 2026 - v1.0.0-rc.7 (Completed)_
