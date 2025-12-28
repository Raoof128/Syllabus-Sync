# 🎓 The Syllabus Sync

**Campus navigation and schedule management for Macquarie University**

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📋 Overview

**The Syllabus Sync** is a comprehensive web application designed to help Macquarie University students manage their campus life. It combines interactive campus navigation, smart schedule management, deadline tracking, and event discovery in one seamless experience.

This project is being developed as a demo for presentation to Macquarie University administration with the goal of becoming an official campus tool.

---

## 🧭 Architecture Diagram

```mermaid
flowchart LR
  subgraph UI
    Home[Home Page]
    Map[Map Page]
    Calendar[Calendar Page]
    Feed[Feed Page]
    Settings[Settings Page]
  end

  subgraph Stores
    UnitsStore[unitsStore]
    DeadlinesStore[deadlinesStore]
  end

  subgraph Data
    SampleUnits[data/sampleUnits.ts]
    SampleEvents[data/sampleEvents.ts]
  end

  Home --> UnitsStore
  Home --> DeadlinesStore
  Feed --> SampleEvents
  UnitsStore --> LocalStorage[(localStorage)]
  DeadlinesStore --> LocalStorage
  LocalStorage -.-> Future[Supabase (planned)]
```

---

## ✨ Features

### 🏠 **Home Dashboard**
- **Today's Schedule:** View your classes for the day with location details
- **Next Deadline:** Track upcoming assignments and exams
- **Events Feed:** Discover campus events (Career, Social, Academic, Free Food)
- **Quick Actions:** Fast access to Map and Calendar

### 📅 **Smart Calendar** (In Development)
- Visual calendar with class schedules
- Deadline integration with priority levels
- Event management
- Multiple views (month/week/day)

### 🗺️ **Interactive Campus Map** (In Development)
- Leaflet-powered campus navigation
- Building markers with room numbers
- Step-by-step directions between buildings
- Current location tracking

### ⚡ **Advanced Features** (Planned)
- Stress Forecast algorithm
- Study plan suggestions
- Building crowdedness heatmap
- Smart notifications

---

## ✅ Usage Examples

### Add a Unit
```ts
import { useUnitsStore } from '@/lib/store/unitsStore';

const addUnit = useUnitsStore((state) => state.addUnit);
addUnit({
  id: 'unit-1',
  code: 'COMP1000',
  name: 'Intro to CS',
  color: '#A6192E',
  location: { building: 'C5C', room: '101' },
  schedule: [],
  createdAt: new Date(),
});
```

### Get Upcoming Deadlines
```ts
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';

const upcoming = useDeadlinesStore((state) => state.getUpcoming(3));
```

---

## 🚀 Tech Stack

