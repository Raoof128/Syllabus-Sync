# Changelog

All notable changes to **The Syllabus Sync** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.3.0] - 2025-12-31

### Added

#### New Features
- **DeadlineForm component** (`components/deadlines/DeadlineForm.tsx`) - Full deadline management dialog
- **Units list on Home page** - My Units section with stats and full CRUD
- **Deadlines on Calendar page** - Full deadline management integrated into calendar
- **Stress level indicator** - Shows on Home page header with emoji
- **Mobile responsive sidebar** - Hamburger menu for mobile devices
- **University branding** - GraduationCap logo in Header and Sidebar
- **Campus buildings list** - Quick reference on Map page
- **Google Maps embed** - Preview map of Macquarie University campus
- **Notification indicator** - Red dot on bell icon in header

#### New Tests
- `tests/UnitForm.test.tsx` - Unit form component tests (Frontend)
- `tests/UnitCard.test.tsx` - Unit card component tests (Frontend)
- `tests/stores.test.ts` - Store unit tests (Frontend)

### Changed

#### Page Restructuring
- **Home page** now includes full Units management (was separate page)
- **Calendar page** now includes full Deadlines management (was separate page)
- Removed standalone `/units` and `/deadlines` pages
- Simplified navigation: Home → Calendar → Map → Feed → Settings

#### Bug Fixes
- Fixed UUID hydration issues in `sampleUnits.ts` - now uses stable IDs
- Fixed version mismatch in settings page - now uses `APP_CONFIG.version`
- Fixed Twitter typo in config.ts - "Macquaborieuni" → "macquarieuni"
- Fixed constants.ts duplication - now re-exports from config.ts
- Removed unused imports across multiple files

#### UI/UX Improvements
- Removed internal labels ("Week 6", "Phase 2") - replaced with "Coming Soon"
- Header settings icon now links to `/settings` page
- Demo user updated to "Alex Chen" for realistic demo
- Improved mobile responsiveness throughout

### Removed
- `app/units/page.tsx` - Merged into Home page
- `app/deadlines/page.tsx` - Merged into Calendar page
- Removed "Units" and "Deadlines" from sidebar navigation

### File Ownership (Frontend/Backend)

#### Frontend Files (Pouya)
- `app/home/page.tsx` - Home dashboard with units
- `app/calendar/page.tsx` - Calendar with deadlines
- `components/deadlines/DeadlineForm.tsx` - Deadline form dialog
- `components/layout/Header.tsx` - Updated with branding
- `components/layout/Sidebar.tsx` - Mobile responsive
- All test files in `tests/`

#### Backend Files (Raouf)
- `lib/config.ts` - App configuration
- `data/sampleUnits.ts` - Sample data with stable IDs
- `app/map/page.tsx` - Map page with Google Maps
- `app/settings/page.tsx` - Settings with clear data

---

## [0.2.0] - 2025-12-30

### Added
- Complete project documentation in `AGENT.md`
- Comprehensive changelog tracking
- Team role separation (Pouya: Frontend, Raouf: Backend)
- Testing infrastructure with Vitest
- Component test files for home widgets
- Custom hooks: `useHydration` and `useLocalStorage`
- Error boundary and loading states
- 404 Not Found page

### Changed
- Updated README.md with current team structure
- Improved state management with proper hydration checks
- Enhanced UnitForm with validation
- Updated package.json to version 0.2.0

### Documentation
- Created comprehensive AGENT.md
- Updated README.md team section
- Added detailed file structure documentation
- Documented API reference and types

---

## [0.1.0] - 2025-12-28

### Added - Phase 1 Complete ✅

#### Core Infrastructure
- Next.js 16.1.1 with App Router setup
- TypeScript 5.x configuration
- Tailwind CSS 3.4 + Shadcn UI integration
- ESLint and Prettier configuration
- Git repository initialization

#### Layout Components
- `Sidebar.tsx` - Navigation sidebar with active state
- `Header.tsx` - Top header with user profile and notifications
- `app/layout.tsx` - Root layout with Sidebar + Header

