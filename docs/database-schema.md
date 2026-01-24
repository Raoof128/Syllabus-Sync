# Database Schema Documentation

## Overview

The Syllabus Sync database follows a strict **user-centric architecture** where all data is owned and isolated by user through Row Level Security (RLS) policies.

```mermaid
erDiagram
    auth.users ||--|| profiles : "1:1"
    auth.users ||--|| gamification_profiles : "1:1"
    auth.users ||--|| units : "1:N"
    auth.users ||--|| deadlines : "1:N"
    auth.users ||--|| events : "1:N (nullable)"
    auth.users ||--|| notifications : "1:N"
    auth.users ||--|| user_preferences : "1:1"

    units ||--|| class_times : "1:N"
    units ||--|{ deadlines.unit_id }| deadlines : "1:N (optional)"

    gamification_profiles ||--|| xp_events : "1:N"
```

## Core Tables

### `auth.users`

Supabase managed authentication table - the single source of truth for user identity.

| Column       | Type          | Description                   |
| ------------ | ------------- | ----------------------------- |
| `id`         | `uuid`        | Primary key - user identifier |
| `email`      | `text`        | User email address            |
| `created_at` | `timestamptz` | Account creation timestamp    |
| `updated_at` | `timestamptz` | Last update timestamp         |

### `profiles`

Extended user profile data with academic information.

| Column       | Type          | Constraints                                | Description                           |
| ------------ | ------------- | ------------------------------------------ | ------------------------------------- |
| `id`         | `uuid`        | PRIMARY KEY, FOREIGN KEY → `auth.users.id` | User ID (1:1 with auth.users)         |
| `email`      | `text`        | NOT NULL                                   | User email (mirrored from auth.users) |
| `full_name`  | `text`        |                                            | User's full display name              |
| `student_id` | `text`        |                                            | University student ID number          |
| `course`     | `text`        |                                            | Course of study                       |
| `year`       | `text`        |                                            | Academic year                         |
| `avatar_url` | `text`        |                                            | Profile picture URL                   |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT NOW()                    | Profile creation time                 |
| `updated_at` | `timestamptz` | DEFAULT NOW()                              | Last update time                      |

### `gamification_profiles`

User XP and progress tracking for gamification system.

| Column               | Type          | Constraints                                      | Description             |
| -------------------- | ------------- | ------------------------------------------------ | ----------------------- |
| `id`                 | `uuid`        | PRIMARY KEY                                      | Gamification profile ID |
| `user_id`            | `uuid`        | FOREIGN KEY → `auth.users.id`, UNIQUE            | User ID                 |
| `xp`                 | `integer`     | NOT NULL, DEFAULT 0, CHECK (xp >= 0)             | Experience points       |
| `streak_days`        | `integer`     | NOT NULL, DEFAULT 0, CHECK (streak_days >= 0)    | Current activity streak |
| `longest_streak`     | `integer`     | NOT NULL, DEFAULT 0, CHECK (longest_streak >= 0) | Best streak achieved    |
| `last_activity_date` | `date`        |                                                  | Date of last activity   |
| `created_at`         | `timestamptz` | NOT NULL, DEFAULT NOW()                          | Creation time           |
| `updated_at`         | `timestamptz` | DEFAULT NOW()                                    | Last update time        |

### `units`

User's academic course units with user isolation.

| Column        | Type          | Constraints                             | Description                    |
| ------------- | ------------- | --------------------------------------- | ------------------------------ |
| `id`          | `uuid`        | PRIMARY KEY                             | Unit ID                        |
| `user_id`     | `uuid`        | FOREIGN KEY → `auth.users.id`, NOT NULL | Owner of this unit             |
| `code`        | `text`        | NOT NULL                                | Course code (e.g., "COMP2310") |
| `name`        | `text`        | NOT NULL                                | Course title                   |
| `color`       | `text`        | NOT NULL, DEFAULT '#3B82F6'             | Unit color for UI              |
| `description` | `text`        |                                         | Course description             |
| `location`    | `jsonb`       |                                         | Building/room location data    |
| `created_at`  | `timestamptz` | NOT NULL, DEFAULT NOW()                 | Creation time                  |
| `updated_at`  | `timestamptz` | DEFAULT NOW()                           | Last update time               |
| `deleted_at`  | `timestamptz` |                                         | Soft delete timestamp          |

**Indexes:**

- `units_user_code_unique` UNIQUE(`user_id`, `code`) - Ensures each user can have same unit codes
- `idx_units_code` ON `code` - For unit lookup
- `idx_units_user_id` ON `user_id` - For user's units
- `idx_units_deleted_at` ON `deleted_at` - For soft delete filtering

### `class_times`

Class schedule for each unit.

