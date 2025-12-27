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
- [x] Project initialization (Next.js 14 + TypeScript)
- [x] Basic layout (Sidebar + Header)
- [x] Home page with Today's Schedule
- [x] Next Deadline display
- [x] Events Feed
- [ ] Unit Form (Add/Edit/Delete units)
- [ ] Placeholder pages (Map, Calendar, Settings)

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
- **Framework:** Next.js 14 (App Router)
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
   - Responsibilities: Next.js 14 + TypeScript, Zustand state management, Home Tab
   - Current Status: ✅ Phase 1 Complete (pushed to GitHub)

2. **Raouf (Map & Database Developer)**
   - Responsibilities: Leaflet integration, navigation routing, building markers, Database setup, Settings Tab
   - Current Status: 🚧 Ready to start Phase 2

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
│   ├── page.tsx             # Home page
│   ├── map/                 # Map page (placeholder)
│   ├── calendar/            # Calendar page (placeholder)
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
- Project initialization with Next.js 14 + TypeScript
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
4. Commit changes: `git commit -m "feat: [description]"`

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
- **Next.js 14 Docs:** https://nextjs.org/docs
- **Shadcn UI Docs:** https://ui.shadcn.com/docs
- **Zustand Docs:** https://docs.pmnd.rs/zustand
- **Leaflet Docs:** https://leafletjs.com/reference.html
- **FullCalendar Docs:** https://fullcalendar.io/docs

### Macquarie University Resources
- **Official Site:** https://www.mq.edu.au
- **Campus Map:** https://www.mq.edu.au/about/campus-services-and-facilities/maps

---

## 📝 Update Log

### Pouya:
**Date:** 2025-12-27  
**Task:** Phase 1 Complete - Home Tab Implementation

**Completed:**
- ✅ Next.js 14 + TypeScript project initialization
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
- **Raouf:** Create placeholder Map and Settings pages, begin database setup
- **Kit:** Create placeholder Calendar page, research FullCalendar integration

---

*Last Updated: [DATE]*
*Version: 0.1.0 (Phase 1)*