#### Home Dashboard (`app/home/page.tsx`)
- Complete home dashboard implementation
- Grid layout for widgets
- Sample data seeding on first visit
- Hydration handling for Zustand stores

#### Home Components
- `TodaySchedule.tsx` - Today's classes widget
  - Displays classes for current day
  - Shows time and location
  - Color-coded by unit
  - Empty state handling
- `NextDeadline.tsx` - Next deadline tracker
  - Shows upcoming deadline with priority
  - Time remaining display
  - Priority color coding
  - Empty state handling
- `EventsFeed.tsx` - Today's events preview
  - Filters events for today
  - Category badges
  - Location and time display
  - Link to full feed page
- `QuickActions.tsx` - Quick navigation buttons
  - Map and Calendar shortcuts

#### State Management (Zustand)
- `unitsStore.ts` - Units state management
  - CRUD operations for units
  - `getTodayClasses()` selector
  - `getUnitByCode()` selector
  - localStorage persistence
- `deadlinesStore.ts` - Deadlines state management
  - CRUD operations for deadlines
  - `getUpcoming()` selector
  - `getStressLevel()` algorithm
  - `toggleComplete()` action
  - localStorage persistence

#### Unit Management Components
- `UnitCard.tsx` - Display unit with schedule
  - Color indicator
  - Building and room info
  - Class times list
  - Edit/Delete actions
- `UnitForm.tsx` - Add/Edit unit form
  - Multi-step class time addition
  - Color picker
  - Building selection
  - Form validation
  - Duplicate detection

#### Pages
- `app/page.tsx` - Root redirect to /home
- `app/home/page.tsx` - Home dashboard
- `app/feed/page.tsx` - Events feed with filtering
- `app/calendar/page.tsx` - Calendar placeholder
- `app/map/page.tsx` - Map placeholder
- `app/settings/page.tsx` - Settings placeholder

#### Types & Configuration
- `lib/types/index.ts` - TypeScript type definitions
  - Unit, ClassTime, Deadline, Event types
  - DayOfWeek, StressLevel types
- `lib/config.ts` - App configuration
  - University branding
  - Demo user settings
  - Brand colors
  - Campus buildings
  - Feature flags
- `lib/constants.ts` - Constants and enums

#### Sample Data
- `data/sampleUnits.ts`
  - 3 sample units (COMP2310, COMP3300, ENGL100)
  - Sample deadlines with various priorities
  - Relative dates for demo consistency
- `data/sampleEvents.ts`
  - 20+ campus events across categories
  - Career, Social, Academic, Free Food events
  - Today and upcoming events

#### Shadcn UI Components
- `badge.tsx` - Badge component
- `button.tsx` - Button component
- `card.tsx` - Card component
- `dialog.tsx` - Dialog/Modal component
- `dropdown-menu.tsx` - Dropdown menu
- `input.tsx` - Input field
- `label.tsx` - Form label
- `select.tsx` - Select dropdown

#### Utilities
- `lib/utils.ts` - Utility functions
  - `cn()` - Class name merging
- Date handling with date-fns
- UUID generation for IDs

#### Styling
- `app/globals.css` - Global styles
- Tailwind CSS configuration
- Macquarie University color scheme
  - Primary Red: #A6192E
  - Primary Blue: #002A45
  - Accent Gold: #FFB81C

### Features Implemented

#### Home Dashboard Features
- ✅ Today's class schedule
- ✅ Next deadline display
- ✅ Today's events feed
- ✅ Quick navigation actions
- ✅ Responsive grid layout
- ✅ Empty state handling
- ✅ Sample data on first visit

#### Events Feed Features
- ✅ Event filtering by category
- ✅ Category badges (Career, Social, Academic, Free Food)
- ✅ Date and time display
- ✅ Location information
- ✅ Responsive event cards

#### State Management Features
- ✅ localStorage persistence
- ✅ Hydration handling
- ✅ CRUD operations
- ✅ Computed selectors
- ✅ Stress level algorithm

---