| Column       | Type          | Constraints                                                                                             | Description     |
| ------------ | ------------- | ------------------------------------------------------------------------------------------------------- | --------------- |
| `id`         | `uuid`        | PRIMARY KEY                                                                                             | Class time ID   |
| `unit_id`    | `uuid`        | FOREIGN KEY → `units.id`, NOT NULL, ON DELETE CASCADE                                                   | Associated unit |
| `day`        | `text`        | NOT NULL, CHECK (day IN ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']) | Day of week     |
| `start_time` | `text`        | NOT NULL, CHECK (start_time ~ '^([01]?[0-9]\|2[0-3]):[0-5][0-9]$')                                      | "09:00" format  |
| `end_time`   | `text`        | NOT NULL, CHECK (end_time ~ '^([01]?[0-9]\|2[0-3]):[0-5][0-9]$')                                        | "11:00" format  |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT NOW()                                                                                 | Creation time   |

**Constraints:**

- Time format validation ensures 24-hour format
- `valid_times` CHECK ensures `start_time < end_time`

**Indexes:**

- `idx_class_times_unit_id` ON `unit_id` - For unit's class schedule
- `idx_class_times_day` ON `day` - For day-based filtering

### `deadlines`

User's assignments and exams with priority tracking.

| Column        | Type          | Constraints                                                                                    | Description            |
| ------------- | ------------- | ---------------------------------------------------------------------------------------------- | ---------------------- |
| `id`          | `uuid`        | PRIMARY KEY                                                                                    | Deadline ID            |
| `user_id`     | `uuid`        | FOREIGN KEY → `auth.users.id`, NOT NULL                                                        | Owner of this deadline |
| `title`       | `text`        | NOT NULL                                                                                       | Assignment/exam title  |
| `description` | `text`        |                                                                                                | Detailed description   |
| `unit_code`   | `text`        | NOT NULL                                                                                       | Course code reference  |
| `unit_id`     | `uuid`        | FOREIGN KEY → `units.id`, ON DELETE SET NULL                                                   | Direct unit reference  |
| `due_date`    | `timestamptz` | NOT NULL                                                                                       | Due date/time          |
| `priority`    | `text`        | NOT NULL, DEFAULT 'Medium', CHECK (priority IN ['Low', 'Medium', 'High', 'Urgent'])            | Priority level         |
| `type`        | `text`        | NOT NULL, DEFAULT 'Assignment', CHECK (type IN ['Assignment', 'Exam', 'Quiz', 'Presentation']) | Assessment type        |
| `completed`   | `boolean`     | NOT NULL, DEFAULT false                                                                        | Completion status      |
| `created_at`  | `timestamptz` | NOT NULL, DEFAULT NOW()                                                                        | Creation time          |
| `updated_at`  | `timestamptz` | DEFAULT NOW()                                                                                  | Last update time       |
| `deleted_at`  | `timestamptz` |                                                                                                | Soft delete timestamp  |

**Indexes:**

- `idx_deadlines_user_id` ON `user_id` - User's deadlines
- `idx_deadlines_unit_code` ON `unit_code` - By course code
- `idx_deadlines_unit_id` ON `unit_id` - Direct unit reference
- `idx_deadlines_due_date` ON `due_date` - Chronological sorting
- `idx_deadlines_completed` ON `completed` - Completion filtering
- `idx_deadlines_deleted_at` ON `deleted_at` - Soft delete filtering

### `events`

Campus events (public and private) with time-based filtering.

| Column        | Type          | Constraints                                                                                     | Description                       |
| ------------- | ------------- | ----------------------------------------------------------------------------------------------- | --------------------------------- |
| `id`          | `uuid`        | PRIMARY KEY                                                                                     | Event ID                          |
| `user_id`     | `uuid`        | FOREIGN KEY → `auth.users.id`, NULL = public event                                              | Owner (NULL for public events)    |
| `title`       | `text`        | NOT NULL                                                                                        | Event title                       |
| `description` | `text`        | NOT NULL                                                                                        | Event description                 |
| `start_at`    | `timestamptz` | NOT NULL                                                                                        | Event start time                  |
| `end_at`      | `timestamptz` |                                                                                                 | Event end time (optional)         |
| `all_day`     | `boolean`     | NOT NULL, DEFAULT false                                                                         | All-day event flag                |
| `location`    | `text`        | NOT NULL                                                                                        | Event location                    |
| `building`    | `text`        |                                                                                                 | Building name for map integration |
| `category`    | `text`        | NOT NULL, DEFAULT 'Academic', CHECK (category IN ['Career', 'Social', 'Academic', 'Free Food']) | Event category                    |
| `image_url`   | `text`        |                                                                                                 | Event image URL                   |
| `created_at`  | `timestamptz` | NOT NULL, DEFAULT NOW()                                                                         | Creation time                     |
| `updated_at`  | `timestamptz` | DEFAULT NOW()                                                                                   | Last update time                  |
| `deleted_at`  | `timestamptz` |                                                                                                 | Soft delete timestamp             |

**Constraints:**

- `valid_time_range` CHECK ensures `end_at >= start_at` when end_at is set

**Indexes:**

- `idx_events_start_at` ON `start_at` - Chronological sorting
- `idx_events_end_at` ON `end_at` - End time filtering
- `idx_events_category` ON `category` - Category-based filtering
- `idx_events_user_id` ON `user_id` - User's events
- `idx_events_deleted_at` ON `deleted_at` - Soft delete filtering

### `notifications`

User notification system with read status tracking.

| Column       | Type          | Constraints                                                                          | Description            |
| ------------ | ------------- | ------------------------------------------------------------------------------------ | ---------------------- |
| `id`         | `uuid`        | PRIMARY KEY                                                                          | Notification ID        |
| `user_id`    | `uuid`        | FOREIGN KEY → `auth.users.id`, NOT NULL                                              | Recipient user         |
| `title`      | `text`        | NOT NULL                                                                             | Notification title     |
| `message`    | `text`        | NOT NULL                                                                             | Notification content   |
| `type`       | `text`        | NOT NULL, DEFAULT 'system', CHECK (type IN ['deadline', 'event', 'class', 'system']) | Notification type      |
| `read`       | `boolean`     | NOT NULL, DEFAULT false                                                              | Read status            |
| `link`       | `text`        |                                                                                      | Action link (optional) |
| `related_id` | `uuid`        |                                                                                      | Related entity ID      |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT NOW()                                                              | Creation time          |
| `deleted_at` | `timestamptz` |                                                                                      | Soft delete timestamp  |

**Indexes:**

- `idx_notifications_user_id` ON `user_id` - User's notifications
- `idx_notifications_read` ON `read` - Unread filtering
- `idx_notifications_deleted_at` ON `deleted_at` - Soft delete filtering

### `user_preferences`

User application settings and preferences.

| Column                  | Type          | Constraints                                                    | Description                   |
| ----------------------- | ------------- | -------------------------------------------------------------- | ----------------------------- |
| `id`                    | `uuid`        | PRIMARY KEY                                                    | Preference ID                 |
| `user_id`               | `uuid`        | FOREIGN KEY → `auth.users.id`, NOT NULL, UNIQUE                | User ID                       |
| `theme`                 | `text`        | DEFAULT 'system', CHECK (theme IN ['light', 'dark', 'system']) | UI theme                      |
| `notifications_enabled` | `boolean`     | NOT NULL, DEFAULT true                                         | Global notification toggle    |
| `email_notifications`   | `boolean`     | NOT NULL, DEFAULT false                                        | Email notification preference |
| `push_notifications`    | `boolean`     | NOT NULL, DEFAULT true                                         | Push notification preference  |
| `created_at`            | `timestamptz` | NOT NULL, DEFAULT NOW()                                        | Creation time                 |
| `updated_at`            | `timestamptz` | DEFAULT NOW()                                                  | Last update time              |

**Indexes:**

- `idx_user_preferences_user_id` ON `user_id` - User's preferences

## Supporting Tables

### `xp_events`

Historical record of all XP-earning activities.

| Column         | Type          | Constraints                                                                                                                                                                                                     | Description           |
| -------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `id`           | `uuid`        | PRIMARY KEY                                                                                                                                                                                                     | Event ID              |
| `user_id`      | `uuid`        | FOREIGN KEY → `auth.users.id`, NOT NULL                                                                                                                                                                         | User who earned XP    |
| `event_type`   | `text`        | NOT NULL, CHECK (event_type IN ['deadline_completed', 'deadline_early', 'daily_login', 'streak_bonus', 'unit_added', 'event_attended', 'profile_completed', 'first_deadline', 'weekly_goal', 'level_up_bonus']) | Activity type         |
| `xp_amount`    | `integer`     | NOT NULL, CHECK (xp_amount > 0)                                                                                                                                                                                 | XP earned             |
| `reference_id` | `uuid`        |                                                                                                                                                                                                                 | Related entity ID     |
| `metadata`     | `jsonb`       | NOT NULL, DEFAULT '{}'                                                                                                                                                                                          | Additional event data |
| `created_at`   | `timestamptz` | NOT NULL, DEFAULT NOW()                                                                                                                                                                                         | Event time            |

**Indexes:**

- `idx_xp_events_user_id` ON `user_id` - User's XP history
- `idx_xp_events_created_at` ON `created_at` - Chronological XP history
- `idx_xp_events_event_type` ON `event_type` - Activity type filtering
- `idx_xp_events_reference_id` ON `reference_id` - Related entity lookup

### `xp_config`

Configuration for XP values by activity type.

| Column        | Type      | Constraints                       | Description              |
| ------------- | --------- | --------------------------------- | ------------------------ |
| `id`          | `uuid`    | DEFAULT gen_random_uuid(), UNIQUE | Config ID                |
| `event_type`  | `text`    | PRIMARY KEY                       | Activity type identifier |
| `base_xp`     | `integer` | NOT NULL, CHECK (base_xp > 0)     | Base XP amount           |
| `description` | `text`    |                                   | Activity description     |

## Materialized Views

### `mv_deadline_analytics`

Pre-computed deadline statistics for performance.

| Column               | Type          | Description                   |
| -------------------- | ------------- | ----------------------------- |
| `user_id`            | `uuid`        | User ID (partition key)       |
| `total_deadlines`    | `bigint`      | Total number of deadlines     |
| `completed_count`    | `bigint`      | Number of completed deadlines |
| `pending_count`      | `bigint`      | Number of pending deadlines   |
| `overdue_count`      | `bigint`      | Number of overdue deadlines   |
| `next_deadline_date` | `timestamptz` | Next upcoming deadline date   |

**Unique Index:** `idx_mv_deadline_analytics_key` ON `user_id`

### `mv_xp_leaderboard`

Gamification leaderboard with rankings.

| Column        | Type      | Description           |
| ------------- | --------- | --------------------- |
| `user_id`     | `uuid`    | User ID               |
| `full_name`   | `text`    | User's display name   |
| `avatar_url`  | `text`    | Profile picture       |
| `xp`          | `integer` | Total XP points       |
| `streak_days` | `integer` | Current streak        |
| `level`       | `integer` | Calculated user level |
| `rank`        | `integer` | Leaderboard ranking   |

**Unique Index:** `idx_mv_xp_leaderboard_user_id` ON `user_id`

### `mv_user_activity_summary`

User activity and engagement metrics.

| Column               | Type          | Description             |
| -------------------- | ------------- | ----------------------- |
| `user_id`            | `uuid`        | User ID (partition key) |
| `last_activity_date` | `date`        | Date of last activity   |
| `streak_days`        | `integer`     | Current activity streak |
| `longest_streak`     | `integer`     | Best streak achieved    |
| `total_actions`      | `bigint`      | Total XP events count   |
| `last_action_at`     | `timestamptz` | Most recent action time |

**Unique Index:** `idx_mv_user_activity_summary_user_id` ON `user_id`

## Views

### `user_details`

Convenient view joining profiles and gamification data.

```sql
CREATE OR REPLACE VIEW public.user_details AS
SELECT
    p.id, p.email, p.full_name, p.student_id, p.course, p.year, p.avatar_url,
    p.created_at, p.updated_at,
    gp.xp, gp.streak_days, gp.longest_streak, gp.last_activity_date,
    CASE
        WHEN gp.xp IS NULL OR gp.xp < 0 THEN 1
        ELSE LEAST(100, FLOOR(SQRT(gp.xp::float / 25)) + 1)::integer
    END AS level
FROM public.profiles p
LEFT JOIN public.gamification_profiles gp ON p.id = gp.user_id;
```

**Columns:**

- All profile fields plus gamification data
- Computed `level` based on XP formula: `FLOOR(SQRT(xp / 25)) + 1`

## Security & Isolation

### Row Level Security (RLS)

All user-owned tables have RLS enabled with policies ensuring:

- Users can only access their own data via `auth.uid() = user_id`
- Profile access via `auth.uid() = id` (1:1 with auth.users)
- Events allow both public (`user_id IS NULL`) and owned events
- Class times inherit unit ownership through EXISTS subquery

### Isolation Guarantees

1. **Complete Data Isolation:** Each user's data is completely separate
2. **No Cross-User Data Access:** RLS prevents any unauthorized access
3. **Consistent Foreign Keys:** All relationships maintain referential integrity
4. **Soft Deletes:** Preserve data integrity while allowing removal from active queries

## Performance Considerations

### Indexing Strategy

- Primary key indexes on all tables
- Foreign key indexes for relationship queries
- Frequently queried columns have dedicated indexes
- Composite unique constraints for business rules

### Query Patterns

- Use `user_details` view for user profile + gamification data
- Materialized views for analytics (refresh as needed)
- Soft deletes maintain audit trails while excluding from active queries

## Migration Strategy

The database uses timestamped migrations with:

- Sequential migration files in `supabase/migrations/`
- Comprehensive schema in `database-schema.sql` (reference document)
- RLS policies applied incrementally
- Materialized views created separately for performance

---

**Last Updated:** 2026-01-24  
**Version:** 1.0.0  
**Compatibility:** PostgreSQL 14+ with UUID-OSS extension
