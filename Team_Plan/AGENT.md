# 🎓 Syllabus Sync - Project Documentation

**Complete Technical Reference & Team Guide**

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Team Roles](#team-roles)
5. [File Structure](#file-structure)
6. [Development Guidelines](#development-guidelines)
7. [State Management](#state-management)
8. [API Reference](#api-reference)
9. [Component Library](#component-library)
10. [Testing Strategy](#testing-strategy)

---

## Project Overview

**The Syllabus Sync** is a comprehensive campus management web application for Macquarie University students, designed to streamline schedule management, deadline tracking, event discovery, and campus navigation.

### Goals
- Provide an all-in-one platform for student campus life
- Improve time management and organization
- Enhance campus navigation and event discovery
- Present to university administration as an official tool

### Demo Target
Macquarie University Administration - February 2025

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client Browser                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │   Pages    │  │ Components │  │   Stores   │       │
│  │  (Next.js) │  │   (React)  │  │  (Zustand) │       │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘       │
│        │                │                │              │
│        └────────────────┴────────────────┘              │
│                         │                               │
│                         ▼                               │
│              ┌──────────────────┐                       │
│              │  localStorage    │                       │
│              └──────────────────┘                       │
│                         │                               │
│                         ▼                               │
│              ┌──────────────────┐  (Phase 2)           │
│              │    Supabase DB   │                       │
│              └──────────────────┘                       │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Interaction** → React Components
2. **State Updates** → Zustand Stores
3. **Persistence** → localStorage (Phase 1) / Supabase (Phase 2+)
4. **Re-render** → React Components update with new state

---

## Tech Stack

### Frontend
- **Framework:** Next.js 16.1.1 (App Router)
- **UI Library:** React 19.2.3
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS 3.4 + Shadcn UI
- **State Management:** Zustand 5.0.9
- **Icons:** Lucide React 0.562.0
- **Date Handling:** date-fns 4.1.0

### Backend (Phase 2+)
- **Database:** Supabase (PostgreSQL)
- **API:** Next.js API Routes
- **Auth:** Supabase Auth (planned)

### Development Tools
- **Testing:** Vitest + Testing Library
- **Linting:** ESLint 9
- **Formatting:** Prettier 3.3.3
- **Version Control:** Git + GitHub

---

## Team Roles

### 👨‍💻 Pouya - Frontend Lead

**Responsibilities:**
- UI/UX implementation
- Component development
- State management integration
- Responsive design
- Frontend testing

**Primary Files:**
```
app/
  ├── home/page.tsx
  ├── layout.tsx
  ├── page.tsx
  ├── loading.tsx
  ├── error.tsx
  └── not-found.tsx

components/
  ├── home/
  │   ├── EventsFeed.tsx
  │   ├── NextDeadline.tsx
  │   ├── QuickActions.tsx
  │   └── TodaySchedule.tsx
  ├── layout/
  │   ├── Header.tsx
  │   └── Sidebar.tsx
  ├── ui/* (all UI components)
  └── units/
      ├── UnitCard.tsx
      └── UnitForm.tsx

lib/
  ├── store/
  │   ├── unitsStore.ts
  │   └── deadlinesStore.ts
  └── hooks/
      ├── useHydration.ts
      └── useLocalStorage.ts

app/globals.css
tailwind.config.ts
```

### 👨‍💻 Raouf - Backend Lead

**Responsibilities:**
- Database design & implementation
- API development
- Data models & types
- Configuration management
- Map & Settings features

**Primary Files:**
```
lib/
  ├── config.ts
  ├── constants.ts
  ├── utils.ts
  └── types/index.ts

data/
  ├── sampleUnits.ts
  └── sampleEvents.ts

app/
  ├── map/page.tsx
  └── settings/page.tsx

# Phase 2+
lib/supabase/
  ├── client.ts
  ├── schema.sql
  └── migrations/

app/api/
  ├── units/
  ├── deadlines/
  └── events/
```

---

## File Structure

### Detailed File Breakdown

```
syllabus-sync/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                 # Root redirect to /home
│   ├── layout.tsx               # Root layout with Sidebar + Header
│   ├── globals.css              # Global styles
│   ├── loading.tsx              # Loading state
│   ├── error.tsx                # Error boundary
│   ├── not-found.tsx            # 404 page
│   ├── home/
│   │   └── page.tsx             # ✅ Home Dashboard (Pouya)
│   ├── calendar/
│   │   └── page.tsx             # 🚧 Calendar view (Phase 3)
│   ├── map/
│   │   └── page.tsx             # 🚧 Campus map (Raouf - Phase 4)
│   ├── feed/
│   │   └── page.tsx             # ✅ Events feed with filtering
│   └── settings/
│       └── page.tsx             # 🚧 Settings (Raouf - Phase 2)
│
├── components/                   # React components
│   ├── home/
│   │   ├── EventsFeed.tsx       # Today's events widget
│   │   ├── NextDeadline.tsx     # Next deadline tracker
│   │   ├── QuickActions.tsx     # Quick navigation buttons
│   │   └── TodaySchedule.tsx    # Today's classes widget
│   ├── layout/
│   │   ├── Header.tsx           # Top header with profile
│   │   └── Sidebar.tsx          # Navigation sidebar
│   ├── ui/                      # Shadcn UI components
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   └── select.tsx
│   └── units/
│       ├── UnitCard.tsx         # Unit display card
│       └── UnitForm.tsx         # Add/Edit unit form
│
├── lib/                         # Utilities & logic
│   ├── config.ts                # App configuration (Raouf)
│   ├── constants.ts             # Constants & enums (Raouf)
│   ├── utils.ts                 # Utility functions
│   ├── types/
│   │   └── index.ts             # TypeScript types (Raouf)
│   ├── store/
│   │   ├── unitsStore.ts        # Units state (Pouya)
│   │   └── deadlinesStore.ts    # Deadlines state (Pouya)
│   └── hooks/
│       ├── index.ts
│       ├── useHydration.ts      # Hydration helper
│       └── useLocalStorage.ts   # localStorage hook
│
├── data/                        # Sample data for demo
│   ├── sampleUnits.ts           # Demo units & deadlines (Raouf)
│   └── sampleEvents.ts          # Demo events (Raouf)
│
├── tests/                       # Test files
│   ├── setup.ts
│   ├── EventsFeed.test.tsx
│   ├── NextDeadline.test.tsx
│   └── TodaySchedule.test.tsx
│
├── public/                      # Static assets
│   └── images/
│
└── Team_Plan/                   # Documentation
    ├── AGENT.md                 # This file
    ├── CHANGELOG.md             # Version history
    └── TEAM_ROADMAP.md          # Team tasks
```

---

## Development Guidelines

### Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run linter
npm run lint

# Format code
npm run format
```

### Code Standards

**TypeScript:**
- Use strict mode
- Define types for all props and state
- Avoid `any` type
- Use interfaces for objects, types for unions

**React:**
- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper key props in lists

**Styling:**
- Use Tailwind CSS utility classes
- Follow mobile-first approach
- Use Shadcn UI components for consistency
- Maintain Macquarie University branding colors

**File Naming:**
- Components: PascalCase (e.g., `UnitCard.tsx`)
- Utilities: camelCase (e.g., `utils.ts`)
- Pages: lowercase (e.g., `page.tsx`)

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Commit with descriptive messages
git commit -m "feat: add unit form validation"

# Push and create PR
git push origin feature/your-feature-name
```

**Commit Message Convention:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code formatting
- `refactor:` Code refactoring
- `test:` Test updates
- `chore:` Build/config changes

---

## State Management

### Zustand Stores

#### Units Store (`lib/store/unitsStore.ts`)

**State:**
```typescript
interface UnitsState {
  units: Unit[];
  addUnit: (unit: Unit) => void;
  removeUnit: (id: string) => void;
  updateUnit: (id: string, unit: Partial<Unit>) => void;
  getUnitByCode: (code: string) => Unit | undefined;
  getTodayClasses: () => (Unit & ClassTime)[];
}
```

**Usage:**
```typescript
import { useUnitsStore } from '@/lib/store/unitsStore';

const units = useUnitsStore((state) => state.units);
const addUnit = useUnitsStore((state) => state.addUnit);
const todayClasses = useUnitsStore((state) => state.getTodayClasses());
```

#### Deadlines Store (`lib/store/deadlinesStore.ts`)

**State:**
```typescript
interface DeadlinesState {
  deadlines: Deadline[];
  addDeadline: (deadline: Deadline) => void;
  removeDeadline: (id: string) => void;
  updateDeadline: (id: string, deadline: Partial<Deadline>) => void;
  toggleComplete: (id: string) => void;
  getUpcoming: (limit?: number) => Deadline[];
  getStressLevel: () => StressLevel;
}
```

**Usage:**
```typescript
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';

const deadlines = useDeadlinesStore((state) => state.deadlines);
const upcoming = useDeadlinesStore((state) => state.getUpcoming(5));
const stressLevel = useDeadlinesStore((state) => state.getStressLevel());
```

### Persistence

Both stores use Zustand's `persist` middleware with `localStorage`:
- Automatically saves state changes
- Hydrates on page load
- Use `hasHydrated()` to check hydration status

---

## API Reference

### Types (`lib/types/index.ts`)

#### Unit
```typescript
interface Unit {
  id: string;
  code: string;           // "COMP2310"
  name: string;           // "Networking"
  color: string;          // "#A6192E"
  location: {
    building: string;     // "C5C"
    room: string;         // "204"
  };
  schedule: ClassTime[];
  createdAt: Date;
}
```

#### ClassTime
```typescript
interface ClassTime {
  id: string;
  day: DayOfWeek;
  startTime: string;      // "09:00"
  endTime: string;        // "11:00"
}
```

#### Deadline
```typescript
interface Deadline {
  id: string;
  title: string;
  unitCode: string;
  dueDate: Date;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  type: 'Assignment' | 'Exam' | 'Quiz' | 'Presentation';
  completed: boolean;
  createdAt: Date;
}
```

#### Event
```typescript
interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  location: string;
  category: 'Career' | 'Social' | 'Academic' | 'Free Food';
  imageUrl?: string;
}
```

### Configuration (`lib/config.ts`)

**University Config:**
```typescript
export const UNIVERSITY_CONFIG = {
  name: 'Macquarie University',
  shortName: 'Macquarie',
  website: 'https://www.mq.edu.au',
  supportEmail: 'support@mq.edu.au',
};
```

**Brand Colors:**
```typescript
export const BRAND_COLORS = {
  primary: '#A6192E',    // Macquarie Red
  secondary: '#002A45',  // Macquarie Blue
  accent: '#FFB81C',     // Macquarie Gold
};
```

---

## Component Library

### Home Components

#### TodaySchedule
Displays today's classes from units store.

**Props:** None  
**State:** Uses `useUnitsStore`

#### NextDeadline
Shows the next upcoming deadline with priority.

**Props:** None  
**State:** Uses `useDeadlinesStore`

#### EventsFeed
Displays today's campus events.

**Props:** None  
**Data:** Uses `sampleEvents`

#### QuickActions
Quick navigation buttons to Map and Calendar.

**Props:** None

### Layout Components

#### Sidebar
Main navigation sidebar with app name and menu items.

**Props:** None  
**Routes:** Home, Map, Calendar, Feed, Settings

#### Header
Top header with notifications and user profile.

**Props:** None  
**Displays:** User name from `DEMO_USER`

### Unit Components

#### UnitCard
Displays a single unit with schedule and location.

**Props:**
```typescript
interface UnitCardProps {
  unit: Unit;
  onEdit?: (unit: Unit) => void;
  onDelete?: (unit: Unit) => void;
  showActions?: boolean;
}
```

#### UnitForm
Form for adding/editing units with validation.

**Props:**
```typescript
interface UnitFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editUnit?: Unit | null;
}
```

---

## Testing Strategy

### Unit Tests
- Test store logic (actions, selectors)
- Test utility functions
- Test type validation

### Component Tests
- Test rendering with different props
- Test user interactions
- Test state updates
- Test error states

### Test Files
```typescript
// tests/TodaySchedule.test.tsx
import { render, screen } from '@testing-library/react';
import TodaySchedule from '@/components/home/TodaySchedule';

describe('TodaySchedule', () => {
  it('renders today\'s classes', () => {
    render(<TodaySchedule />);
    // Assertions...
  });
});
```

### Running Tests
```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

---

## Phase 2 - Backend Implementation (In Progress)

### Database Schema (Supabase)

**Tables:**
- `users` - User profiles
- `units` - Course units
- `class_times` - Class schedules
- `deadlines` - Assignment deadlines
- `events` - Campus events

### API Routes (To Be Created)

**Units:**
- `GET /api/units` - Get all units
- `POST /api/units` - Create unit
- `PUT /api/units/:id` - Update unit
- `DELETE /api/units/:id` - Delete unit

**Deadlines:**
- `GET /api/deadlines` - Get all deadlines
- `POST /api/deadlines` - Create deadline
- `PUT /api/deadlines/:id` - Update deadline
- `DELETE /api/deadlines/:id` - Delete deadline

**Events:**
- `GET /api/events` - Get all events
- `GET /api/events/today` - Get today's events
- `GET /api/events/upcoming` - Get upcoming events

---

## Deployment

### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key
```

### Build & Deploy
```bash
# Build for production
npm run build

# Start production server
npm start
```

### Hosting Options
- **Recommended:** Vercel (Next.js native)
- **Alternative:** Netlify, Railway, AWS

---

## Troubleshooting

### Common Issues

**Hydration Mismatch:**
- Use `useState(false)` and `useEffect` to check client-side
- Check `persist.hasHydrated()` before rendering

**LocalStorage Not Persisting:**
- Check browser settings
- Ensure `storage: createJSONStorage(() => localStorage)`

**Build Errors:**
- Run `npm run lint` to check for errors
- Ensure all imports are correct
- Check TypeScript types

---

## Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Zustand Guide](https://zustand-demo.pmnd.rs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn UI](https://ui.shadcn.com)

### Team Communication
- GitHub Issues for bug tracking
- Pull Requests for code review
- Regular sync meetings

---

## License

MIT License - See LICENSE file for details.

---

**Last Updated:** December 30, 2025  
**Version:** 0.2.0  
**Status:** Phase 1 Complete, Phase 2 In Progress

---

**Questions?** Contact the team leads:
- Frontend: Pouya
- Backend: Raouf

