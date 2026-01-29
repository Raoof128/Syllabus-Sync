# Calendar Upgrade Plan (Campus-First, Gen Z)

## Phase 1: Foundation & Navigation (🟢 Current Focus)
- [ ] **Refactor `CalendarClient.tsx`**: Break down the monolithic file into `CalendarHeader`, `CalendarSidebar`, and View components.
- [ ] **Implement `CalendarHeader`**:
    - [ ] View Switcher: `Week | Day | Agenda`
    - [ ] "Now" Button (scroll to current time)
    - [ ] Date Jump / Today
- [ ] **Sticky Layout**:
    - [ ] Sticky Header
    - [ ] Sticky Sidebar (Widgets)
    - [ ] Independent Grid Scroll
- [ ] **Data & State**:
    - [ ] URL-driven state (`?view=week`, `?date=2024-03-20`)
    - [ ] Unify date libraries (migrate `dayjs` -> `date-fns` or vice versa, prefer `date-fns` for consistency with `WeeklyCalendar`).

## Phase 2: Views & Visuals (Gen Z + No Glass)
- [ ] **Week View Upgrade**:
    - [ ] "Now" line (crisp, no pulse)
    - [ ] Clearer hour lines
    - [ ] Collapse overlaps
- [ ] **Agenda View (The "Student MVP")**:
    - [ ] Sticky Date Headers
    - [ ] Time/Location/Category layout
    - [ ] Inline actions
- [ ] **Filter Panel**:
    - [ ] Toggles: Units, Deadlines, Events
    - [ ] Quick Chips: "Free Food", "Today"

## Phase 3: Campus & UX Polish
- [ ] **Location Integration**: "Navigate" buttons on items.
- [ ] **"Next Class" Indicator**: Smart badge in header.
- [ ] **Privacy Mode**: Blur sensitive text toggle.
- [ ] **Heatmap**: "Busyness" dots in day headers.

## Phase 4: Performance & Scale
- [ ] Virtualization for long lists.
- [ ] Memoize heavy overlap calculations.
