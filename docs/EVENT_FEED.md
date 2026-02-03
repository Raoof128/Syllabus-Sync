# Event Feed - Public University Announcement Board

## Overview

The Event Feed is a public university announcement board that displays campus-wide events visible to ALL users. Events are read-only and managed by administrators, ensuring consistent and official information.

## Features

### 📢 Public Event Board
- **Global Visibility**: All events are visible to every user (authenticated and anonymous)
- **Read-Only**: Users cannot edit or delete public events
- **Official Content**: Events are managed by university administrators only

### 📅 Personal Calendar Integration
- **One-Click Add**: Users can add any public event to their personal calendar
- **Instant Sync**: Added events appear immediately in the Calendar tab
- **User Control**: Once added, users can:
  - Delete the event from their calendar
  - Navigate to the event location
  - Set notification preferences
  - View event details

### 🎨 Modern Design
- **Category Colors**: Visual distinction by event type (Career, Academic, Social, Free Food)
- **Featured Events**: Highlighted priority events with special badges
- **Responsive Layout**: Works seamlessly on mobile, tablet, and desktop
- **Professional Styling**: Clean, modern university aesthetic

## Architecture

### Database Tables

#### 1. `public_events` (Global Events)
```sql
CREATE TABLE public.public_events (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  all_day boolean DEFAULT false,
  location text NOT NULL,
  building text,  -- Building code (e.g., "C5C")
  room text,      -- Room number
  category text,  -- Career, Social, Academic, Free Food
  image_url text,
  is_featured boolean DEFAULT false,
  priority integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz,
  deleted_at timestamptz  -- Soft delete
);
```

**Key Points:**
- No `user_id` - these are global events
- Only service role can INSERT/UPDATE/DELETE
- Everyone can SELECT (including anonymous users)
- `is_featured` and `priority` control visibility

#### 2. `events` (User Calendar Events)
```sql
CREATE TABLE public.events (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,  -- Owner
  source_public_event_id uuid,  -- Links to public event if copied
  title text NOT NULL,
  description text NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  all_day boolean DEFAULT false,
  location text NOT NULL,
  building text,
  room text,
  category text,
  image_url text,
  notification_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz,
  deleted_at timestamptz
);
```

**Key Points:**
- Each event has a `user_id` (user-owned)
- `source_public_event_id` tracks which public event was copied
- Users have full CRUD permissions on their own events
- RLS policies enforce data isolation

### Database Function

#### `add_public_event_to_calendar(p_public_event_id)`
```sql
CREATE FUNCTION add_public_event_to_calendar(p_public_event_id uuid)
RETURNS uuid  -- Returns the new event ID
```

**Behavior:**
1. Checks authentication (must be logged in)
2. Checks if user already added this event (prevents duplicates)
3. Copies public event to user's calendar table
4. Returns the new event ID or existing event ID

### Components

#### 1. `PublicFeedClient`
Main feed page component
- Fetches public events from `publicEventsStore`
- Displays search and filters
- Shows featured events banner
- Grid layout of event cards
- Sidebar with stats and announcements

**Location:** `/components/feed/PublicFeedClient.tsx`

#### 2. `PublicEventCard`
Individual event card
- Displays event title, description, date, time, location
- Category badge with color coding
- "Add to Calendar" button with loading states
- Navigation button (if building specified)
- Click to open detail modal

**Location:** `/components/feed/PublicEventCard.tsx`

#### 3. `EventDetailModal`
Full event details in a modal
- Gradient header with category styling
- Complete event information
- Location details with building info
- "Add to Calendar" button
- Map navigation link

**Location:** `/components/feed/EventDetailModal.tsx`

#### 4. `EventsFeed` (Home Page)
Today's events widget on home page
- Shows public events happening TODAY
- Quick preview of 3-5 events
- "View All" button links to full feed

**Location:** `/components/home/EventsFeed.tsx`

### State Management

#### `publicEventsStore`
Zustand store for public events
- `events`: Array of all public events
- `featuredEvents`: Filtered featured events
- `isLoading`: Loading state
- `addedToCalendar`: Set of event IDs already added by user
- `fetchPublicEvents()`: Loads events from database
- `addToCalendar(eventId)`: Copies event to user calendar
- `checkUserEvents()`: Checks which events user already added

**Location:** `/lib/store/publicEventsStore.ts`

#### `eventsStore`
Zustand store for user's personal calendar events
- Manages user-owned events in `events` table
- Automatically loads on calendar page
- Shows events added from public feed

**Location:** `/lib/store/eventsStore.ts`

## User Flow

### Viewing Events
1. User navigates to `/feed` (Event Feed page)
2. `PublicFeedClient` loads and fetches public events
3. Events are displayed with filters and search
4. User can browse, filter by category, search, and sort

### Adding to Calendar
1. User clicks "Add to Calendar" button on an event card
2. `publicEventsStore.addToCalendar(eventId)` is called
3. Backend function `add_public_event_to_calendar` executes:
   - Checks if already added (idempotent)
   - Copies event data to `events` table
   - Links via `source_public_event_id`
4. Button changes to "✓ Added to Calendar"
5. Event immediately appears in user's Calendar tab

