# Repository Restructure Notes

## Before

The repository had mixed placement for feature code and duplicates:

- Duplicate Supabase types in both `src/lib/supabase` and `lib/supabase`
- Duplicate type root in `/types` and `lib/types`
- Split test roots across `tests/` and `__tests__/`
- Feature components split between `components/*` and `app/*`
- Source map assets spread across `maps/` and `data/`
- Planning/design docs at top-level (`Team_Plan/`, `Sketch/`)

## After

### Core structure changes

- Canonical Supabase code kept in `lib/supabase`; removed `src/lib/supabase`.
- Canonical types kept in `lib/types`; moved `types/global.d.ts` to `lib/types/global.d.ts`.
- Unified tests under `tests/`; moved legacy `__tests__` content to:
  - `tests/unit/components`
  - `tests/unit/utils`
- Created `features/` and migrated feature code:
  - `features/map`
  - `features/calendar`
  - `features/settings`
  - `features/auth`
  - `features/feed`
  - `features/home`
  - `features/gamification`
- Kept shared primitives/layout in:
  - `components/ui`
  - `components/layout`

### Map/data asset consolidation

- Created `assets/maps` and moved source-only map inputs there:
  - `maps/source` -> `assets/maps/source`
  - `maps/raster` -> `assets/maps/raster`
  - `data/MQ_Full.geojson` -> `assets/maps/MQ_Full.geojson`
  - `data/mq-pdfs` -> `assets/maps/mq-pdfs`
  - `data/mq-exports` -> `assets/maps/mq-exports`
- Kept runtime-public assets unchanged:
  - `public/maps`
  - `public/tiles`

### Docs/project material

- `Team_Plan/` -> `docs/project/team_plan/`
- `Sketch/` -> `docs/project/sketch/`
- Added `docs/README.md` for structure and workflow orientation.

## Path and alias impact

- Existing `@/*` alias remains valid.
- Code now uses stable feature paths like:
  - `@/features/map/...`
  - `@/features/calendar/...`
  - `@/features/settings/...`

## Intentionally left as-is

- `public/maps` and `public/tiles` were retained because runtime code fetches from `/maps/...` and tile serving can be required for map UX.
- Existing non-feature shared modules in `components/` and `lib/` were preserved when they are cross-feature or infrastructural.
