# Changelog

All notable changes to The Syllabus Sync project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Pending
- Unit Form component (modal dialog for Add/Edit/Delete) - Pouya
- Placeholder pages (Map, Settings) - Raouf
- Placeholder page (Calendar) - Kit
- Mobile responsive design improvements - Pouya
- FullCalendar integration - Kit (Week 5)
- Leaflet map integration - Raouf (Week 6)
- Live events feed - Kit (Week 7)
- Stress forecast algorithm - Pouya (Week 4)
- Demo preparation materials - All (Week 8)

---

### Pouya:
**Date:** 2025-12-27  
**Task:** Phase 1 Complete - Home Tab Implementation & GitHub Push

#### Added
- **Project Foundation**
  - Next.js 14 with App Router and TypeScript
  - Tailwind CSS + Shadcn UI component library
  - ESLint configuration
  - Git repository setup

- **Dependencies & Libraries**
  - Shadcn UI components: button, card, dialog, input, select, badge, dropdown-menu
  - Zustand v4 for state management
  - date-fns for date formatting
  - lucide-react for icons
  - uuid for unique ID generation

- **TypeScript Type System** (`lib/types/index.ts`)
  - `Unit` interface: id, code, name, color, location (building, room), schedule array, createdAt
  - `ClassTime` interface: id, day (DayOfWeek enum), startTime, endTime
  - `Deadline` interface: id, title, unitCode, dueDate, priority (Low/Medium/High/Urgent), type, completed, createdAt
  - `Event` interface: id, title, description, date, time, location, category (Career/Social/Academic/Free Food), imageUrl
  - `StressLevel` type: 'Low' | 'Busy' | 'High'

- **State Management Layer**
  - `unitsStore.ts`: Full CRUD operations for units with localStorage persistence
    - addUnit, removeUnit, updateUnit, getUnitByCode
    - getTodayClasses() - filters by current day, sorts by startTime
  - `deadlinesStore.ts`: Full CRUD operations for deadlines with localStorage persistence
    - addDeadline, removeDeadline, updateDeadline, toggleComplete
    - getUpcoming(limit) - retrieves next N incomplete deadlines
    - getStressLevel() - algorithm: ≥4 urgent deadlines in 7 days = High, 2-3 = Busy, <2 = Low

- **Sample Data Files**
  - `sampleUnits.ts`: 3 units (COMP2310, COMP3300, ENGL100) with Macquarie branding colors
  - `sampleEvents.ts`: 3 events (Study Workshop, Free Pizza, Career Fair)
  - 3 sample deadlines with varying priorities

- **Layout Components**
  - `Sidebar.tsx`: Navigation menu with 6 links (Home, Map, Map+Live, Calendar, Feed, Settings)
    - Active state highlighting with usePathname hook
    - Icons from lucide-react
    - Macquarie branding colors
  - `Header.tsx`: Search bar + user dropdown menu (Profile, Settings, Log out)
    - Shadcn DropdownMenu component
  - `layout.tsx`: Root layout with flex sidebar + main content area

- **Home Page Components**
  - `TodaySchedule.tsx`: Displays today's classes from unitsStore
    - Shows unit code/name, time range, location (building + room)
    - Color indicator bar matching unit color
    - Empty state: "No classes today 🎉"
  - `NextDeadline.tsx`: Shows next upcoming deadline
    - Priority badge with color coding
    - Time until deadline with formatDistanceToNow
    - Urgent icon (AlertCircle) for urgent deadlines
    - Empty state: "No upcoming deadlines 🎯"
  - `EventsFeed.tsx`: Displays sample events
    - Category badges with color coding
    - Time and location with icons
    - Hover effects
  - `QuickActions.tsx`: Two action buttons
    - "Open Map" (primary) - links to /map-live
    - "View Calendar" (outline) - links to /calendar

- **Home Page Assembly** (`app/page.tsx`)
  - 'use client' directive for state hooks
  - Auto-loads sample data on first visit
  - Personalized greeting header
  - Get Started banner for new users
  - Responsive 2-column grid layout (TodaySchedule, NextDeadline)
  - EventsFeed section
  - QuickActions section

- **Project Documentation**
  - `agent.md`: Complete project documentation with team structure, tech stack, roadmap
  - `CHANGELOG.md`: Versioned changelog following Keep a Changelog format

#### Changed
- N/A (Initial release)

#### Fixed
- N/A (Initial release)

#### Removed
- N/A (Initial release)

**Notes:**
- All code pushed to GitHub main branch
- localStorage used for MVP (will migrate to Supabase later)
- Macquarie branding colors implemented: Red #A6192E, Blue #002A45, Gold #FFB81C
- Ready for team collaboration - Raouf and Kit can now start their tasks

---

### Raouf:
**Date:** 2025-12-27  
**Task:** Sidebar cleanup & project configuration

