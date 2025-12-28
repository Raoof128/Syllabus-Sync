# Changelog

All notable changes to The Syllabus Sync project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Pending
- ~~Unit Form component (modal dialog for Add/Edit/Delete) - Pouya~~ ✅ DONE
- ~~Placeholder pages (Map, Settings) - Raouf~~ ✅ DONE
- ~~Placeholder page (Calendar, Feed) - Kit~~ ✅ DONE
- Mobile responsive design improvements - Pouya
- FullCalendar integration - Kit (Week 5)
- Leaflet map integration - Raouf (Week 6)
- Live events feed - Kit (Week 7)
- Stress forecast algorithm - Pouya (Week 4)
- Demo preparation materials - All (Week 8)
- ~~Database schema design - Raouf~~ ✅ DONE (DATABASE_SCHEMA.md created)

---

## [0.2.0] - 2025-12-28

### Added
- **Error Handling Components**
  - `app/error.tsx` - Error boundary for runtime errors
  - `app/loading.tsx` - Loading state for page transitions
  - `app/not-found.tsx` - Custom 404 page with home navigation

- **Utility Files**
  - `lib/constants.ts` - App-wide constants (routes, colors, formats)
  - `lib/hooks/index.ts` - Hooks barrel export
  - `lib/hooks/useHydration.ts` - Client hydration tracking hook
  - `lib/hooks/useLocalStorage.ts` - localStorage sync hook
  - `.env.example` - Environment variables template

- **Test Coverage Expansion**
  - `tests/TodaySchedule.test.tsx` - Tests for TodaySchedule component
  - `tests/NextDeadline.test.tsx` - Tests for NextDeadline component
  - Total: 5 tests passing

### Changed
- **Calendar Route Fix** - Renamed `app/calender/` to `app/calendar/` (spelling fix)
- **Navigation Updates**
  - `components/layout/Sidebar.tsx` - Updated route to `/calendar`
  - `components/home/QuickActions.tsx` - Updated route to `/calendar`

- **TypeScript Configuration**
  - `tsconfig.json` - Added `"types": ["vitest/globals"]` for test type support

- **Documentation Updates**
  - `README.md` - Fixed calender → calendar in project structure
  - `docs/API_REFERENCE.md` - Fixed calender → calendar in routes

### Fixed
- **Critical Typo:** `/calender` route renamed to `/calendar` across entire codebase
- **TypeScript Errors:** Fixed missing Vitest global types in test files
- **Navigation:** All sidebar and quick action links now point to correct routes

### Project Status
- ✅ Build passing
- ✅ Lint passing  
- ✅ TypeScript passing
- ✅ 5 tests passing
- ✅ Ready for Phase 2 expansion

---

### Pouya:
**Date:** 2025-12-28  
**Scope:** Repository audit, bug fixes, and project completion  
**Summary:** Comprehensive repository audit to prepare for project expansion. Fixed critical typo, added error handling, created utility files, expanded test coverage.  
**Files Changed:** 15+ files (see [0.2.0] section above)  
**Verification:** `npm run build` ✅, `npm run lint` ✅, `npm run test` ✅  
**Follow-ups:** Project is now ready for Phase 2 expansion.

---

### Raouf:
**Date:** 2025-12-28  
**Scope:** Data seeding, stress algorithm, documentation alignment  
**Summary:** Prevented duplicate sample seeding after hydration, updated stress scoring to weighted/time-decay model, and aligned docs/routes/versions to the current codebase.  
**Files Changed:** `app/home/page.tsx`, `lib/store/deadlinesStore.ts`, `data/sampleUnits.ts`, `README.md`, `Team_Plan/AGENT.md`, `Team_Plan/TEAM_ROADMAP.md`, `Team_Plan/CHANGELOG.md`  
**Verification:** Not run (not requested)  
**Follow-ups:** ~~Consider renaming `/calender` to `/calendar` when ready to avoid misspelling.~~ ✅ DONE