### Frontend
- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
- **State Management:** [Zustand](https://docs.pmnd.rs/zustand)
- **Icons:** [Lucide React](https://lucide.dev/)

### Libraries
- **Maps:** [Leaflet](https://leafletjs.com/) + React Leaflet
- **Calendar:** [FullCalendar](https://fullcalendar.io/)
- **Date Handling:** [date-fns](https://date-fns.org/)

### Storage
- **MVP:** localStorage
- **Production:** [Supabase](https://supabase.com/) (PostgreSQL)

### Deployment
- **Platform:** [Vercel](https://vercel.com/)

---

## 📥 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/[YOUR-USERNAME]/syllabus-sync.git
   cd syllabus-sync
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

---

## 📁 Project Structure

```
syllabus-sync/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Root redirect
│   ├── home/                # Home page
│   ├── map/                 # Map page
│   ├── calendar/            # Calendar page
│   ├── feed/                # Feed page
│   └── settings/            # Settings page
├── components/
│   ├── ui/                  # Shadcn UI components
│   ├── home/                # Home page components
│   ├── layout/              # Layout components (Sidebar, Header)
│   ├── calendar/            # Calendar components
│   ├── map/                 # Map components
│   └── units/               # Unit management components
├── lib/
│   ├── store/               # Zustand stores
│   │   ├── unitsStore.ts
│   │   └── deadlinesStore.ts
│   ├── types/               # TypeScript types
│   └── utils.ts             # Utility functions
├── data/                     # Sample data
└── public/                   # Static assets
```

---

## 👥 Team

- **[Pouya](https://github.com/[POUYA-USERNAME])** - Frontend Lead, State Management, Home Tab
- **[Raouf](https://github.com/[RAOUF-USERNAME])** - Map Integration, Database, Settings
- **[Kit](https://github.com/[KIT-USERNAME])** - Calendar Integration, Events Feed

---

## 📝 Documentation

- **[AGENT.md](Team_Plan/AGENT.md)** - Complete project documentation
- **[CHANGELOG.md](Team_Plan/CHANGELOG.md)** - Version history
- **[TEAM_ROADMAP.md](Team_Plan/TEAM_ROADMAP.md)** - Team tasks and timeline
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Architecture overview
- **[API_REFERENCE.md](docs/API_REFERENCE.md)** - Type and store reference
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines
- **[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)** - Community standards
- **[SECURITY.md](SECURITY.md)** - Security reporting

---

## 🎯 Roadmap

### ✅ Phase 1 (Weeks 1-2) - COMPLETE
- [x] Project setup (Next.js 16 + TypeScript)
- [x] Layout components (Sidebar + Header)
- [x] Home page with Today's Schedule
- [x] Next Deadline widget
- [x] Events Feed preview
- [x] State management (Zustand)

### 🚧 Phase 2 (Weeks 3-4) - IN PROGRESS
- [ ] Unit Form (Add/Edit/Delete)
- [ ] Deadline management
- [ ] Stress Forecast algorithm
- [ ] Database setup (Supabase)

### ⏳ Phase 3 (Week 5) - Calendar
- [ ] FullCalendar integration
- [ ] Class schedule visualization
- [ ] Deadline integration
- [ ] Event management

### ⏳ Phase 4 (Week 6) - Map
- [ ] Leaflet map setup
- [ ] Building markers
- [ ] Navigation routing
- [ ] Current location tracking

### ⏳ Phase 5 (Week 7) - Events & Polish
- [ ] Live events feed
- [ ] Event interactivity (RSVP, reminders)
- [ ] UI refinements
- [ ] Mobile optimization

### ⏳ Phase 6 (Week 8) - Demo Preparation
- [ ] Demo script
- [ ] Pitch deck (9 slides)
- [ ] Demo video
- [ ] Bug fixes & testing

---

## 🎨 Design System

### Macquarie University Branding
- **Primary Red:** `#A6192E`
- **Primary Blue:** `#002A45`
- **Accent Gold:** `#FFB81C`

### UI Components
- Built with [Shadcn UI](https://ui.shadcn.com/)
- Responsive design (mobile-first)
- Accessible (WCAG 2.1 AA)

---

## 🤝 Contributing

We're currently a closed team working on the demo, but we welcome feedback and suggestions!

### Development Workflow
1. Read [CONTRIBUTING.md](CONTRIBUTING.md)
2. Create feature branch
3. Make changes
4. Run `npm run lint` and confirm `Lint OK`
5. Run `npm run test`
6. Run `npm run format:check`
7. Test locally
8. Create Pull Request

### Code Style
- TypeScript strict mode
- ESLint + Prettier
- Conventional Commits

### Linting & CI
- Local lint: `npm run lint` (prints `Lint OK` on success)
- CI lint: GitHub Actions workflow at `.github/workflows/lint.yml`
- CI tests: GitHub Actions workflow at `.github/workflows/test.yml`

### Testing
- Run tests: `npm run test`
- Watch mode: `npm run test:watch`

### Formatting
- Format code: `npm run format`
- Check formatting: `npm run format:check`

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Macquarie University** - For inspiring this project
- **Next.js Team** - For the amazing framework
- **Shadcn** - For the beautiful UI components
- **Vercel** - For hosting and deployment

---

## 📞 Contact

**Project Lead:** Pouya Alavi  
**Email:** [your-email@example.com]  
**Demo Date:** Late February 2025

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Run tests
npm run test

# Watch tests
npm run test:watch

# Format code
npm run format

# Check formatting
npm run format:check
```

---

## 📊 Project Status

**Current Version:** 0.1.0 (Phase 1)  
**Last Updated:** December 28, 2025  
**Status:** 🚧 Active Development

---

**Made with ❤️ for Macquarie University students**