#### Added
- **Development Workflow** (`.agent/workflows/development.md`)
  - Pre-task checklist (read agent.md, CHANGELOG.md)
  - Development and post-task documentation steps
  - Project structure reference
  - Tech stack summary

- **Git Configuration Updates** (`.gitignore`)
  - Added `agent.md` and `AGENTS.md` to gitignore
  - Added `.idea/` folder (JetBrains IDE settings)
  - Added `.vscode/` folder (VS Code settings)
  - Added `.agent/` folder (workflow files)
  - Added `*.swp`, `*.swo` (Vim swap files)

#### Changed
- N/A

#### Fixed
- N/A

#### Removed
- Duplicate "Map" tab from sidebar navigation in `components/layout/Sidebar.tsx`
- Unused `Map` icon import from lucide-react (cleanup)

**Notes:**
- Consolidated map navigation to single "Map + Live" option for cleaner UX
- Workflow file created at `.agent/workflows/development.md`
- All agent/workflow files are gitignored to keep them local

---

## [0.1.0] - 2025-01-XX (Phase 1 - Initial Setup)

### Added
- **Project Initialization**
  - Next.js 14 with App Router
  - TypeScript configuration
  - Tailwind CSS setup
  - ESLint configuration

- **Dependencies**
  - Shadcn UI component library (button, card, dialog, input, select, badge, dropdown-menu)
  - Zustand for state management
  - date-fns for date formatting
  - lucide-react for icons
  - uuid for unique IDs

- **TypeScript Type Definitions** (`lib/types/index.ts`)
  - `Unit` type with id, code, name, color, location, schedule
  - `ClassTime` type with day, startTime, endTime
  - `Deadline` type with priority levels (Low/Medium/High/Urgent)
  - `Event` type with categories (Career/Social/Academic/Free Food)
  - `StressLevel` type ('Low' | 'Busy' | 'High')

- **State Management**
  - `unitsStore.ts`: Units CRUD operations with localStorage persistence
  - `deadlinesStore.ts`: Deadlines CRUD operations with stress level calculation
  - getTodayClasses() function to filter classes by current day
  - getStressLevel() algorithm based on urgent deadlines count

- **Sample Data**
  - 3 sample units (COMP2310, COMP3300, ENGL100)
  - 3 sample deadlines with varying priorities
  - 3 sample events with different categories

- **Layout Components**
  - `Sidebar.tsx`: Navigation menu with active state highlighting
  - `Header.tsx`: Search bar and user dropdown menu
  - `layout.tsx`: Root layout with sidebar + header structure

- **Home Page Components**
  - `TodaySchedule.tsx`: Displays today's classes with time and location
  - `NextDeadline.tsx`: Shows next upcoming deadline with priority badge
  - `EventsFeed.tsx`: Lists upcoming campus events
  - `QuickActions.tsx`: Quick links to Map and Calendar

- **Home Page Assembly** (`app/page.tsx`)
  - Welcome header with personalized greeting
  - Get Started banner for first-time users
  - Responsive 2-column grid layout
  - Auto-load sample data on first visit

- **Project Structure**
  - Organized component hierarchy (ui/, home/, layout/, units/)
  - Centralized store management in lib/store/
  - Type definitions in lib/types/
  - Sample data in data/ directory

### Changed
- N/A (Initial release)

### Fixed
- N/A (Initial release)

### Removed
- N/A (Initial release)

---

## Update Template (Use this for future updates)

### Pouya:
**Date:** [YYYY-MM-DD]  
**Task:** [Brief description]

#### Added
- [New features, components, or functionality]

#### Changed
- [Modifications to existing features]

#### Fixed
- [Bug fixes and corrections]

#### Removed
- [Deprecated features or code]

**Notes:**
- [Any additional context, decisions, or important information]

---

## Version History

- **[0.1.0]** - Phase 1: Initial setup and home page implementation
- **[0.2.0]** - (Planned) Phase 2: Unit management and deadline tracking
- **[0.3.0]** - (Planned) Phase 3: Calendar integration
- **[0.4.0]** - (Planned) Phase 4: Map integration
- **[0.5.0]** - (Planned) Phase 5: Events and polish
- **[1.0.0]** - (Planned) Phase 6: Demo-ready version

---

## Contributing Guidelines

When updating this changelog:

1. **Always use the header "Pouya:"** for your updates
2. **Include the date** in YYYY-MM-DD format
3. **Categorize changes** using: Added, Changed, Fixed, Removed
4. **Be specific** - include component names, file paths, and descriptions
5. **Update version numbers** following semantic versioning:
   - MAJOR: Breaking changes (e.g., 1.0.0 → 2.0.0)
   - MINOR: New features (e.g., 0.1.0 → 0.2.0)
   - PATCH: Bug fixes (e.g., 0.1.0 → 0.1.1)

---

*Last Updated: [DATE]*  
*Current Version: 0.1.0*
