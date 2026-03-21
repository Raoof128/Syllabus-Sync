# Supabase Database

> **Last verified:** 2026-03-21

This directory contains the database migration history, development seed data, and archived SQL artifacts for Syllabus Sync.

---

## Source of Truth

The **ordered SQL files in `supabase/migrations/`** are the authoritative database history. Every schema change is recorded as a timestamped, immutable migration file. Do not treat standalone schema snapshots (such as `docs/database/database-schema.sql`) as deployment sources -- they exist for reference only.

---

## Directory Structure

```
supabase/
  migrations/    Timestamped SQL migration files (source of truth)
  archive/       Older helper and archive SQL artifacts
  seed_dev.sql   Development seed data
```

---

## Common Workflows

### Link to a Supabase project

```bash
npx supabase link --project-ref <your-project-ref>
```

### Apply all pending migrations

```bash
npx supabase db push
```

### Create a new migration

```bash
npx supabase migration new <descriptive-name>
```

This creates a new timestamped file in `supabase/migrations/`. Write your SQL in the generated file, then apply it with `npx supabase db push`.

### View migration status

```bash
npx supabase migration list
```

---

## Guidelines

- **Never modify an existing migration file** after it has been applied to any environment. Create a new migration to alter or undo changes.
- **Always test migrations locally** before applying to production. Use `npx supabase db reset` against a local or staging database to verify the full migration chain.
- **Include both up and down logic** when practical, or document how to reverse a migration manually.
- **Use `SECURITY DEFINER` functions carefully** and ensure RLS policies are tested. The migration chain includes several security-hardening migrations.

---

## Related Documentation

| Document | Location |
| :--- | :--- |
| Environment Setup | [`docs/setup/ENVIRONMENT_SETUP.md`](../docs/setup/ENVIRONMENT_SETUP.md) |
| Deployment Checklist | [`docs/operations/deployment-checklist.md`](../docs/operations/deployment-checklist.md) |
| Database Schema Reference | [`docs/database/database-schema.sql`](../docs/database/database-schema.sql) |