### Raouf:
**Date:** 2025-12-28  
**Scope:** Lint fixes for UI copy, UnitForm effect, and Tailwind config  
**Summary:** Escaped apostrophes, removed unused imports, adjusted UnitForm initialization for lint, and switched Tailwind plugin import to ESM.  
**Files Changed:** `app/home/page.tsx`, `components/home/TodaySchedule.tsx`, `components/units/UnitCard.tsx`, `components/units/UnitForm.tsx`, `tailwind.config.ts`, `Team_Plan/CHANGELOG.md`, `Team_Plan/AGENT.md`  
**Verification:** `npm run lint` (timed out), `npx eslint app/home/page.tsx components/home/TodaySchedule.tsx components/units/UnitCard.tsx components/units/UnitForm.tsx tailwind.config.ts` (timed out)  
**Follow-ups:** Re-run lint with a longer timeout or investigate eslint performance.

### Raouf:
**Date:** 2025-12-28  
**Scope:** Lint configuration and CI workflow  
**Summary:** Scoped lint targets, added ignore paths for non-source directories, and created a GitHub Actions lint workflow.  
**Files Changed:** `eslint.config.mjs`, `package.json`, `.github/workflows/lint.yml`, `Team_Plan/CHANGELOG.md`, `Team_Plan/AGENT.md`  
**Verification:** `npm run lint`  
**Follow-ups:** None.

### Raouf:
**Date:** 2025-12-28  
**Scope:** Lint documentation  
**Summary:** Documented local lint command and CI lint workflow in project docs.  
**Files Changed:** `README.md`, `Team_Plan/AGENT.md`, `Team_Plan/CHANGELOG.md`  
**Verification:** Not run (docs-only update)  
**Follow-ups:** None.

### Raouf:
**Date:** 2025-12-28  
**Scope:** Lint success message  
**Summary:** Added a success message to the lint script and documented it.  
**Files Changed:** `package.json`, `README.md`, `Team_Plan/CHANGELOG.md`, `Team_Plan/AGENT.md`  
**Verification:** `npm run lint`  
**Follow-ups:** None.

### Raouf:
**Date:** 2025-12-28  
**Scope:** Team lint workflow guidance  
**Summary:** Documented running lint after each edit in the team workflow checklist.  
**Files Changed:** `Team_Plan/TEAM_ROADMAP.md`, `Team_Plan/CHANGELOG.md`, `Team_Plan/AGENT.md`  
**Verification:** Not run (docs-only update)  
**Follow-ups:** None.

### Raouf:
**Date:** 2025-12-28  
**Scope:** Production-grade audit and repository hardening  
**Summary:** Added professional documentation, testing/formatting tooling, CI for tests, usage examples, and workflow updates for a production-ready standard.  
**Files Changed:** `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `docs/ARCHITECTURE.md`, `docs/API_REFERENCE.md`, `.editorconfig`, `.prettierrc.json`, `.prettierignore`, `vitest.config.ts`, `tests/setup.ts`, `tests/EventsFeed.test.tsx`, `.github/workflows/test.yml`, `package.json`, `package-lock.json`, `README.md`, `Team_Plan/AGENT.md`, `Team_Plan/TEAM_ROADMAP.md`, `Team_Plan/CHANGELOG.md`  
**Verification:** `npm run lint`, `npm run test`  
**Follow-ups:** Review `npm audit` output (5 moderate vulnerabilities) and decide on remediation.  

### Raouf:
**Date:** 2025-12-28  
**Scope:** Documentation refresh  
**Summary:** Aligned all documentation with current lint/test/format workflows and added routes to API reference.  
**Files Changed:** `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `docs/ARCHITECTURE.md`, `docs/API_REFERENCE.md`, `Team_Plan/AGENT.md`, `Team_Plan/TEAM_ROADMAP.md`, `Team_Plan/CHANGELOG.md`  
**Verification:** Not run (docs-only update)  
**Follow-ups:** None.  

### Raouf:
**Date:** 2025-12-28  
**Scope:** Documentation + gitignore improvements  
**Summary:** Added a Mermaid architecture diagram to README and expanded gitignore for common tooling artifacts.  
**Files Changed:** `README.md`, `.gitignore`, `Team_Plan/CHANGELOG.md`, `Team_Plan/AGENT.md`  
**Verification:** Not run (docs-only update)  
**Follow-ups:** None.  