## [Unreleased] - Phase 2 (In Progress)

### Planned - Phase 2 (Weeks 3-4)

#### Database Integration
- [ ] Supabase setup and configuration
- [ ] Database schema design
  - [ ] Users table
  - [ ] Units table with foreign keys
  - [ ] Class times table
  - [ ] Deadlines table
  - [ ] Events table
- [ ] Migration from localStorage to Supabase
- [ ] Real-time subscriptions for data updates

#### API Development
- [ ] Next.js API routes
  - [ ] `/api/units` - Units CRUD
  - [ ] `/api/deadlines` - Deadlines CRUD
  - [ ] `/api/events` - Events CRUD
- [ ] Error handling and validation
- [ ] API response types

#### Enhanced Features
- [ ] Unit Form improvements
  - [ ] Better validation
  - [ ] Conflict detection
  - [ ] Bulk import
- [ ] Deadline Management
  - [ ] Full deadline form
  - [ ] Deadline list page
  - [ ] Completion tracking
  - [ ] Notifications
- [ ] Stress Forecast
  - [ ] Visual stress indicator
  - [ ] Week preview
  - [ ] Recommendations

#### Settings Page
- [ ] Profile settings
- [ ] Notification preferences
- [ ] Theme customization
- [ ] Data export/import

---

## [Unreleased] - Phase 3 (Week 5) - Calendar

### Planned Features
- [ ] FullCalendar integration
- [ ] Calendar views (month/week/day)
- [ ] Class schedule visualization
- [ ] Deadline markers on calendar
- [ ] Event integration
- [ ] Drag and drop support
- [ ] Export to .ics format

---

## [Unreleased] - Phase 4 (Week 6) - Map

### Planned Features
- [ ] Leaflet map integration
- [ ] Macquarie University campus map
- [ ] Building markers with info
- [ ] Room search functionality
- [ ] Walking directions between buildings
- [ ] Current location tracking
- [ ] Nearby facilities (cafes, libraries)

---

## [Unreleased] - Phase 5 (Week 7) - Events & Polish

### Planned Features
- [ ] Event RSVP functionality
- [ ] Event reminders
- [ ] Event search and filtering
- [ ] Event categories management
- [ ] Push notifications
- [ ] Mobile optimization
- [ ] UI/UX refinements
- [ ] Performance optimization

---

## [Unreleased] - Phase 6 (Week 8) - Demo Preparation

### Planned Deliverables
- [ ] Demo script preparation
- [ ] Pitch deck (9 slides)
- [ ] Demo video recording
- [ ] User guide documentation
- [ ] Admin documentation
- [ ] Final testing and bug fixes
- [ ] Production deployment

---

## Version History Summary

| Version | Date | Status | Key Features |
|---------|------|--------|--------------|
| 0.1.0   | Dec 30, 2025 | Current | Documentation, Testing |
| 0.0.0   | Dec 28, 2025 | Released | Phase 1 Complete |

---

## Development Guidelines

### Version Numbering
- **MAJOR.MINOR.PATCH** (e.g., 1.2.3)
- **MAJOR**: Breaking changes or major milestones
- **MINOR**: New features (Phase completions)
- **PATCH**: Bug fixes and minor improvements

### Changelog Categories
- **Added**: New features
- **Changed**: Changes to existing features
- **Deprecated**: Features to be removed
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security updates

### Commit Message Convention
- `feat:` New feature (bumps MINOR)
- `fix:` Bug fix (bumps PATCH)
- `docs:` Documentation only
- `style:` Code formatting
- `refactor:` Code restructuring
- `test:` Test updates
- `chore:` Build/config changes
- `BREAKING CHANGE:` (bumps MAJOR)

---

## Contributors

### Core Team
- **Pouya** - Frontend Lead, UI/UX, State Management
- **Raouf** - Backend Lead, Database, API Development

### Acknowledgments
- Macquarie University for inspiration
- Open source community for amazing tools

---

**Note:** This project is under active development. Features and dates are subject to change.

**Last Updated:** December 30, 2025

