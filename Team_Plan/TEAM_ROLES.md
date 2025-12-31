# 👥 Team Roles & Responsibilities

**Syllabus Sync - Frontend/Backend Division**

Last Updated: December 31, 2025  
Version: 0.4.0

---

## 🎨 POUYA - Frontend Lead

### Role Overview
Responsible for all user-facing features, UI/UX implementation, component development, state management, and ensuring a responsive, intuitive interface.

### Primary Responsibilities
- ✅ UI/UX implementation
- ✅ React component development
- ✅ State management with Zustand
- ✅ Responsive design & styling
- ✅ Frontend testing
- ✅ User interactions & animations
- ✅ Cross-page navigation

---

### 📂 Files Pouya Works On

#### **Pages (App Router)**
```
app/
├── page.tsx                    # Root redirect
├── layout.tsx                  # Main layout structure
├── loading.tsx                 # Loading states
├── error.tsx                   # Error boundaries
├── not-found.tsx               # 404 page
├── globals.css                 # Global styles
├── home/
│   └── page.tsx                # ⭐ Home dashboard (includes Units)
└── calendar/
    └── page.tsx                # ⭐ Calendar page (includes Deadlines)
```

#### **Home Dashboard Components**
```
components/home/
├── EventsFeed.tsx             # ⭐ Events widget + Map navigation
├── NextDeadline.tsx           # ⭐ Deadline tracker + Calendar link
├── QuickActions.tsx           # ⭐ Navigation buttons
└── TodaySchedule.tsx          # ⭐ Today's classes widget
```

#### **Layout Components**
```
components/layout/
├── Header.tsx                 # ⭐ Header + Notifications dropdown
└── Sidebar.tsx                # ⭐ Side navigation (mobile responsive)
```

#### **Unit Management Components**
```
components/units/
├── UnitCard.tsx               # ⭐ Unit display card
└── UnitForm.tsx               # ⭐ Add/Edit unit dialog
```

#### **Deadline Management Components**
```
components/deadlines/
└── DeadlineForm.tsx           # ⭐ Add/Edit deadline dialog
```

#### **UI Components (Shadcn)**
```
components/ui/
├── badge.tsx                  # Badge component
├── button.tsx                 # Button component
├── card.tsx                   # Card component
├── dialog.tsx                 # Modal/Dialog
├── dropdown-menu.tsx          # Dropdown menu
├── input.tsx                  # Input field
├── label.tsx                  # Form label
└── select.tsx                 # Select dropdown
```

#### **State Management**
```
lib/store/
├── unitsStore.ts              # ⭐ Units state (CRUD, selectors)
├── deadlinesStore.ts          # ⭐ Deadlines state (CRUD, stress level)
└── notificationsStore.ts      # ⭐ Notifications state (NEW)
```

#### **Custom Hooks**
```
lib/hooks/
├── index.ts                   # Hook exports
├── useHydration.ts            # Hydration helper
└── useLocalStorage.ts         # localStorage hook
```

#### **Testing**
```
tests/
├── setup.ts                   # Test setup
├── EventsFeed.spec.tsx        # ⭐ EventsFeed tests
├── NextDeadline.test.tsx      # ⭐ NextDeadline tests
├── TodaySchedule.test.tsx     # ⭐ TodaySchedule tests
├── UnitForm.test.tsx          # ⭐ UnitForm tests
├── UnitCard.test.tsx          # ⭐ UnitCard tests
└── stores.test.ts             # ⭐ Store tests
```

#### **Configuration Files**
```
tailwind.config.ts             # Tailwind configuration
postcss.config.mjs             # PostCSS config
vitest.config.ts               # Test configuration
```

---

### 🎯 Pouya's Completed Tasks ✅

