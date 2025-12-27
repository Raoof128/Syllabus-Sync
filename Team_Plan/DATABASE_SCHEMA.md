# 📊 Database Schema Design

## Overview

This document outlines the database schema for The Syllabus Sync application. The initial implementation uses Supabase (PostgreSQL) as the backend database.

**Author:** Raouf  
**Created:** 2025-12-27  
**Status:** Planning Phase

---

## 🗄️ Database Provider

### Chosen Solution: **Supabase**

**Reasons:**
- ✅ Free tier with generous limits (500MB database, 1GB storage)
- ✅ PostgreSQL-based (reliable, robust, SQL-compliant)
- ✅ Built-in Authentication (email, OAuth, magic links)
- ✅ Real-time subscriptions for live data updates
- ✅ Row-level security for data protection
- ✅ Easy integration with Next.js
- ✅ Automatic API generation (REST and GraphQL)

**Supabase Dashboard:** https://supabase.com/dashboard

---

## 📋 Tables Overview

| Table Name | Description | Primary Key | Foreign Keys |
|------------|-------------|-------------|--------------|
| `users` | Student profiles and authentication | `id` (UUID) | - |
| `units` | University course units | `id` (UUID) | `user_id` → users |
| `class_times` | Scheduled class times for units | `id` (UUID) | `unit_id` → units |
| `deadlines` | Assignments and exam deadlines | `id` (UUID) | `user_id` → users, `unit_id` → units |
| `events` | Campus events | `id` (UUID) | - |
| `user_events` | Many-to-many: user RSVPs to events | `id` (UUID) | `user_id` → users, `event_id` → events |
| `settings` | User preferences and settings | `id` (UUID) | `user_id` → users |

---

## 📝 Detailed Table Schemas

### 1. `users` Table

Stores student profile information. Integrates with Supabase Auth.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  student_name TEXT,
  student_id TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see/edit their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);
```

---

### 2. `units` Table

Stores university course/subject information.

```sql
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#A6192E',
  building TEXT,
  room TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, code)
);

-- Indexes for performance
CREATE INDEX idx_units_user_id ON units(user_id);
CREATE INDEX idx_units_code ON units(code);

-- Enable RLS
ALTER TABLE units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own units" ON units
  FOR ALL USING (auth.uid() = user_id);
```

---

### 3. `class_times` Table

Stores scheduled class times for each unit (lectures, tutorials, labs).

```sql
CREATE TYPE day_of_week AS ENUM (
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
);

CREATE TABLE class_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  day day_of_week NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  class_type TEXT DEFAULT 'Lecture',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Index for querying by unit
CREATE INDEX idx_class_times_unit_id ON class_times(unit_id);
CREATE INDEX idx_class_times_day ON class_times(day);

-- Enable RLS (inherit from units)
ALTER TABLE class_times ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own class times" ON class_times
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM units WHERE units.id = class_times.unit_id AND units.user_id = auth.uid()
    )
  );
```

---

### 4. `deadlines` Table

Stores assignment deadlines, exams, and other due dates.

```sql
CREATE TYPE deadline_priority AS ENUM ('Low', 'Medium', 'High', 'Urgent');
CREATE TYPE deadline_type AS ENUM ('Assignment', 'Quiz', 'Exam', 'Project', 'Other');

CREATE TABLE deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  priority deadline_priority DEFAULT 'Medium',
  type deadline_type DEFAULT 'Assignment',
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_deadlines_user_id ON deadlines(user_id);
CREATE INDEX idx_deadlines_due_date ON deadlines(due_date);
CREATE INDEX idx_deadlines_completed ON deadlines(completed);

-- Enable RLS
ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own deadlines" ON deadlines
  FOR ALL USING (auth.uid() = user_id);
