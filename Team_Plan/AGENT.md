# 🎓 The Syllabus Sync - Agent Documentation

## 📋 Project Overview

**Project Name:** The Syllabus Sync  
**Purpose:** Campus navigation and schedule management web application for Macquarie University  
**Type:** Demo/Pilot presentation for university administration  
**Timeline:** 8 weeks (Jan-Feb 2025)  
**Presentation Date:** End of February 2025

---

## 🎯 Project Goals

1. **Primary Goal:** Create a functional demo to present to Macquarie University administration
2. **Secondary Goal:** Secure approval for official data access and pilot program
3. **Long-term Vision:** Become the official campus management tool for MQ students

---

## 🚀 Core Features

### Phase 1 (Weeks 1-2) - MVP Setup ✅
- [x] Project initialization (Next.js 16 + TypeScript)
- [x] Basic layout (Sidebar + Header)
- [x] Home page with Today's Schedule
- [x] Next Deadline display
- [x] Events Feed
- [ ] Unit Form (Add/Edit/Delete units)
- [x] Placeholder pages (Map, Settings) - Raouf ✅
- [ ] Placeholder page (Calendar) - Kit

### Phase 2 (Weeks 3-4) - Core Features
- [ ] Unit Management (full CRUD)
- [ ] Deadline tracking with notifications
- [ ] Study Plan suggestions
- [ ] Stress Forecast algorithm

### Phase 3 (Week 5) - Calendar Integration
- [ ] FullCalendar setup
- [ ] Class schedule visualization
- [ ] Deadline integration
- [ ] Event integration

### Phase 4 (Week 6) - Map Integration
- [ ] Leaflet map setup
- [ ] Campus building markers
- [ ] Navigation routing (building to building)
- [ ] Current location tracking

### Phase 5 (Week 7) - Events & Polish
- [ ] Live events feed
- [ ] Event interactivity
- [ ] Building crowdedness heatmap
- [ ] UI refinements

### Phase 6 (Week 8) - Demo Preparation
- [ ] Demo script creation
- [ ] Pitch deck (9 slides)
- [ ] Demo video recording
- [ ] Testing with sample data

---

## 💻 Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Shadcn UI
- **State Management:** Zustand
- **Icons:** Lucide React

### Features & Libraries
- **Maps:** Leaflet.js + React Leaflet
- **Calendar:** FullCalendar
- **Date Handling:** date-fns
- **Storage (MVP):** localStorage
- **Storage (Production):** Supabase

### Deployment
- **Platform:** Vercel
- **Domain:** Custom domain (TBD)

---

## 👥 Team Structure

### Team Members
1. **Pouya (Frontend Lead)**
   - Responsibilities: Next.js 16 + TypeScript, Zustand state management, Home Tab
   - Current Status: ✅ Phase 1 Complete (pushed to GitHub)

2. **Raouf (Map & Database Developer)**
   - Responsibilities: Leaflet integration, navigation routing, building markers, Database setup, Settings Tab
   - Current Status: ✅ Week 2 Complete (Map & Settings pages, DATABASE_SCHEMA.md)

3. **Kit (Calendar & Feed Developer)**
   - Responsibilities: FullCalendar integration, Calendar Tab, Live Events Feed development
   - Current Status: 🚧 Ready to start Phase 3

### Roles & Responsibilities
- **Pouya (Frontend Lead):** Component architecture, state management, UI implementation, Home Tab
- **Raouf (Map & Backend):** Map features, database integration, Settings Tab
- **Kit (Calendar & Events):** Calendar integration, Events Feed, interactive features

---

## 🎨 Design System

### Macquarie University Branding
- **Primary Red:** `#A6192E`
- **Primary Blue:** `#002A45`
- **Accent Gold:** `#FFB81C`
- **Background:** White/Light gray
- **Text:** Dark gray/Black

### Component Library
- **UI Framework:** Shadcn UI
- **Components Used:** Button, Card, Dialog, Input, Select, Badge, DropdownMenu
- **Custom Components:** TodaySchedule, NextDeadline, EventsFeed, QuickActions

---

## 📁 Project Structure

