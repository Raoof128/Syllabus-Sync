# Database Operations Summary Report

**Date:** 2026-01-19  
**Project:** Syllabus Sync

---

## A) High-Level Summary: Current Database State

### Schema Overview

The database consists of the following core tables:

| Table | Purpose | Ownership Model |
|-------|---------|-----------------|
| `profiles` | User profile data (email, name, student_id) | `id` = auth.users.id |
| `units` | Academic units/subjects | `user_id` → profiles.id |
| `class_times` | Class schedule for units | Via `unit_id` → units.id |
| `deadlines` | Assignments, exams, quizzes | `user_id` → profiles.id |
| `events` | Campus events | `user_id` (NULL = public) |
| `notifications` | User notifications | `user_id` → profiles.id |
| `user_preferences` | User settings | `user_id` → profiles.id |
| `gamification_profiles` | XP, streaks, levels | `user_id` → profiles.id |
| `xp_events` | XP transaction log | `user_id` → profiles.id |

### User Identity Model ✅

The database implements a **unified user identity model**:

1. **auth.users.id** (managed by Supabase Auth)
2. **profiles.id** (same as auth.users.id via FK constraint)
3. All domain tables reference **user_id** → auth.users.id

**Key Confirmation:**
- `profiles.id` = `auth.users.id` (enforced by foreign key)
- All user-owned data uses `user_id` column
- Single source of truth for user identity

### Ownership Enforcement ✅

Every domain table enforces user ownership:

- **units**: `user_id NOT NULL` + `UNIQUE (user_id, code)`
- **deadlines**: `user_id NOT NULL` with FK to auth.users
- **events**: `user_id` (nullable for public events)
- **notifications**: `user_id NOT NULL`
- **user_preferences**: `user_id NOT NULL UNIQUE`
- **gamification_profiles**: `user_id NOT NULL UNIQUE`
- **xp_events**: `user_id NOT NULL`

### Row Level Security (RLS) ✅

All tables have RLS enabled with policies that enforce:
- Users can only access their own data
- Events can be public (user_id = NULL) or private

---

## B) Schema Actions Applied/Recommended

### Already Applied (via migrations)

1. **20260114011650**: Added `user_id` columns to units, deadlines, events
2. **20260114013136**: Added soft deletes, constraints, defaults
3. **20260114014506**: Removed redundant `due_at` field, added FK constraints
4. **20260114015445**: Simplified events table (removed legacy `event_date`/`event_time`)

### Corrections Made in This Session

1. **Fixed `seed.sql`**:
   - Changed events to use `start_at`/`end_at` instead of legacy `event_date`/`event_time`
   - Added `user_id` to units and deadlines
   - Added `unit_id` foreign key to deadlines
   - Changed `UNIQUE` constraint on units to `(user_id, code)` instead of just `code`

2. **Created operational scripts**:
   - `scripts/db-operations.ts` - TypeScript script for database operations
   - `scripts/inspect-and-create-profile.sql` - SQL for profile creation
   - `scripts/comprehensive-db-operations.sql` - Full inspection and sample data

---

## C) Sample Data Generation

### Profile Creation Script

To create the requested profile (`pouya@mq.edu.au`), run this SQL:

```sql
-- First, create auth user via Supabase dashboard or API
-- Then run this to create/update profile:

DO $$
DECLARE
    v_user_id uuid;
BEGIN
    SELECT id INTO v_user_id FROM profiles WHERE email = 'pouya@mq.edu.au';
    
    IF v_user_id IS NOT NULL THEN
        UPDATE profiles 
        SET full_name = 'Pouya Developer',
            student_id = '15555',
            updated_at = NOW()
        WHERE id = v_user_id;
    END IF;
END $$;
```

### Sample Data per User

The `comprehensive-db-operations.sql` script generates:

**Per User:**
- 2-3 Units with unique codes
- 4 Class times per user (2 per unit)
- 3-4 Deadlines (assignments, quizzes, exams)
- 1-2 Personal events

**Public Events (shared):**
- Welcome Week Kickoff (Jan 20)
- Career Fair 2026 (Jan 22)
- Free Pizza Friday (Jan 24)
- Study Skills Workshop (Jan 28)
- Tech Talk: AI in Education (Feb 5)
- Campus Club Fair (Feb 10)

---

## D) How to Run

### Option 1: Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to SQL Editor
4. Paste and run `scripts/comprehensive-db-operations.sql`

### Option 2: Node.js Script

```bash
cd /Users/pouya/Documents/Projects/syllabus-sync
node scripts/db-operations.js
```

### Option 3: Supabase CLI

```bash
cd /Users/pouya/Documents/Projects/syllabus-sync
supabase db reset  # This will run seed.sql
```

---

## E) Data Integrity Verification

### Checks Implemented

1. **Orphan Record Prevention**
   - All FK constraints use `ON DELETE CASCADE`
   - Ensures child records are deleted when parent is removed

2. **Duplicate Prevention**
   - `UNIQUE (user_id, code)` on units
   - `UNIQUE (user_id)` on gamification_profiles and user_preferences

3. **User Isolation**
   - RLS policies enforce `WHERE user_id = auth.uid()`
   - Users cannot see or modify other users' data

4. **Soft Deletes**
   - `deleted_at` column on units, deadlines, events, notifications
   - Allows recovery of accidentally deleted data

---

## Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `scripts/db-operations.ts` | Created | TypeScript database operations |
| `scripts/inspect-and-create-profile.sql` | Created | SQL for profile inspection |
| `scripts/comprehensive-db-operations.sql` | Created | Full DB operations script |
| `supabase/seed.sql` | Fixed | Updated to match current schema |

---

## Verification Queries

### Check User Ownership

```sql
SELECT 
    p.email,
    COUNT(DISTINCT u.id) as units,
    COUNT(DISTINCT d.id) as deadlines,
    COUNT(DISTINCT e.id) as events
FROM profiles p
LEFT JOIN units u ON p.id = u.user_id
LEFT JOIN deadlines d ON p.id = d.user_id
LEFT JOIN events e ON p.id = e.user_id
GROUP BY p.email;
```

### View All Events

```sql
SELECT 
    COALESCE(p.email, 'PUBLIC') as owner,
    e.title,
    e.start_at,
    e.category
FROM events e
LEFT JOIN profiles p ON e.user_id = p.id
WHERE e.deleted_at IS NULL
ORDER BY e.start_at;
```

---

*Report generated by Database Operations Script - 2026-01-19*
