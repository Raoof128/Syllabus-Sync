# Environment & Setup Guide

This document provides technical instructions for configuring a local development environment for Syllabus Sync. The platform is built on a modern, serverless-first stack requiring several cloud service configurations.

---

## 🛠️ Runtime Requirements

Ensure the following are installed on your workstation:

- **Node.js:** `>=22.0.0` (Active LTS)
- **npm:** `>=10.0.0`
- **Docker:** Required only for local Supabase emulation (Optional).

---

## 🚀 Step-by-Step Onboarding

### 1. Repository Initialization

```bash
git clone https://github.com/mrpouyaalavi/syllabus-sync.git
cd syllabus-sync
npm install
```

### 2. Infrastructure Configuration

Syllabus Sync requires active projects on the following platforms:

#### **Supabase (Auth & Database)**

1. Create a new Supabase project.
2. Link your local environment: `npx supabase link --project-ref <your-ref>`.
3. Apply migrations: `npx supabase db push`.
4. Obtain your `SUPABASE_URL` and `SUPABASE_ANON_KEY`.

#### **Upstash (Rate Limiting)**

1. Create a Redis database on Upstash.
2. Obtain your `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

#### **Resend (Email)**

1. Create a Resend account and verify a domain.
2. Obtain your `RESEND_API_KEY`.

### 3. Environment Variable Injection

Copy `.env.example` to `.env.local` and populate the keys retrieved in Step 2.

```bash
cp .env.example .env.local
```

**Key Variables Required:**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `UPSTASH_REDIS_REST_URL`
- `RESEND_API_KEY`

---

## 💻 Development Workflow

### Execution Commands

| Command         | Purpose                                                                   |
| :-------------- | :------------------------------------------------------------------------ |
| `npm run dev`   | Starts the Next.js development server with HMR.                           |
| `npm run check` | **Mandatory.** Runs the full quality gate (lint, typecheck, test, build). |
| `npm run lint`  | Executes ESLint rules (configured for 0 tolerance).                       |
| `npm run test`  | Runs the Vitest unit and integration suite.                               |

### Quality Gates

We maintain a zero-tolerance policy for linting errors and type-safety violations. Ensure your IDE is configured to respect the project's `.editorconfig` and Prettier rules.

---

## 🏗️ Deployment Strategy

The application is optimized for **Vercel**.

1. Connect your GitHub repository to Vercel.
2. Configure the production environment variables in the Vercel Dashboard.
3. Ensure the `Node.js Version` is set to `22.x`.

For Docker-based deployments, refer to the [Docker README](../../infra/docker/README.md).
