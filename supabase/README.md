# Supabase Notes

## Source Of Truth

The authoritative database history for this repository is the ordered SQL files in `supabase/migrations/`.

Do not treat a single schema snapshot as the canonical deployment source when the migration chain is available.

## Contents

```text
supabase/
├── migrations/   timestamped migration history
├── archive/      older helper/archive SQL artifacts
└── seed_dev.sql  development seed helper
```

## How To Work With It

Typical workflow:

```bash
supabase link --project-ref <project-ref>
supabase db push
supabase migration new <name>
```

## Current Documentation Contract

- Canonical schema history: `supabase/migrations/`
- Reference snapshot: `docs/database/database-schema.sql`
- Deployment checklist: `docs/operations/deployment-checklist.md`
- Environment setup: `docs/operations/ENVIRONMENT_SETUP.md`

## Reconciliation Notes

This repository still contains `docs/database/database-schema.sql` and some archived SQL material, but the current app/API surface should be reconciled against `supabase/migrations/` first.

