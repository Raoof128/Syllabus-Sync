# 🗺️ The Syllabus Sync - Team Roadmap

**Updated:** 2025-12-27  
**Phase:** Post-Phase 1 - Team Coordination

---

## 🎯 Current Status

### ✅ **Pouya - COMPLETE**
- Home Tab fully implemented
- State management (Zustand) setup
- All code pushed to GitHub main branch
- Ready for team to start

### 🚧 **Raouf - READY TO START**
- Waiting to pull latest code
- Will implement Map, Database, Settings

### 🚧 **Kit - READY TO START**
- Waiting to pull latest code
- Will implement Calendar, Events Feed

---

## 📋 Immediate Next Steps (This Week)

### 🔴 **STEP 1: Team Sync Meeting (Required - 30 min)**

**Agenda:**
1. **Pouya:** Demo the home page (5 min)
   - Show TodaySchedule, NextDeadline, EventsFeed components
   - Explain state management structure
   - Walk through project structure

2. **Git Workflow Agreement (10 min)**
   - Decide: Feature branches or direct to main?
   - Agree on commit message format
   - Set up communication channel (Discord/Slack/WhatsApp)

3. **Task Distribution Confirmation (10 min)**
   - Confirm who does what
   - Set deadlines for placeholder pages
   - Plan next sync meeting

4. **Q&A (5 min)**

---

### 🔴 **STEP 2: Everyone Pull Latest Code**

```bash
# Clone repository (if haven't yet)
git clone https://github.com/[YOUR-USERNAME]/syllabus-sync.git
cd syllabus-sync

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Test locally
npm run dev
# Visit http://localhost:3000
```

**Verify you see:**
- ✅ Sidebar with navigation
- ✅ Header with search bar
- ✅ Home page with Today's Schedule
- ✅ Next Deadline widget
- ✅ Events Feed

---

## 👤 **POUYA - Next Tasks**

### **Week 2 Tasks (This Week)**

#### 1️⃣ **Create Unit Form Component (Priority: HIGH)**
**File:** `components/units/UnitForm.tsx`

**Requirements:**
- Modal dialog using Shadcn Dialog component
- Two modes: Add New Unit / Edit Unit
- Form fields:
  - Unit Code (e.g., COMP2310)
  - Unit Name (e.g., Computer Networks)
  - Building (e.g., C5C)
  - Room (e.g., 204)
  - Color picker (Macquarie colors: Red, Blue, Gold)
  - Class Times (multiple):
    - Day dropdown (Mon-Sun)
    - Start Time (e.g., 09:00)
    - End Time (e.g., 11:00)
    - Add/Remove class time buttons
- Form validation:
  - All fields required except color (default to red)
  - Time validation (end > start)
  - No duplicate class times
- Actions:
  - Save button → calls unitsStore.addUnit() or updateUnit()
  - Delete button (Edit mode only) → calls unitsStore.removeUnit()
  - Cancel button → closes dialog

**Integration:**
- Add "Add Unit" button to Home page
- Add "Edit" button to each class in TodaySchedule

**Testing:**
```bash
npm run dev
# Test:
# 1. Add a new unit
# 2. Edit existing unit
# 3. Delete a unit
# 4. Verify localStorage persistence (refresh page)
```

**Estimated Time:** 3-4 hours

---

#### 2️⃣ **Mobile Responsive Design (Priority: MEDIUM)**

**Files to Update:**
- `components/layout/Sidebar.tsx`
- `components/layout/Header.tsx`
- `app/page.tsx`

**Requirements:**
- Mobile breakpoint: `md:` (768px)
- Sidebar:
  - Hidden on mobile
  - Hamburger menu icon in header
  - Slide-out drawer on mobile (Shadcn Sheet component)
- Home page grid:
  - 2 columns on desktop (`md:grid-cols-2`)
  - 1 column on mobile (stack vertically)
- Test on:
  - Mobile (< 768px)
  - Tablet (768px - 1024px)
  - Desktop (> 1024px)

**Estimated Time:** 2-3 hours

---

### **Week 3-4 Tasks (Next 2 Weeks)**

#### 3️⃣ **Stress Forecast Algorithm Enhancement**

**File:** `lib/store/deadlinesStore.ts`

**Current Algorithm:**
```typescript
// Weighted points by priority with time decay
totalPoints >= 12 = High stress
totalPoints >= 6 = Busy
otherwise = Low stress
```

