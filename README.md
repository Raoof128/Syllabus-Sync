# 🎓 The Syllabus Sync

**Campus Navigation and Schedule Management for Macquarie University**

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)](https://tailwindcss.com/)
[![Version](https://img.shields.io/badge/version-0.5.0-blue)]()
[![Tests](https://img.shields.io/badge/tests-36%2F36-brightgreen)]()
[![Lint](https://img.shields.io/badge/eslint-0%20errors-brightgreen)]()

---

## 📋 Overview

**The Syllabus Sync** is a comprehensive campus management web application designed to help Macquarie University students seamlessly manage their academic and campus life. Built with enterprise-grade code quality and modern web technologies, it provides an all-in-one platform for schedule management, deadline tracking, event discovery, and campus navigation.

**Current Status:** Production-ready application with comprehensive error handling, offline support, and enterprise-level code quality.

**Demo Target:** Macquarie University Administration - February 2025

---

## 🧭 Architecture Diagram

```mermaid
flowchart LR
  subgraph UI
    Home[Home Dashboard]
    Calendar[Calendar & Deadlines]
    Map[Campus Map]
    Feed[Events Feed]
    Settings[Settings & Profile]
    Toaster[Toast Notifications]
  end

  subgraph State
    UnitsStore[unitsStore]
    DeadlinesStore[deadlinesStore]
    ThemeStore[themeStore]
    NotificationsStore[notificationsStore]
  end

  subgraph Services
    ErrorHandler[Error Handler]
    RetrySystem[Retry System]
    ServiceWorker[Offline Support]
  end

  subgraph Data
    SampleUnits[data/sampleUnits.ts]
    SampleEvents[data/sampleEvents.ts]
    LocalStorage[(localStorage)]
  end

  UI --> State
  UI --> Services
  State --> LocalStorage
  ErrorHandler --> Toaster
  ServiceWorker --> LocalStorage
  LocalStorage -.-> Future[Supabase planned]
```

---

## ✨ Core Features

### 🏠 **Home Dashboard** (Complete)

- **Today's Schedule:** View your classes for the day with room locations
- **Next Deadline:** Track upcoming assignments with priority levels and countdown
- **My Units:** Full unit management with add/edit/delete functionality
- **Unit Statistics:** Total units, classes per week, and study hours
- **Events Feed:** Discover campus events across categories
- **Stress Indicator:** Visual workload indicator based on deadlines
- **Quick Actions:** Fast navigation to Calendar and Map

### 📅 **Calendar & Deadlines** (Complete)

- **Full Deadline Management:** Add, edit, complete, delete deadlines
- **Statistics Overview:** Upcoming, completed, overdue counts
- **Completion Toggle:** Mark deadlines as complete/incomplete
- **Smart Navigation:** Click deadlines to view in calendar
- **Priority & Type System:** Color-coded priority and deadline types
- **Overdue Detection:** Automatic highlighting of overdue deadlines
- **Stress Level Algorithm:** Dynamic workload assessment

### 🔔 **Notifications System** (Complete)

- **Real-time Notifications:** Bell icon with unread count badge
- **Smart Categorization:** Deadlines, events, classes, system notifications
- **Interactive Navigation:** Click notifications to jump to relevant pages
- **Read Status Tracking:** Mark individual or all notifications as read
- **Persistent Storage:** Notifications survive browser sessions

### 🗺️ **Campus Map** (Complete)

- **Google Maps Integration:** Interactive campus map with Macquarie University
- **Building Navigation:** Quick reference for all campus buildings
- **Smart Query Parameters:** Direct navigation via `?building=XXX`
- **Interactive Features:** Building highlights and selection states

### 📱 **Events Feed** (Complete)

- **Advanced Filtering:** Filter events by category (Career, Social, Academic, Free Food)
- **Location Integration:** Navigate to event buildings directly from feed
- **Time & Location Details:** Complete event information display
- **Cross-Page Navigation:** Seamless integration with map and calendar

### ⚙️ **Settings & Profile** (Complete)

- **Data Management:** Clear all data with confirmation dialogs
- **Storage Status:** Real-time data storage information
- **App Information:** Version, build status, and system info
- **Profile Management:** User profile settings (framework ready)

### 🎯 **Quality Assurance Features**

- **Error Recovery:** Automatic retry mechanisms for failed operations
- **Offline Support:** Service worker with caching strategies
- **Toast Notifications:** Comprehensive user feedback system
- **Performance Monitoring:** Bundle analysis and optimization tracking
- **Accessibility:** WCAG compliant with keyboard navigation and screen reader support

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm

### Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Run development server**

   ```bash
   npm run dev
   ```

3. **Open in browser**
   ```
   http://localhost:3000
   ```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm test             # Run tests
```

---

## 📁 Project Structure

```
syllabus-sync/
├── app/                      # Next.js pages
│   ├── home/                # Home dashboard (Units + Schedule)
│   ├── calendar/            # Calendar view (Deadlines)
│   ├── map/                 # Campus map
│   ├── feed/                # Events feed
│   └── settings/            # Settings page
├── components/
│   ├── home/                # Dashboard components
│   ├── layout/              # Sidebar & Header
│   ├── ui/                  # Reusable UI components
│   ├── units/               # Unit management
│   └── deadlines/           # Deadline management
├── lib/
│   ├── store/               # State management (Zustand)
│   ├── types/               # TypeScript definitions
│   └── hooks/               # Custom React hooks
├── data/                    # Sample data for demo
└── tests/                   # Unit tests
```

---

## 👥 Team

| Role              | Member | Responsibilities                    |
| ----------------- | ------ | ----------------------------------- |
| **Frontend Lead** | Pouya  | UI/UX, Components, State Management |
| **Backend Lead**  | Raouf  | Database, API, Configuration        |

See [TEAM_ROLES.md](Team_Plan/TEAM_ROLES.md) for detailed responsibilities.

---

## 📝 Documentation

- **[AGENT.md](Team_Plan/AGENT.md)** - Complete project documentation
- **[CHANGELOG.md](Team_Plan/CHANGELOG.md)** - Version history
- **[TEAM_ROLES.md](Team_Plan/TEAM_ROLES.md)** - Team responsibilities
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contributing guidelines
- **[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)** - Community guidelines
- **[SECURITY.md](SECURITY.md)** - Security policy

---

## 🎯 Development Roadmap

### ✅ Phase 1 (Weeks 1-2) - COMPLETE: Code Quality & Error Handling

- [x] **Enterprise Code Quality**: 0 ESLint errors/warnings, full TypeScript strictness
- [x] **Comprehensive Error Handling**: Error boundaries, retry logic, centralized logging
- [x] **Performance Optimizations**: React.memo, proper display names, component optimizations
- [x] **Build System**: Production-ready compilation with no errors
- [x] **Type Safety**: Eliminated all `any` types, proper generic constraints

### ✅ Phase 2 (Weeks 3-4) - COMPLETE: Advanced Features & Performance

- [x] **Toast Notification System**: Complete user feedback with all variants
- [x] **Error Recovery**: Automatic retry mechanisms with exponential backoff
- [x] **Offline Support**: Service worker implementation with caching strategies
- [x] **Bundle Optimization**: Code splitting, dynamic imports, bundle analysis
- [x] **Enhanced UX**: Proper dialog replacements, loading states, accessibility

### 🚧 Phase 3 (Week 5) - API Integration & User Management

- [ ] **Supabase Setup**: Database schema design and configuration
- [ ] **User Authentication**: Email/password, social login, session management
- [ ] **Real-time Sync**: Replace localStorage with Supabase real-time subscriptions
- [ ] **Data Migration**: Seamless transition from local to cloud storage
- [ ] **User Profiles**: Profile management, preferences, and settings

### ⏳ Phase 4 (Week 6) - Enhanced Features

- [ ] **Advanced Calendar**: FullCalendar integration with drag-and-drop
- [ ] **Interactive Map**: Leaflet integration with building markers
- [ ] **Collaboration**: Share schedules and units with other users
- [ ] **Push Notifications**: Browser notifications for deadlines and events

### ⏳ Phase 5 (Weeks 7-8) - Production & Demo Preparation

- [ ] **Performance Monitoring**: Analytics, error tracking, performance metrics
- [ ] **Testing Suite**: E2E tests, visual regression, accessibility testing
- [ ] **Documentation**: API docs, user guides, deployment instructions
- [ ] **Demo Preparation**: Pitch deck, user testing, final refinements

---

## 🛠 Tech Stack

| Category             | Technology               | Purpose                                           |
| -------------------- | ------------------------ | ------------------------------------------------- |
| **Framework**        | Next.js 16 (React 19)    | Full-stack React framework with SSR               |
| **Language**         | TypeScript 5.x           | Type-safe JavaScript with strict checking         |
| **Styling**          | Tailwind CSS + Shadcn UI | Utility-first CSS with component library          |
| **State Management** | Zustand (localStorage)   | Lightweight state management with persistence     |
| **UI Components**    | Radix UI Primitives      | Accessible, unstyled component primitives         |
| **Icons**            | Lucide React             | Consistent icon system                            |
| **Date Handling**    | date-fns                 | Modern date utility library                       |
| **Testing**          | Vitest + Testing Library | Fast unit testing framework                       |
| **Notifications**    | Radix Toast              | Accessible toast notification system              |
| **Error Handling**   | Custom retry system      | Automatic error recovery with exponential backoff |
| **Offline Support**  | Service Worker API       | Progressive web app capabilities                  |

### 📊 Quality Metrics

- **Test Coverage**: 36/36 tests passing (100% success rate)
- **Code Quality**: 0 ESLint errors, 0 warnings (perfect compliance)
- **Type Safety**: Full TypeScript strictness, no `any` types
- **Performance**: Optimized bundles with code splitting and caching
- **Accessibility**: WCAG compliant with screen reader support
- **Build Status**: Production-ready with zero compilation errors

---

## 🎨 Design System

### Macquarie University Branding

- **Primary Red:** `#A6192E`
- **Primary Blue:** `#002A45`
- **Accent Gold:** `#FFB81C`

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 📊 Project Status

**Current Version:** 0.5.0
**Last Updated:** January 01, 2026
**Status:** ✅ Production Ready

### 🎯 **Achievements**

- **Phase 1 Complete**: Enterprise-grade code quality and error handling
- **Phase 2 Complete**: Advanced features with offline support and performance optimization
- **Quality Assurance**: 100% test pass rate, zero linting errors, full TypeScript compliance
- **Performance**: Optimized bundles, code splitting, service worker implementation
- **Accessibility**: WCAG compliant with comprehensive screen reader support

### 🚀 **Ready for Next Phase**

The application is now production-ready and prepared for:

- Real API integration with Supabase
- User authentication and cloud sync
- Advanced calendar and map features
- University administration demo presentation

---

**Made with ❤️ for Macquarie University students**
