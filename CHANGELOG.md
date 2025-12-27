# Changelog

All notable changes to The Syllabus Sync project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Pending
- Unit Form component (modal dialog for Add/Edit/Delete)
- Placeholder pages (Map, Calendar, Settings)
- Mobile responsive design improvements
- FullCalendar integration
- Leaflet map integration
- Live events feed
- Stress forecast algorithm
- Demo preparation materials

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

### Pouya:
**Date:** 2025-12-27  
**Task:** Sidebar navigation cleanup

#### Removed
- Duplicate "Map" tab from sidebar navigation in `components/layout/Sidebar.tsx`
- Unused `Map` icon import from lucide-react

**Notes:**
- Consolidated map navigation to single "Map + Live" option for cleaner UX

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