- [x] Build home dashboard layout
- [x] Implement TodaySchedule widget
- [x] Implement NextDeadline widget with Calendar link
- [x] Implement EventsFeed widget with Map navigation
- [x] Create QuickActions component
- [x] Setup Zustand stores (units, deadlines, notifications)
- [x] Implement Unit CRUD operations
- [x] Create UnitCard and UnitForm components
- [x] Create DeadlineForm component
- [x] Integrate Units into Home page
- [x] Integrate Deadlines into Calendar page
- [x] Setup Sidebar navigation (mobile responsive)
- [x] Setup Header with branding and notifications dropdown
- [x] Add stress level indicator
- [x] Implement notifications store and dropdown
- [x] Add cross-page navigation (deadlines→calendar, events→map)
- [x] Fix hydration errors
- [x] Fix ESLint `react-hooks/set-state-in-effect` violations in Header.tsx and useHydration.ts
- [x] Write component tests

### 🚀 Pouya's Next Tasks

- [ ] Add loading skeletons
- [ ] Implement toast notifications for actions
- [ ] Add form animations
- [ ] Optimize performance
- [ ] FullCalendar integration (Phase 3)

---

## ⚙️ RAOUF - Backend Lead

### Role Overview
Responsible for data architecture, database design, API development, configuration management, and backend features like Map and Settings.

### Primary Responsibilities
- ✅ Database design & implementation
- ✅ API route development
- ✅ Data models & TypeScript types
- ✅ Configuration management
- ✅ Sample data creation
- ✅ Map integration
- ✅ Settings implementation

---

### 📂 Files Raouf Works On

#### **Configuration**
```
lib/
├── config.ts                  # ⭐ App & university config
├── constants.ts               # ⭐ Constants & enums
└── utils.ts                   # Utility functions
```

#### **Type Definitions**
```
lib/types/
└── index.ts                   # ⭐ TypeScript interfaces (Unit, Deadline, Event, Notification)
```

#### **Sample Data**
```
data/
├── sampleUnits.ts             # ⭐ Sample units & deadlines
├── sampleEvents.ts            # ⭐ Sample campus events (with building info)
└── sampleNotifications.ts     # ⭐ Sample notifications (NEW)
```

#### **Pages (Backend Logic)**
```
app/
├── map/
│   └── page.tsx               # ⭐ Campus map (with ?building param)
├── settings/
│   └── page.tsx               # ⭐ Settings page (clear data, info)
└── feed/
    └── page.tsx               # Events feed (with map navigation)
```

#### **Future Backend Files (Phase 2+)**
```
lib/supabase/
├── client.ts                  # 🔨 Supabase client setup
├── schema.sql                 # 🔨 Database schema
└── migrations/                # 🔨 Database migrations

app/api/
├── units/
│   └── route.ts               # 🔨 Units API
├── deadlines/
│   └── route.ts               # 🔨 Deadlines API
├── events/
│   └── route.ts               # 🔨 Events API
└── notifications/
    └── route.ts               # 🔨 Notifications API
```

---

### 🎯 Raouf's Completed Tasks ✅

- [x] Define TypeScript types (Unit, Deadline, Event, Notification)
- [x] Create app configuration system
- [x] Define constants and enums
- [x] Generate sample units data
- [x] Generate sample events data
- [x] Setup utility functions
- [x] Create placeholder pages (Map, Calendar, Settings)

### 🚀 Raouf's Next Tasks (Phase 2 - In Progress)

- [ ] Setup Supabase project
- [ ] Design database schema
  - [ ] Users table
  - [ ] Units table
  - [ ] Class times table
  - [ ] Deadlines table
  - [ ] Events table
- [ ] Create Supabase client
- [ ] Implement API routes
  - [ ] `/api/units` (GET, POST, PUT, DELETE)
  - [ ] `/api/deadlines` (GET, POST, PUT, DELETE)
  - [ ] `/api/events` (GET, POST)
- [ ] Migrate stores to use API instead of localStorage
- [ ] Implement Settings page functionality
- [ ] Add authentication (optional)