### Raouf:
**Date:** 2025-12-28  
**Scope:** Architecture diagram  
**Summary:** Added a Mermaid architecture diagram to the architecture overview.  
**Files Changed:** `docs/ARCHITECTURE.md`, `Team_Plan/CHANGELOG.md`, `Team_Plan/AGENT.md`  
**Verification:** Not run (docs-only update)  
**Follow-ups:** None.  

### Raouf:
**Date:** 2025-12-28  
**Scope:** Git hygiene  
**Summary:** Expanded gitignore patterns to exclude common local, cache, and IDE artifacts.  
**Files Changed:** `.gitignore`, `Team_Plan/CHANGELOG.md`, `Team_Plan/AGENT.md`  
**Verification:** Not run (docs-only update)  
**Follow-ups:** Consider removing tracked `*.DS_Store` and `.idea` files if present.  

### Raouf:
**Date:** 2025-12-28  
**Scope:** Mermaid diagram fix  
**Summary:** Fixed Mermaid labels to render correctly in README and architecture docs.  
**Files Changed:** `README.md`, `docs/ARCHITECTURE.md`, `Team_Plan/CHANGELOG.md`, `Team_Plan/AGENT.md`  
**Verification:** Not run (docs-only update)  
**Follow-ups:** None.  

---

## [0.1.1] - 2025-12-28

### Added
- **Feed Page** (`app/feed/page.tsx`) - Full event feed implementation
  - Interactive filtering by category (All, Academic, Career, Social, Free Food)
  - Event cards with descriptions, dates, times, and locations
  - Quick stats sidebar showing event counts
  - Announcements section for project updates
  - Category legend for easy reference
  - "Remind Me" buttons for each event (UI only)

- **Label Component** (`components/ui/label.tsx`)
  - Shadcn UI Label component using @radix-ui/react-label
  - Required for UnitForm component functionality

- **DayOfWeek Type** (`lib/types/index.ts`)
  - Exported DayOfWeek type for better type safety
  - Now includes Saturday and Sunday for full week coverage

### Changed
- **Calendar Page** (`app/calender/page.tsx`)
  - Complete redesign matching Map and Settings page patterns
  - Added Card-based layout with consistent styling
  - Feature preview cards for upcoming functionality
  - Planned features section with detailed descriptions
  - Development notice banner
  - Changed from centered placeholder to full-page layout

- **Sample Events Data** (`data/sampleEvents.ts`) - **CRITICAL FIX**
  - Fixed type mismatch: Changed date strings to Date objects
  - Updated time format from 24-hour (14:00) to 12-hour (2:00 PM)
  - Removed `imageUrl: null` properties (using optional typing)
  - Now properly matches Event interface type definition

- **EventsFeed Component** (`components/home/EventsFeed.tsx`) - **CRITICAL FIX**
  - Fixed incorrect import from `@/data/sampleUnits` to `@/data/sampleEvents`
  - Events now display correctly on home page

- **QuickActions Component** (`components/home/QuickActions.tsx`) - **NAVIGATION FIX**
  - Fixed Map link from `/map-live` to `/map`
  - Fixed Calendar link from `/calendar` to `/calender`
  - Navigation buttons now work correctly

- **UnitForm Component** (`components/units/UnitForm.tsx`)
  - Fixed createdAt field to use Date instead of string
  - Now matches Unit interface type definition

- **Home Page** (`app/home/page.tsx`)
  - Fixed file path comment from `// app/page.tsx` to `// app/home/page.tsx`

- **Settings Page** (`app/settings/page.tsx`)
  - Updated "Last Update" date to Dec 28, 2025

- **Types** (`lib/types/index.ts`)
  - Updated ClassTime.day to use DayOfWeek type
  - Added Saturday and Sunday to day options

### Fixed
- **404 Errors:** All navigation routes now work correctly
- **Type Safety:** All data types now match interface definitions
- **Import Paths:** Fixed incorrect import statements
- **Component Dependencies:** Resolved missing Label component

### Dependencies
- **Added:** `@radix-ui/react-label` (v1.x)

