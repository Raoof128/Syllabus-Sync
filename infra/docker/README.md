# Docker Infrastructure

> **Last verified:** 2026-03-21

This directory contains the Docker configuration for building and running Syllabus Sync as a containerized application. It is provided as an alternative to the primary Vercel deployment.

---

## Directory Contents

| File                 | Purpose                                                                                   |
| :------------------- | :---------------------------------------------------------------------------------------- |
| `Dockerfile`         | Multi-stage build: dependency installation, Next.js build, and minimal production runner. |
| `docker-compose.yml` | Compose services for both production and development modes.                               |
| `.dockerignore`      | Excludes development artifacts, secrets, and documentation from the build context.        |

---

## Quick Start

### Build the production image

```bash
npm run docker:build
```

Or manually:

```bash
docker build -f infra/docker/Dockerfile -t syllabus-sync .
```

### Run in production mode

```bash
npm run docker:prod
```

Or manually:

```bash
docker compose -f infra/docker/docker-compose.yml up
```

The application will be available at `http://localhost:3000`.

### Run in development mode (with hot reload)

```bash
npm run docker:dev
```

Or manually:

```bash
docker compose -f infra/docker/docker-compose.yml --profile development up
```

Development mode mounts the source directory into the container and runs `npm run dev`, providing hot module replacement.

### Stop all containers

```bash
npm run docker:down
```

Or manually:

```bash
docker compose -f infra/docker/docker-compose.yml down
```

---

## Environment Variables

Create an environment file for Docker by copying the project's example:

```bash
cp .env.example infra/docker/.env
```

Edit `infra/docker/.env` and populate the required values. At minimum, the following must be set:

| Variable                        | Required | Description                                                           |
| :------------------------------ | :------- | :-------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Yes      | Supabase project URL.                                                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes      | Supabase anonymous/public key.                                        |
| `SUPABASE_SERVICE_ROLE_KEY`     | Yes      | Supabase service role key (server-side only).                         |
| `NEXT_PUBLIC_APP_URL`           | Yes      | The URL where the app will be served (e.g., `http://localhost:3000`). |

For the full list of available variables, refer to `.env.example` in the project root.

---

## Build Details

The `Dockerfile` uses a three-stage build optimized for minimal image size and security:

| Stage     | Base Image       | Purpose                                                                                               |
| :-------- | :--------------- | :---------------------------------------------------------------------------------------------------- |
| `deps`    | `node:22-alpine` | Installs production dependencies with `npm ci`.                                                       |
| `builder` | `node:22-alpine` | Copies dependencies and builds the Next.js application.                                               |
| `runner`  | `node:22-alpine` | Copies only the standalone output, static assets, and public files. Runs as a non-root `nextjs` user. |

Key properties of the production image:

- **Non-root execution:** The `nextjs` user (UID 1001) runs the application.
- **Standalone output:** Uses Next.js standalone mode for a minimal deployment footprint.
- **Health check:** Built-in Docker health check at `/api/health` (30-second interval, 3 retries).
- **Telemetry disabled:** `NEXT_TELEMETRY_DISABLED=1` is set at build and run time.

---

## Health Check

The container includes an automatic health check:

```
GET http://localhost:3000/api/health
```

Docker will mark the container as unhealthy if this endpoint fails three consecutive checks. You can verify the health status with:

```bash
docker inspect --format='{{.State.Health.Status}}' <container-id>
```

---

## Networking

Docker Compose creates a dedicated network named `syllabus-sync-network`. If you need to connect additional services (e.g., a local Supabase instance), attach them to this network.
