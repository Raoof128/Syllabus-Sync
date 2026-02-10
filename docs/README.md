# Documentation

This repository uses a feature-first structure with a thin Next.js `app/` layer.

## Structure Overview

- `app/`: Routes, layouts, and route handlers only.
- `features/`: Feature modules (`map`, `calendar`, `settings`, `auth`, `feed`, `home`, `gamification`).
- `components/ui`: Shared UI primitives.
- `components/layout`: Shared layout components.
- `lib/`: Shared platform layers (`security`, `i18n`, `store`, `schemas`, `services`, and utilities).
- `assets/maps`: Source map assets and non-public geodata.
- `public/maps`, `public/tiles`: Browser-fetched map assets.
- `tests/`: Unified test root (`unit`, integration-style tests, e2e specs).
- `supabase/`: Migrations and database assets.

## Local Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run check`

## Project Materials

- `docs/project/team_plan/`: Planning, roles, and roadmap material.
- `docs/project/sketch/`: Design sketch images.
- `docs/project/restructure-notes.md`: Detailed repo restructuring log.