```
syllabus-sync/
├── app/
│   ├── layout.tsx           # Root layout with Sidebar + Header
│   ├── page.tsx             # Root redirect
│   ├── map/                 # Map page (placeholder)
│   ├── calender/            # Calendar page (placeholder)
│   ├── settings/            # Settings page (placeholder)
│   └── globals.css
├── components/
│   ├── ui/                  # Shadcn UI components
│   ├── home/                # Home page components
│   │   ├── TodaySchedule.tsx
│   │   ├── NextDeadline.tsx
│   │   ├── EventsFeed.tsx
│   │   └── QuickActions.tsx
│   ├── layout/              # Layout components
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   └── units/               # Unit management components
│       ├── UnitForm.tsx     # (Pending)
│       └── UnitCard.tsx     # (Pending)
├── lib/
│   ├── store/               # Zustand stores
│   │   ├── unitsStore.ts    # Units state management
│   │   └── deadlinesStore.ts # Deadlines state management
│   ├── types/
│   │   └── index.ts         # TypeScript type definitions
│   └── utils.ts             # Utility functions
├── data/
│   ├── sampleUnits.ts       # Sample unit data
│   └── sampleEvents.ts      # Sample event data
└── public/
    └── images/              # Static images
```

---

## 🔧 Current Status

### ✅ Completed (as of 2025-12-27)
- Project initialization with Next.js 16 + TypeScript
- Tailwind CSS + Shadcn UI setup
- Zustand stores (unitsStore, deadlinesStore)
- TypeScript type definitions
- Layout components (Sidebar, Header)
- Home page components (TodaySchedule, NextDeadline, EventsFeed, QuickActions)
- Sample data creation
- **ALL PUSHED TO GITHUB BY POUYA** ✅

### 🚧 In Progress (Team Assignments)
- **Pouya:** Unit Form component, Mobile responsive design
- **Raouf:** Placeholder pages (Map, Settings), Database setup
- **Kit:** Placeholder page (Calendar), FullCalendar research

### ⏳ Pending
- FullCalendar integration (Kit - Week 5)
- Leaflet map integration (Raouf - Week 6)
- Live events feed (Kit - Week 7)
- Stress forecast algorithm (Pouya - Week 4)
- Demo preparation (All - Week 8)

---

## 📝 Development Workflow

### Before Starting Any Task
1. Read this `agent.md` file
2. Read `CHANGELOG.md` for recent updates
3. Pull latest changes: `git pull origin main`

### During Development
1. Create feature branch: `git checkout -b feature/[feature-name]`
2. Implement feature
3. Test locally: `npm run dev`
4. Run lint: `npm run lint`
5. Run tests: `npm run test`
6. Run format check: `npm run format:check`
7. Commit changes: `git commit -m "feat: [description]"`

### After Completing Task
1. Update this `agent.md` file with header **"Pouya:"**
2. Update `CHANGELOG.md` with header **"Pouya:"**
3. Push to GitHub: `git push origin [branch-name]`
4. Create Pull Request (if working in team)

---

## 🐛 Known Issues & Solutions

### Common Errors
1. **"localStorage is not defined"**
   - Solution: Add `'use client'` directive at top of component

2. **"Module not found"**
   - Solution: Restart dev server with `npm run dev`

3. **"Shadcn component not found"**
   - Solution: Reinstall with `npx shadcn@latest add [component-name]`

---

## 📊 Success Metrics

### Demo Success Criteria
- ✅ All core features working smoothly
- ✅ Professional UI matching Macquarie branding
- ✅ Smooth 5-minute demo walkthrough
- ✅ Pitch deck ready (9 slides)
- ✅ Request for official data access

### Technical Metrics
- Page load time: < 2 seconds
- Mobile responsive: 100%
- TypeScript coverage: 100%
- Zero console errors

---

## 📞 Contact & Resources

### Repository
- **GitHub:** `https://github.com/[USERNAME]/syllabus-sync`

### Documentation
- **Next.js Docs:** https://nextjs.org/docs
- **Shadcn UI Docs:** https://ui.shadcn.com/docs
- **Zustand Docs:** https://docs.pmnd.rs/zustand
- **Leaflet Docs:** https://leafletjs.com/reference.html
- **FullCalendar Docs:** https://fullcalendar.io/docs