**Notes:**
- Uses all upcoming deadlines (not just urgent)
- Priority weights: Urgent 4, High 3, Medium 2, Low 1
- Time decay: nearer deadlines carry more weight

**Estimated Time:** 2-3 hours

---

#### 4️⃣ **Deadline Management UI**

**New Component:** `components/deadlines/DeadlineForm.tsx`

**Requirements:**
- Add/Edit/Delete deadlines
- Fields:
  - Title
  - Unit (dropdown from unitsStore)
  - Due Date & Time
  - Priority (Low/Medium/High/Urgent)
  - Type (Assignment/Quiz/Exam/Project)
  - Notes (optional)
- Integration with deadlinesStore

**Estimated Time:** 3-4 hours

---

## 👤 **RAOUF - Tasks**

### **Week 2 Tasks (This Week)**

#### 1️⃣ **Create Placeholder Pages (Priority: CRITICAL)**

These pages are needed to prevent 404 errors when clicking sidebar links.

**A) Map Page**

**File:** `app/map/page.tsx`

```typescript
export default function MapPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Campus Map</h1>
      <div className="bg-gray-100 h-96 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Map coming soon...</p>
      </div>
    </div>
  );
}
```

**B) Settings Page**

**File:** `app/settings/page.tsx`

```typescript
export default function SettingsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Settings</h1>
      <div className="bg-gray-100 p-6 rounded-lg">
        <p className="text-gray-500">Settings page coming soon...</p>
      </div>
    </div>
  );
}
```

**Commit & Push:**
```bash
git add app/map/page.tsx app/settings/page.tsx
git commit -m "feat: Add placeholder pages for Map and Settings"
git push origin main
```

**Estimated Time:** 15 minutes

---

#### 2️⃣ **Database Setup Research & Planning (Priority: HIGH)**

**Options to Research:**

**A) Supabase (Recommended)**
- Pros: Free tier, PostgreSQL, real-time, auth built-in
- Cons: Learning curve
- Setup: https://supabase.com/docs

**B) Firebase**
- Pros: Easy setup, Google integration
- Cons: NoSQL (different from current structure)

**C) Local JSON Files (Quick MVP)**
- Pros: No external dependencies
- Cons: Not scalable, no real-time

**Decision Point:**
- For demo (Feb): Local JSON or Supabase free tier
- For production: Supabase

**Action Items:**
1. Create Supabase account
2. Create new project: "syllabus-sync"
3. Design database schema:
   - Users table
   - Units table
   - Deadlines table
   - Events table
4. Document in `DATABASE_SCHEMA.md`

**Estimated Time:** 2-3 hours

---

### **Week 3-4 Tasks (Next 2 Weeks)**

#### 3️⃣ **Supabase Integration**

**New File:** `lib/supabase/client.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

**Update Stores:**
- Migrate from localStorage to Supabase
- Keep localStorage as fallback

**Estimated Time:** 4-5 hours

---

### **Week 5-6 Tasks (Map Implementation)**

#### 4️⃣ **Leaflet Map Integration**

**Dependencies:**
```bash
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

**New Component:** `components/map/CampusMap.tsx`

**Requirements:**
- Leaflet map centered on Macquarie University
- Building markers with names
- Click marker → show building info
- Current location tracking (if permission granted)

**Data Needed:**
- Building coordinates (lat/lng)
- Building names
- Room numbers

**Macquarie Buildings Data:**
```typescript
const buildings = [
  { name: 'C5C', lat: -33.7738, lng: 151.1144 },
  { name: 'W6A', lat: -33.7741, lng: 151.1138 },
  // ... add all buildings
];
```

**Resources:**
- Macquarie campus map: https://www.mq.edu.au/about/campus-services-and-facilities/maps
- Use Google Maps to get coordinates

**Estimated Time:** 6-8 hours

---

#### 5️⃣ **Navigation Routing**

**Feature:** Show route from Building A to Building B

**Library:** Leaflet Routing Machine

**Requirements:**
- "Get Directions" button
- Start location (current or selected building)
- End location (class building)
- Walking route on map
- Estimated walk time

**Estimated Time:** 4-5 hours

---

## 👤 **KIT - Tasks**

### **Week 2 Tasks (This Week)**

#### 1️⃣ **Create Placeholder Calendar Page (Priority: CRITICAL)**

**File:** `app/calender/page.tsx`

```typescript
export default function Page() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Calendar</h1>
      <div className="bg-gray-100 h-96 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Calendar coming soon...</p>
      </div>
    </div>
  );
}
```

