# Repository Inventory

Quantitative overview of the Syllabus Sync codebase, demonstrating the project's scale, organization, and engineering rigor.

---

## At a Glance

| Metric                    | Count |
| :------------------------ | :---- |
| TypeScript source files   | ~730  |
| React components (`.tsx`) | ~232  |
| Library modules (`lib/`)  | ~109  |
| API route handlers        | 67    |
| Test files                | ~93   |
| Test cases                | 503+  |
| Supabase SQL migrations   | 61    |
| Feature modules           | 7     |
| Configuration presets     | 10    |

---

## Directory Structure

```
syllabus-sync/
  app/                          # Next.js App Router
    api/                        # 67 REST API route handlers across 22 domains
    home/                       # Dashboard page
    calendar/                   # Academic schedule page
    map/                        # Campus navigation page
    feed/                       # Events feed page
    settings/                   # Settings hub (5 nested sections)
    login/ signup/ ...          # Auth pages
  features/                     # Feature-modular domain logic
    auth/                       # Authentication flows, MFA, passkey UI
    calendar/                   # Calendar views, deadline forms, quick-add
    feed/                       # Event cards, feed filters, social features
    gamification/               # XP tracking, streak UI, level progress
    home/                       # Dashboard widgets, quick actions
    map/                        # Campus map, Google Maps, navigation engine
    settings/                   # Preferences forms, security panel, about
  components/                   # Shared UI primitives and layout
    ui/                         # Design system components (buttons, cards, dialogs, etc.)
    layout/                     # Sidebar, Header, Footer, shell wrappers
  lib/                          # Core infrastructure
    security/                   # CSRF, CSP, rate limiting, IP extraction, SSRF prevention
    supabase/                   # Client, server, and admin Supabase wrappers
    store/                      # Zustand state management (auth, calendar, map, sync, etc.)
    services/                   # Rate limiting, push notifications, weather
    maps/                       # Google Maps/Routes integration layer
    weather/                    # Weather provider abstraction
    schemas/                    # Zod validation schemas
    utils/                      # Building validation, date formatting, shared helpers
    i18n/                       # Internationalization (8 languages)
  supabase/                     # Database layer
    migrations/                 # 61 idempotent SQL migrations
    seed.sql                    # Development seed data
  config/                       # Centralized tooling configuration
    codecov/                    # Code coverage thresholds
    eslint/                     # Linting rules
    lighthouse/                 # Performance budgets
    next/                       # Next.js configuration
    postcss/                    # CSS processing
    prettier/                   # Code formatting
    sentry/                     # Error monitoring
    tailwind/                   # Design tokens and theme
    ts/                         # TypeScript compiler options
    vitest/                     # Test runner configuration
  tests/                        # Unified test suite
    api/                        # API route and middleware tests
    auth/                       # Authentication flow tests
    calendar/                   # Calendar feature tests
    components/                 # UI component tests
    feed/                       # Feed feature tests
    gamification/               # XP and streak tests
    hooks/                      # Custom hook tests
    i18n/                       # Internationalization tests
    lib/                        # Library module tests
    map/                        # Map and navigation tests
    security/                   # Security middleware tests
    settings/                   # Settings and route integrity tests
    store/                      # Zustand store tests
    sync/                       # Offline sync tests
  public/                       # Static assets (icons, manifest, service worker)
```

---

## Feature Modules

Each feature module under `features/` follows a consistent internal structure:

```
features/<domain>/
  components/                   # Domain-specific React components
  hooks/                        # Custom hooks for data fetching and state
  lib/                          # Domain utilities and constants
  types/                        # Domain-specific TypeScript types
```

| Module         | Components                                                  | Purpose                                   |
| :------------- | :---------------------------------------------------------- | :---------------------------------------- |
| `auth`         | Login forms, MFA dialogs, passkey flows                     | Authentication and identity management    |
| `calendar`     | Calendar views, deadline cards, quick-add                   | Academic schedule and assessment tracking |
| `feed`         | Event cards, feed list, category filters                    | Campus event discovery                    |
| `gamification` | XP bar, streak counter, level badge                         | Student engagement and progression        |
| `home`         | Dashboard widgets, quick actions, stats                     | Primary landing experience                |
| `map`          | Campus SVG map, Google Maps, route panel, navigation engine | Geospatial campus navigation              |
| `settings`     | Preferences forms, security panel, about section            | User configuration                        |

---

## Infrastructure Layer

### Security (`lib/security/`)

| Module               | Responsibility                                                |
| :------------------- | :------------------------------------------------------------ |
| `csrf.ts`            | CSRF token generation, cookie management, origin validation   |
| `csp.ts`             | Nonce generation, Content-Security-Policy header construction |
| `ip.ts`              | Trusted IP extraction from proxy headers (Vercel, Cloudflare) |
| `headers-scanner.ts` | External URL security header analysis and grading             |
| `identifiers.ts`     | Anonymized key generation for rate limiting                   |

### State Management (`lib/store/`)

Zustand stores provide client-side state with persistence:

| Store              | Scope                                          |
| :----------------- | :--------------------------------------------- |
| Auth store         | Session, user, MFA status                      |
| Calendar store     | Units, deadlines, selected dates               |
| Map store          | Building selection, navigation state, map mode |
| Sync store         | Offline mutation queue, conflict resolution    |
| Notification store | Unread counts, notification list               |
| Preferences store  | Theme, language, reminder settings             |

### Database (`supabase/`)

61 migrations covering:

- User profiles and preferences
- Academic units and class schedules
- Deadlines, events, and todos (with soft-delete)
- Gamification profiles and XP events
- Push notification subscriptions
- Audit logging with RLS policies
- Row-Level Security on all user-scoped tables

---

## Quality Gate

The `npm run check` command runs the full quality pipeline:

```
secrets scan -> format check -> typecheck -> lint -> test -> build
```

| Step      | Tool           | Configuration                                      |
| :-------- | :------------- | :------------------------------------------------- |
| Secrets   | Custom scanner | Detects committed API keys and credentials         |
| Format    | Prettier       | `config/prettier/.prettierrc.json`                 |
| Typecheck | TypeScript     | `config/ts/tsconfig.json`                          |
| Lint      | ESLint         | `config/eslint/eslint.config.mjs`                  |
| Test      | Vitest         | `config/vitest/vitest.config.ts` (503+ test cases) |
| Build     | Next.js        | `next build` with strict output validation         |

---

## Key Technical Decisions

| Decision                         | Rationale                                                         |
| :------------------------------- | :---------------------------------------------------------------- |
| Next.js App Router               | Server components for initial load performance, streaming SSR     |
| Supabase (PostgreSQL + Auth)     | Row-Level Security, built-in auth with MFA/passkey support        |
| Zustand over Redux               | Minimal boilerplate, TypeScript-first, fine-grained subscriptions |
| Server-side API proxies for maps | Keeps Google/ORS API keys off the client bundle                   |
| Feature-modular architecture     | Scales with team size, enforces domain boundaries                 |
| Zod validation on every endpoint | Runtime type safety at the API boundary                           |
| Soft-delete pattern              | Enables offline sync conflict resolution and audit trails         |
| Redis-backed rate limiting       | Distributed, serverless-compatible (Vercel KV)                    |