### Macquarie University Resources
- **Official Site:** https://www.mq.edu.au
- **Campus Map:** https://www.mq.edu.au/about/campus-services-and-facilities/maps

---

## 📝 Update Log

### Raouf:
**Date:** 2025-12-28  
**Scope:** Data seeding, stress algorithm, documentation alignment  
**Summary:** Guarded sample data seeding until Zustand hydration, updated stress scoring to weighted/time-decay logic, and synced docs/routes/versions with current code.  
**Files Changed:** `app/home/page.tsx`, `lib/store/deadlinesStore.ts`, `data/sampleUnits.ts`, `README.md`, `Team_Plan/AGENT.md`, `Team_Plan/TEAM_ROADMAP.md`, `Team_Plan/CHANGELOG.md`  
**Verification:** Not run (not requested)  
**Follow-ups:** Consider renaming `/calender` to `/calendar` when ready to avoid misspelling.

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
**Date:** 2025-12-27  
**Task:** Week 2 Tasks Complete - Placeholder Pages, Database Schema & UI Polish

**Completed:**
- ✅ Map placeholder page (`app/map/page.tsx`)
  - Interactive Map placeholder with feature preview cards
  - Building Markers, Navigation, Live Location previews
  - Consistent UI matching Home page design
  - Route: `/map` (matches Sidebar "Map" tab)
- ✅ Settings placeholder page (`app/settings/page.tsx`)
  - Profile, Notifications, Appearance, Privacy & Security sections
  - Data Sync sidebar widget
  - About card with version info
  - Consistent UI matching Home page design
- ✅ Database Schema documentation (`Team_Plan/DATABASE_SCHEMA.md`)
  - Chose Supabase as database provider
  - Designed 7 tables: users, units, class_times, deadlines, events, user_events, settings
  - SQL scripts with Row Level Security policies
  - Entity Relationship Diagram
  - Implementation roadmap for Weeks 3-5
- ✅ UI Consistency Refactor
  - Updated Map and Settings pages to match Home page styling
  - Consistent container (`container mx-auto p-6 max-w-7xl`)
  - Consistent header styling (`text-gray-900` bold, `text-gray-600` subtitle)
  - Consistent card items (`bg-gray-50 rounded-lg hover:bg-gray-100`)
  - Blue info banners for development notices
- ✅ Hydration Error Fix (`app/layout.tsx`)
  - Added `suppressHydrationWarning` to body tag
  - Prevents errors from browser extensions modifying DOM
- ✅ Quick Fixes
  - Changed welcome message from "Raouf" to "Admin" (`app/page.tsx`)
  - Fixed Map tab 404 error by aligning Map route and sidebar link to `/map`

**Next Steps for Raouf:**
- Week 3: Create Supabase project and run SQL scripts
- Week 4: Migrate stores to Supabase, implement real-time subscriptions
- Week 6: Leaflet map integration with building markers

---

### Pouya:
**Date:** 2025-12-27  
**Task:** Phase 1 Complete - Home Tab Implementation

**Completed:**
- ✅ Next.js 16 + TypeScript project initialization
- ✅ Tailwind CSS + Shadcn UI setup
- ✅ Zustand state management (unitsStore, deadlinesStore)
- ✅ TypeScript type definitions (Unit, ClassTime, Deadline, Event, StressLevel)
- ✅ Layout components (Sidebar with navigation, Header with search/user menu)
- ✅ Home page components (TodaySchedule, NextDeadline, EventsFeed, QuickActions)
- ✅ Sample data (3 units, 3 deadlines, 3 events)
- ✅ Responsive 2-column grid layout
- ✅ All files pushed to GitHub main branch

**Next Steps for Pouya:**
- Create Unit Form component (Add/Edit/Delete modal)
- Mobile responsive design improvements
- Stress Forecast algorithm (Week 4)

**Next Steps for Team:**
- **Raouf:** ✅ Map & Settings pages complete. Next: Create Supabase project (Week 3)
- **Kit:** Create placeholder Calendar page, research FullCalendar integration

---

*Last Updated: 2025-12-28*  
*Version: 0.1.0 (Phase 1)*