**Commit & Push:**
```bash
git add app/calender/page.tsx
git commit -m "feat: Add placeholder page for Calendar"
git push origin main
```

**Estimated Time:** 5 minutes

---

#### 2️⃣ **FullCalendar Research & Planning (Priority: HIGH)**

**Research:**
1. Read FullCalendar React docs: https://fullcalendar.io/docs/react
2. Explore examples: https://fullcalendar.io/docs/react#example-projects
3. Understand event structure
4. Check Zustand integration for events

**Decision Points:**
- Which view to use (month/week/day/all)?
- How to integrate with unitsStore and deadlinesStore?
- How to style with Tailwind?

**Create Document:** `CALENDAR_PLAN.md`
- List of features
- Technical approach
- Timeline (1 week)

**Estimated Time:** 2-3 hours

---

### **Week 5 Tasks (Calendar Implementation)**

#### 3️⃣ **FullCalendar Setup**

**Dependencies:**
```bash
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction
```

**New Component:** `components/calendar/FullCalendarView.tsx`

**Requirements:**
- Month view (default)
- Week view
- Day view
- Display 3 types of events:
  - **Classes** (from unitsStore) - color matches unit color
  - **Deadlines** (from deadlinesStore) - red/orange based on priority
  - **Campus Events** (from eventsStore) - category colors

**Event Structure:**
```typescript
{
  id: 'unique-id',
  title: 'COMP2310 Lecture',
  start: '2025-01-27T09:00:00',
  end: '2025-01-27T11:00:00',
  color: '#A6192E',
  extendedProps: {
    type: 'class',
    location: 'C5C 204'
  }
}
```

**Features:**
- Click event → show details popup
- Filter by type (classes/deadlines/events)
- Navigate months
- Today button

**Estimated Time:** 6-8 hours

---

#### 4️⃣ **Calendar Sync with Stores**

**Challenge:** Auto-update calendar when:
- User adds new unit → new classes appear
- User adds deadline → appears on calendar
- Events are updated → refresh calendar

**Solution:** Use Zustand subscriptions

**Example:**
```typescript
const units = useUnitsStore(state => state.units);
const deadlines = useDeadlinesStore(state => state.deadlines);

const calendarEvents = useMemo(() => {
  // Convert units to events
  // Convert deadlines to events
  // Return combined array
}, [units, deadlines]);
```

**Estimated Time:** 3-4 hours

---

### **Week 7 Tasks (Events Feed Enhancement)**

#### 5️⃣ **Events Store Creation**

**New File:** `lib/store/eventsStore.ts`

**State:**
```typescript
interface EventsStore {
  events: Event[];
  addEvent: (event: Event) => void;
  removeEvent: (id: string) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  getUpcoming: (limit?: number) => Event[];
  getByCategory: (category: EventCategory) => Event[];
}
```

**Features:**
- CRUD operations
- localStorage persistence
- Filter by category
- Sort by date

**Estimated Time:** 2-3 hours

---

#### 6️⃣ **Interactive Events Feed**

**Update:** `components/home/EventsFeed.tsx`

**New Features:**
- "RSVP" button → track attendance
- "Remind Me" button → browser notification
- Category filter chips (All/Career/Social/Academic/Free Food)
- Search events
- "See All Events" link → new page

**New Page:** `app/events/page.tsx`

**Requirements:**
- Full events list (not just 3)
- Filter sidebar
- Search bar
- Calendar view toggle

**Estimated Time:** 4-5 hours

---

## 🔄 Git Workflow (For All Team Members)

### **Option A: Feature Branches (Recommended for Team)**

```bash
# Before starting work
git pull origin main

# Create feature branch
git checkout -b feature/map-placeholder
# or
git checkout -b feature/calendar-integration
# or
git checkout -b feature/unit-form

# Make changes, test locally
npm run dev

# Commit changes
git add .
git commit -m "feat: Add map placeholder page"

# Push to GitHub
git push origin feature/map-placeholder

# Create Pull Request on GitHub
# Team reviews → Merge to main

# After merge, delete branch
git checkout main
git pull origin main
git branch -d feature/map-placeholder
```

---

### **Option B: Direct to Main (Faster, but riskier)**

```bash
# Pull latest
git pull origin main

# Make changes
# ...

# Commit
git add .
git commit -m "feat: Add settings page"

# Push
git push origin main
```

**⚠️ Warning:** Only use this if:
- You communicate changes to team
- You test before pushing
- You don't break existing features