### Managing Added Events
1. User navigates to `/calendar`
2. `eventsStore` loads user's personal events
3. Events from public feed are included (have `source_public_event_id`)
4. User can:
   - Delete from their calendar (doesn't affect public event)
   - Set notifications
   - Navigate to location
   - View details

## Rules & Permissions

### Public Events
- ✅ Anyone can VIEW (even anonymous)
- ❌ Regular users CANNOT edit
- ❌ Regular users CANNOT delete
- ✅ Admin/service role can manage

### User Calendar Events
- ✅ Users can CREATE (by adding from feed or manually)
- ✅ Users can READ (only their own)
- ✅ Users can UPDATE (only their own)
- ✅ Users can DELETE (only their own)
- ❌ Users CANNOT see other users' calendar events

## RLS (Row Level Security)

### `public_events`
```sql
-- Everyone can read (not deleted)
CREATE POLICY "Anyone can read public events"
ON public.public_events FOR SELECT
USING (deleted_at IS NULL);
```

### `events`
```sql
-- Users can only see their own events
CREATE POLICY "Users can read own events"
ON public.events FOR SELECT
USING (user_id = auth.uid() AND deleted_at IS NULL);

-- Users can insert their own events
CREATE POLICY "Users can insert own events"
ON public.events FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own events
CREATE POLICY "Users can update own events"
ON public.events FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own events (soft delete)
CREATE POLICY "Users can delete own events"
ON public.events FOR DELETE
USING (user_id = auth.uid());
```

## Styling & Design

### Category Colors
```typescript
Career:      Blue   (💼)
Social:      Purple (🎉)
Academic:    Green  (📚)
Free Food:   Amber  (🍕)
```

### Featured Events
- Gradient amber/orange badge "✨ Featured"
- Higher priority in sorting
- Displayed in banner carousel
- More prominent styling

### Responsive Design
- Mobile: Single column grid
- Tablet: 2 column grid
- Desktop: 3 column grid
- Sidebar: Collapses on mobile

## API Endpoints

### GET `/api/public-events`
Fetches all public events (used by store)
- No authentication required
- Returns events with `deleted_at IS NULL`
- Sorted by priority and date

### POST `/api/events`
Creates a user calendar event
- Requires authentication
- Used when manually creating events
- Can also be used by `add_public_event_to_calendar` function

## Sample Events

The migration `20260203000000_public_events.sql` includes 15+ sample events:
- Career Fair 2026
- O-Week Welcome Festival
- Free Pizza Friday
- Study Skills Workshop
- Tech Networking Night
- Student Club Fair
- Movie Night
- Resume Writing Workshop
- And more...

All events are dynamically dated relative to NOW() + intervals.

## Future Enhancements

### Potential Features
- [ ] Event registration/RSVP
- [ ] Event reminders via email/push notifications
- [ ] Event categories customization
- [ ] Event sharing (social media)
- [ ] Event feedback/ratings
- [ ] Event photos/gallery
- [ ] Recurring events
- [ ] Event attendance tracking
- [ ] QR code check-in
- [ ] Event recommendations based on user interests

## Testing

### Manual Testing Checklist
- [ ] View events on feed page without login
- [ ] Search and filter events
- [ ] Sort events by date/priority/category
- [ ] Click event card to open detail modal
- [ ] Add event to calendar (requires login)
- [ ] Verify "Already Added" message on duplicate add
- [ ] Check event appears in Calendar tab
- [ ] Delete event from calendar (should not affect public event)
- [ ] Navigate to building from event card
- [ ] View today's events on home page
- [ ] Test responsive layout on mobile

## Troubleshooting

### Events Not Showing
1. Check if migration ran: `supabase migration list`
2. Verify RLS policies: `SELECT * FROM public_events` (should be visible)
3. Check browser console for errors
4. Verify `publicEventsStore.fetchPublicEvents()` is called

### "Add to Calendar" Not Working
1. Verify user is authenticated
2. Check database function exists: `add_public_event_to_calendar`
3. Check `events` table has proper RLS policies
4. Verify `source_public_event_id` column exists

### Events Not in Calendar
1. Check `eventsStore` loaded data
2. Verify `user_id` matches authenticated user
3. Check `deleted_at IS NULL`
4. Verify RLS policies allow user to read their events

## Deployment

### Required Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for admin operations)

### Database Setup
1. Run migration: `supabase migration up`
2. Verify tables created
3. Verify sample data inserted
4. Test RLS policies

### Production Considerations
- Public events should be managed via admin panel (not included yet)
- Consider caching for better performance
- Monitor database query performance
- Set up alerts for failed event additions
- Regular backup of public events data

## Related Files

### Components
- `/components/feed/PublicFeedClient.tsx`
- `/components/feed/PublicEventCard.tsx`
- `/components/feed/EventDetailModal.tsx`
- `/components/feed/FeaturedEventsBanner.tsx`
- `/components/feed/QuickStats.tsx`
- `/components/feed/AnnouncementsSection.tsx`
- `/components/feed/FeedSkeletons.tsx`
- `/components/home/EventsFeed.tsx`

### State Management
- `/lib/store/publicEventsStore.ts`
- `/lib/store/eventsStore.ts`

### Types
- `/lib/types/publicEvents.ts`
- `/lib/types/index.ts`

### Database
- `/supabase/migrations/20260203000002_public_events.sql`
- `/database-schema.sql`

### Pages
- `/app/feed/page.tsx`
- `/app/calendar/page.tsx`
- `/app/calendar/CalendarClient.tsx`

## Support

For questions or issues:
1. Check this documentation
2. Review database schema
3. Check browser console for errors
4. Review Supabase logs
5. Test with sample data

---

**Last Updated:** February 3, 2026
**Version:** 1.0.0
**Status:** ✅ Production Ready