---

### Raouf:
**Date:** 2025-12-27  
**Task:** Quick Fixes - Welcome Message & Map Route

#### Changed
- **Welcome Message** (`app/page.tsx`)
  - Changed "Welcome, Raouf!" to "Welcome, Admin!"

- **Map Page Route** (`app/map-live` → `app/map`)
  - Aligned folder name and sidebar navigation to `/map`
  - Route now correctly matches the Map link in Sidebar

#### Fixed
- **Map Tab 404 Error**
  - Sidebar and page route are aligned to `/map`
  - Navigation no longer hits a missing route

**Notes:**
- Map tab now works correctly
- Welcome message is now generic for any user

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
  - "Open Map" (primary) - links to /map
  - "View Calendar" (outline) - links to /calender

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

### Raouf:
**Date:** 2025-12-27  
**Task:** Week 2 Complete - Placeholder Pages, Database Schema & UI Polish

#### Added
- **Map Placeholder Page** (`app/map/page.tsx`)
  - Responsive layout matching Home page design
  - Map placeholder with "Interactive Map Coming Soon" message
  - Feature preview cards:
    - Building Markers: Campus building locations and room info
    - Turn-by-Turn Navigation: Walking directions with estimated time
    - Live Location: Real-time GPS tracking on campus
  - Blue info banner for development status
  - "Week 6" badge indicating timeline

- **Settings Placeholder Page** (`app/settings/page.tsx`)
  - Two-column responsive layout matching Home page
  - Profile section: Student Name, Student ID (Coming Soon badges)
  - Notifications section: Deadline, Class, and Event reminders (disabled toggles)
  - Appearance section: Dark Mode toggle, Language selector
  - Privacy & Security section:
    - Data Storage status (Local badge)
    - Export Data option
    - Clear All Data option
  - Sidebar widgets:
    - Data Sync card (shows localStorage status)
    - Development status card
    - About card (version 0.1.0, phase, last update)

- **Database Schema Documentation** (`Team_Plan/DATABASE_SCHEMA.md`)
  - Chose Supabase (PostgreSQL) as database provider
  - Comprehensive reasons for Supabase selection
  - 7 table designs with full SQL CREATE statements:
    - `users`: Student profiles linked to Supabase Auth
    - `units`: Course/subject information with user ownership
    - `class_times`: Scheduled class times with day enum
    - `deadlines`: Assignments with priority and type enums
    - `events`: Public campus events with categories
    - `user_events`: Junction table for RSVPs
    - `settings`: User preferences and notification settings
  - Row Level Security (RLS) policies for all tables
  - Entity Relationship Diagram (ASCII art)
  - Implementation roadmap (Weeks 3-5)
  - Environment variables documentation
  - Dependencies list (@supabase/supabase-js)

#### Changed
- **Map Page** (`app/map/page.tsx`) - Refactored to match Home page UI:
  - Updated container to `container mx-auto p-6 max-w-7xl`
  - Changed header to use `text-gray-900` bold styling
  - Replaced gradient cards with clean white Cards
  - Changed item backgrounds to `bg-gray-50 rounded-lg hover:bg-gray-100`

- **Settings Page** (`app/settings/page.tsx`) - Refactored to match Home page UI:
  - Updated container layout to match Home page
  - Changed header styling to match app-wide design
  - Removed gradient status cards, replaced with clean styling
  - Standardized badge styles with existing patterns

#### Fixed
- **Hydration Error** (`app/layout.tsx`)
  - Added `suppressHydrationWarning` to `<body>` tag
  - Prevents React hydration mismatch errors caused by browser extensions
  - Error was caused by extensions modifying DOM before React hydration
  - Fix is safe and recommended for body/html elements

#### Removed
- N/A

**Notes:**
- All pages now have consistent UI matching Home page design language
- Used existing Shadcn components only (Card, Button, Badge)
- Pages tested and verified working at localhost:3000/map and localhost:3000/settings
- Database schema ready for Supabase project creation in Week 3
- Hydration warning fix applied for browser extension compatibility

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

*Last Updated: 2025-12-27*  
*Current Version: 0.1.0*