---

## 📅 Weekly Schedule

### **Week 2 (This Week) - Placeholder Pages**
- **Pouya:** Unit Form + Mobile responsive
- **Raouf:** Map placeholder + Settings placeholder + Database research
- **Kit:** Calendar placeholder + FullCalendar research
- **Meeting:** Friday - Show progress

### **Week 3 - Core Features Part 1**
- **Pouya:** Deadline management + Stress forecast
- **Raouf:** Supabase integration
- **Kit:** Start FullCalendar integration
- **Meeting:** Wednesday - Mid-week check-in

### **Week 4 - Core Features Part 2**
- **Pouya:** Polish Home page + Unit management
- **Raouf:** Complete Supabase migration
- **Kit:** Complete FullCalendar
- **Meeting:** Friday - Demo calendar

### **Week 5 - Calendar Deep Dive**
- **Kit:** Calendar refinements + sync with stores
- **Pouya & Raouf:** Support Kit as needed
- **Meeting:** End of week - Calendar demo

### **Week 6 - Map Implementation**
- **Raouf:** Leaflet integration + building markers
- **Pouya & Kit:** Support Raouf as needed
- **Meeting:** End of week - Map demo

### **Week 7 - Events & Polish**
- **Kit:** Events feed enhancement
- **Pouya:** UI refinements
- **Raouf:** Map routing
- **Meeting:** Wednesday - Full app demo

### **Week 8 - Demo Prep**
- **All:** Bug fixes, testing, demo script
- **Pouya:** Create pitch deck
- **Raouf:** Final database checks
- **Kit:** Final calendar/events polish
- **Meeting:** Practice presentation

---

## 🚨 Communication Protocol

### **Daily Standups (Optional but Recommended)**
- Post in group chat (3 min each):
  1. What I did yesterday
  2. What I'm doing today
  3. Any blockers?

### **When You Need Help**
1. Try to solve for 30 min
2. Google/ChatGPT for 30 min
3. Ask team in group chat
4. Schedule quick call if needed

### **Before Pushing Code**
1. Run lint after each edit (`npm run lint`) and confirm `Lint OK`
2. Run tests (`npm run test`)
3. Run format check (`npm run format:check`)
4. Test locally (`npm run dev`)
5. Check for console errors
6. Test on mobile (if UI changes)
7. Write clear commit message

### **Merge Conflicts**
- Don't panic
- Ask team before resolving
- Use VS Code merge conflict tool
- Test after resolving

---

## 📊 Progress Tracking

### **Weekly Checklist (Copy to group chat)**

```
**Week 2 Progress - [Date]**

Pouya:
- [ ] Unit Form component
- [ ] Mobile responsive design
- [ ] Updated agent.md
- [ ] Updated CHANGELOG.md

Raouf:
- [ ] Map placeholder page
- [ ] Settings placeholder page
- [ ] Database research complete
- [ ] DATABASE_SCHEMA.md created

Kit:
- [ ] Calendar placeholder page
- [ ] FullCalendar research complete
- [ ] CALENDAR_PLAN.md created

Blockers:
- [List any issues]

Next Meeting: [Date/Time]
```

---

## 🎯 Demo Preparation (Week 8)

### **Demo Script (5 minutes)**

**Minute 1:** Introduction
- "We built The Syllabus Sync to help MQ students manage their campus life"
- Show logo, explain problem

**Minute 2:** Home Page
- Today's schedule
- Next deadline
- Events feed

**Minute 3:** Calendar
- Show class schedule
- Filter deadlines
- Navigate weeks

**Minute 4:** Map
- Find building
- Get directions
- Current location

**Minute 5:** Call to Action
- Request official data access
- Pilot program proposal
- Q&A

### **Pitch Deck (9 slides)**
1. Title + Team
2. Problem Statement
3. Solution Overview
4. Home Page Demo
5. Calendar Demo
6. Map Demo
7. Technical Stack
8. Next Steps (Pilot Program)
9. Thank You + Contact

---

## 📞 Emergency Contacts

- **Group Chat:** [Platform - Discord/WhatsApp/Slack]
- **Emergency Meeting:** [How to schedule]
- **Code Review:** [Who reviews what]

---

**Remember:**
- ✅ Read agent.md before starting
- ✅ Update CHANGELOG.md after finishing
- ✅ Test before pushing
- ✅ Communicate blockers early
- ✅ Have fun building! 🚀

---

*Last Updated: 2025-12-27*
