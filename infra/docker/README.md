# Docker Infrastructure

This directory contains Docker configuration for Syllabus Sync.

## Files

- `Dockerfile` - Multi-stage Dockerfile for building production-ready images
- `docker-compose.yml` - Docker Compose configuration for local development and production
- `.dockerignore` - Files to exclude from Docker build context
- `.env` - Environment variables for Docker containers (copy from `.env.example`)

## Usage

### Build the Docker image

```bash
npm run docker:build
# or
docker build -f infra/docker/Dockerfile -t syllabus-sync .
```

### Run in production mode

```bash
npm run docker:prod
# or
docker compose -f infra/docker/docker-compose.yml up
```

### Run in development mode (with hot reload)

```bash
npm run docker:dev
# or
docker compose -f infra/docker/docker-compose.yml --profile development up
```

### Stop containers

```bash
npm run docker:down
# or
docker compose -f infra/docker/docker-compose.yml down
```

## Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example infra/docker/.env
```

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)

## Health Check

The container includes a health check endpoint at `/api/health`.
