# The Syllabus Sync

**Campus Navigation and Schedule Management for Macquarie University**

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)](https://tailwindcss.com/)
[![Version](https://img.shields.io/badge/version-0.14.25-blue)]()
[![Node.js](https://img.shields.io/badge/Node.js-22+-brightgreen)]()

---

## Overview

**The Syllabus Sync** is a comprehensive campus management web application designed to help Macquarie University students seamlessly manage their academic and campus life. Built with enterprise-grade code quality and modern web technologies, it provides an all-in-one platform for schedule management, deadline tracking, event discovery, and campus navigation.

**Current Version:** 0.14.25  
**Current Status:** Production-ready with Supabase backend, comprehensive security measures, and 19-language internationalization support.

---

## Quick Start

### Prerequisites

- **Node.js 22+** (required)
- **npm** (comes with Node.js)
- **Supabase account** (for database and authentication)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/mrpouyaalavi/syllabus-sync.git
   cd syllabus-sync
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your credentials:

   | Variable                        | Description                    | Required | Where to get it                                                             |
   | ------------------------------- | ------------------------------ | -------- | --------------------------------------------------------------------------- |
   | `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL           | Yes      | [Supabase Dashboard](https://supabase.com/dashboard/project/_/settings/api) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public (anon) key     | Yes      | Same as above                                                               |
   | `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service role key      | Yes\*    | Same as above (Settings > API > service_role)                               |
   | `UPSTASH_REDIS_REST_URL`        | Upstash Redis URL              | Prod     | [Upstash Console](https://console.upstash.com/)                             |
   | `UPSTASH_REDIS_REST_TOKEN`      | Upstash Redis token            | Prod     | Same as above                                                               |
   | `ADMIN_SECRET_TOKEN`            | Admin API authentication token | Dev      | Generate a secure random string                                             |
   | `ADMIN_API_ENABLED`             | Enable admin endpoints         | Dev      | Set to `true` in development only                                           |

   > **Note:** `*` Service role key is needed for server-side operations. Never expose this in client code.

4. **Set up the database**

   Run the database schema in your Supabase SQL Editor:

   ```bash
   # The schema is in database-schema.sql
   # Copy the contents and run in Supabase Dashboard > SQL Editor
   ```

5. **Run development server**

   ```bash
   npm run dev
   ```

6. **Open in browser**
   ```
   http://localhost:3000
   ```

### Available Scripts

```bash
# Development
npm run dev          # Start development server (Turbopack)
npm run dev:safe     # Start without Turbopack
npm run build        # Build for production
npm run start        # Start production server

# Testing
npm run test         # Run unit tests (Vitest)
npm run test:watch   # Run tests in watch mode
npm run test:e2e     # Run end-to-end tests (Playwright)
npm run test:e2e:ui  # Run E2E tests with UI
npm run test:accessibility # Run accessibility tests
npm run test:ci      # Run all tests (unit + e2e)

# Quality Assurance
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
npm run check:secrets # Check for exposed secrets
npm run prepush      # Run all checks before pushing

# Analysis
npm run analyze      # Bundle analysis
npm run lighthouse   # Performance audit
```

---

## Security Configuration

### Rate Limiting (Production)

For production deployments, configure distributed rate limiting:

```env
# Upstash Redis (Recommended)
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# OR Vercel KV
KV_REST_API_URL=https://your-kv.vercel-storage.com
KV_REST_API_TOKEN=your-token
```

Without these, rate limiting falls back to in-memory storage (not suitable for serverless).

### Admin Endpoints (Development Only)

Admin endpoints are disabled by default. To enable in development:

```env
ADMIN_API_ENABLED=true
ADMIN_SECRET_TOKEN=your-secure-random-token
```

**Warning:** Never enable admin endpoints in production without proper authentication.

### CORS Configuration

Configure allowed origins for API access:

```env
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com
```

---

## Database Setup

### Supabase Configuration

1. Create a new Supabase project
2. Go to SQL Editor and run `database-schema.sql`
3. Configure Row Level Security (RLS) policies (included in schema)
4. Enable email authentication in Authentication > Providers

### Database Schema

The application uses the following tables:

- `profiles` - User profiles and settings
- `units` - Academic units/courses
- `class_times` - Class schedules
- `deadlines` - Assignment deadlines
- `events` - Campus events
- `notifications` - User notifications
- `gamification_profiles` - Gamification/XP tracking
- `xp_events` - XP earning events

### Migrations

Database migrations are managed via SQL files:

```
database-schema.sql           # Full schema
supabase/migrations/          # Incremental migrations
```

---

## Project Structure

```
syllabus-sync/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── _lib/            # Shared API utilities
│   │   ├── units/           # Unit endpoints
│   │   ├── deadlines/       # Deadline endpoints
│   │   ├── events/          # Event endpoints
│   │   └── auth/            # Authentication endpoints
│   ├── home/                # Home dashboard
│   ├── calendar/            # Calendar view
│   ├── map/                 # Campus map
│   ├── feed/                # Events feed
│   └── settings/            # Settings page
├── components/              # React components
│   ├── layout/             # Layout components
│   ├── ui/                 # UI primitives
│   └── ...                 # Feature components
├── lib/
│   ├── store/              # Zustand stores
│   ├── supabase/           # Supabase client
│   ├── security/           # Security utilities
│   ├── services/           # Business logic
│   └── utils/              # Utility functions
├── data/                   # Sample data
└── tests/                  # Test files
```

---

## API Documentation

### Authentication

All mutation endpoints require authentication via Supabase session cookies.

### Endpoints

| Method | Endpoint              | Description           | Auth Required |
| ------ | --------------------- | --------------------- | ------------- |
| GET    | `/api/units`          | List user's units     | Yes           |
| POST   | `/api/units`          | Create a unit         | Yes           |
| PUT    | `/api/units/[id]`     | Update a unit         | Yes           |
| DELETE | `/api/units/[id]`     | Delete a unit         | Yes           |
| GET    | `/api/deadlines`      | List deadlines        | Yes           |
| POST   | `/api/deadlines`      | Create a deadline     | Yes           |
| PUT    | `/api/deadlines/[id]` | Update a deadline     | Yes           |
| DELETE | `/api/deadlines/[id]` | Delete a deadline     | Yes           |
| GET    | `/api/events`         | List events           | Yes           |
| POST   | `/api/events`         | Create an event       | Yes           |
| GET    | `/api/gamification`   | Get user's XP profile | Yes           |
| POST   | `/api/gamification`   | Record activity       | Yes           |

### Security Features

- **CSRF Protection**: Origin validation on all mutation endpoints
- **Rate Limiting**: Distributed rate limiting (30 req/min for mutations)
- **Body Size Limits**: JSON payloads limited to 100KB
- **Input Validation**: Zod schemas for all inputs
- **Row Level Security**: Database-level access control

---

## Tech Stack

| Category             | Technology               | Purpose                               |
| -------------------- | ------------------------ | ------------------------------------- |
| **Framework**        | Next.js 16 (React 19)    | Full-stack React framework            |
| **Language**         | TypeScript 5.x           | Type-safe JavaScript                  |
| **Database**         | Supabase (PostgreSQL)    | Backend-as-a-Service                  |
| **Styling**          | Tailwind CSS + Shadcn UI | Utility-first CSS                     |
| **State Management** | Zustand                  | Client-side state with persistence    |
| **Testing**          | Vitest + Playwright      | Unit and E2E testing                  |
| **Security**         | Custom middleware        | Rate limiting, CSRF, input validation |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Run quality checks (`npm run prepush`)
4. Commit changes (`git commit -m 'Add amazing feature'`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

---

## Documentation

- **[AGENT.md](Team_Plan/AGENT.md)** - Complete project documentation
- **[CHANGELOG.md](Team_Plan/CHANGELOG.md)** - Version history
- **[SECURITY.md](SECURITY.md)** - Security policy

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Made with care for Macquarie University students**