### 🗺️ Raouf's Future Tasks (Phase 4 - Map)

- [ ] Research Leaflet.js integration
- [ ] Get Macquarie campus map data
- [ ] Implement interactive map component
- [ ] Add building markers
- [ ] Implement search functionality
- [ ] Add navigation/routing between buildings
- [ ] Implement current location tracking

---

## 🤝 Shared Responsibilities

### Both Team Members
- Code reviews
- Documentation updates
- Bug fixes
- Git workflow management
- Testing (their own components/features)

### Communication
- Daily stand-ups (optional)
- GitHub Issues for task tracking
- Pull Requests for code review
- Team sync meetings

---

## 📊 Work Distribution Summary

| Category | Pouya (Frontend) | Raouf (Backend) |
|----------|------------------|-----------------|
| **Pages** | Home, Layout, Error pages | Map, Settings, Calendar, Feed |
| **Components** | All UI components | Data-driven placeholders |
| **State** | Zustand stores | Types & API integration |
| **Styling** | CSS, Tailwind | Configuration |
| **Data** | Store logic | Sample data, API |
| **Testing** | Component tests | API tests (future) |
| **Config** | Tailwind, PostCSS | App config, Constants |

---

## 🔄 Workflow

### Pouya's Workflow
1. Design component mockup
2. Implement React component
3. Connect to Zustand store
4. Style with Tailwind CSS
5. Write component tests
6. Create pull request
7. Review & merge

### Raouf's Workflow
1. Design data model
2. Create TypeScript types
3. Implement database schema
4. Create API routes
5. Test API endpoints
6. Update documentation
7. Create pull request
8. Review & merge

---

## 📝 Development Guidelines

### For Pouya (Frontend)
- Focus on component reusability
- Keep components small (< 200 lines)
- Use Tailwind utility classes
- Follow mobile-first design
- Write tests for user interactions
- Ensure accessibility (ARIA labels)
- Optimize for performance (React.memo, useMemo)

### For Raouf (Backend)
- Write clear type definitions
- Document API endpoints
- Validate all inputs
- Handle errors gracefully
- Use proper HTTP status codes
- Implement rate limiting (future)
- Write database migrations

---

## 🎯 Current Phase: Phase 2 (Weeks 3-4)

### Pouya's Focus
- [ ] Enhance unit form with better validation
- [ ] Create deadline management UI
- [ ] Build stress forecast visualization
- [ ] Improve mobile responsiveness

### Raouf's Focus
- [ ] Setup Supabase database
- [ ] Create database schema
- [ ] Implement API routes
- [ ] Settings page functionality

---

## 📞 Contact & Coordination

**Frontend Lead:** Pouya  
**Backend Lead:** Raouf

**Meeting Schedule:**
- Weekly sync: Every Monday
- Quick check-ins: As needed
- Code review: Within 24 hours of PR

**Tools:**
- GitHub: Code repository & issues
- Pull Requests: Code review
- README.md: Project overview
- AGENT.md: Technical reference
- CHANGELOG.md: Version history
- TEAM_ROLES.md: Team responsibilities (this file)

---

## ✅ Phase Completion Checklist

### Phase 1 ✅ (Complete)
- [x] Pouya: Home dashboard components
- [x] Pouya: State management setup
- [x] Pouya: Layout components
- [x] Raouf: Type definitions
- [x] Raouf: Configuration system
- [x] Raouf: Sample data
- [x] Pouya: Notifications system
- [x] Raouf: Sample notifications data
- [x] Pouya: Cross-page navigation

### Phase 2 🚧 (In Progress)
- [ ] Pouya: Enhanced forms & validation
- [ ] Pouya: Stress forecast UI
- [ ] Raouf: Database setup
- [ ] Raouf: API implementation
- [ ] Both: Integration testing

---

**Last Updated:** December 31, 2025  
**Version:** 0.4.0  
**Status:** Phase 1 Complete, Phase 2 In Progress