```

---

### 5. `events` Table

Stores campus-wide events (public data, not user-specific).

```sql
CREATE TYPE event_category AS ENUM ('Career', 'Social', 'Academic', 'Free Food', 'Sports', 'Other');

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT,
  category event_category DEFAULT 'Other',
  image_url TEXT,
  external_url TEXT,
  organizer TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_category ON events(category);

-- Public read access
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are publicly readable" ON events
  FOR SELECT USING (true);
```

---

### 6. `user_events` Table

Junction table for user RSVPs to events.

```sql
CREATE TABLE user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  rsvp_status TEXT DEFAULT 'interested',
  reminder_set BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, event_id)
);

-- Indexes
CREATE INDEX idx_user_events_user ON user_events(user_id);
CREATE INDEX idx_user_events_event ON user_events(event_id);

-- Enable RLS
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own RSVPs" ON user_events
  FOR ALL USING (auth.uid() = user_id);
```

---

### 7. `settings` Table

Stores user preferences and app settings.

```sql
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light',
  language TEXT DEFAULT 'en',
  deadline_reminder_hours INTEGER DEFAULT 24,
  class_reminder_minutes INTEGER DEFAULT 15,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings" ON settings
  FOR ALL USING (auth.uid() = user_id);
```

---

## 🔗 Entity Relationship Diagram

```
┌──────────────────┐       ┌──────────────────┐
│      users       │       │     events       │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │
│ email            │       │ title            │
│ student_name     │       │ description      │
│ student_id       │       │ event_date       │
│ avatar_url       │       │ category         │
│ created_at       │       │ location         │
└────────┬─────────┘       └─────────┬────────┘
         │                           │
         │ 1:N                       │ N:M
         │                           │
         ▼                           ▼
┌──────────────────┐       ┌──────────────────┐
│      units       │       │   user_events    │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │
│ user_id (FK)     │◄──────│ user_id (FK)     │
│ code             │       │ event_id (FK)    │
│ name             │       │ rsvp_status      │
│ color            │       └──────────────────┘
│ building, room   │
└────────┬─────────┘
         │
         │ 1:N
         ▼
┌──────────────────┐       ┌──────────────────┐
│   class_times    │       │   deadlines      │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │
│ unit_id (FK)     │       │ user_id (FK)     │
│ day              │       │ unit_id (FK)     │
│ start_time       │       │ title            │
│ end_time         │       │ due_date         │
│ class_type       │       │ priority         │
└──────────────────┘       │ completed        │
                           └──────────────────┘

┌──────────────────┐
│    settings      │
├──────────────────┤
│ id (PK)          │
│ user_id (FK)     │
│ theme            │
│ notifications... │
└──────────────────┘
```

---

## 🔐 Security Configuration

### Row Level Security (RLS)

All tables have RLS enabled with the following policies:

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| users | Own only | N/A (via auth) | Own only | Own only |
| units | Own only | Own only | Own only | Own only |
| class_times | Via unit owner | Via unit owner | Via unit owner | Via unit owner |
| deadlines | Own only | Own only | Own only | Own only |
| events | Public | Admin only | Admin only | Admin only |
| user_events | Own only | Own only | Own only | Own only |
| settings | Own only | Own only | Own only | Own only |

---

## 🚀 Implementation Roadmap

### Week 3: Initial Setup
- [ ] Create Supabase project
- [ ] Run SQL scripts to create tables
- [ ] Set up environment variables
- [ ] Create Supabase client (`lib/supabase/client.ts`)

### Week 4: Integration
- [ ] Migrate `unitsStore` to use Supabase
- [ ] Migrate `deadlinesStore` to use Supabase
- [ ] Add real-time subscriptions
- [ ] Implement error handling

### Week 5: Authentication (Optional for Demo)
- [ ] Set up Supabase Auth
- [ ] Create login/signup pages
- [ ] Implement session management

---

## 📦 Dependencies to Install

```bash
npm install @supabase/supabase-js
```

---

## 🔧 Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 📚 References

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

*Last Updated: 2025-12-27*
*Author: Raouf*
