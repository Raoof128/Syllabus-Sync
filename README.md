# 🎓 The Syllabus Sync

**Next-Generation Campus Management & Productivity Platform for Macquarie University**

[![Next.js 16](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.2-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?logo=supabase)](https://supabase.com/)
[![Vitest](https://img.shields.io/badge/Tests-275_Passed-brightgreen?logo=vitest)](https://vitest.dev/)

---

## 🌟 Overview

**The Syllabus Sync** is a professional-grade campus management ecosystem tailored specifically for Macquarie University students. Built with **Next.js 16 (App Router)** and **React 19**, it leverages cutting-edge web technologies to provide a high-performance, accessible, and beautiful experience.

From real-time building navigation to advanced deadline tracking with automated stress analysis, Syllabus Sync is designed to be the ultimate student companion.

### 🗺️ System Architecture

```mermaid
graph TD
    User([User / Browser])

    subgraph "Frontend (Next.js 16 + React 19)"
        UI[Apple Liquid Glass UI]
        State[Zustand Stores]
        Auth[Supabase Auth Client]
        SW[Service Workers / Notifications]
    end

    subgraph "Backend (Next.js API Routes)"
        Middleware{Security Middleware}
        RL[Rate Limiting - Upstash]
        CSRF[CSRF Validation]
        API[Feature Endpoints]
    end

    subgraph "External Services"
        Supabase[(PostgreSQL / RLS)]
        ORS[OpenRouteService Proxy]
        OSM[OpenStreetMap Data]
    end

    User <--> UI
    UI <--> State
    State <--> Auth
    UI <--> SW

    UI <--> Middleware
    Middleware --> RL
    Middleware --> CSRF
    CSRF --> API

    API <--> Supabase
    API <--> ORS
    ORS <--> OSM
```

### 💎 Key Achievements

- **Apple Liquid Glass 2025 UI:** A premium, high-fidelity design system featuring organic SVG refractions and fluid mesh gradients.
- **Enterprise Security:** Hardened with distributed rate limiting, CSRF protection, and strict Row Level Security (RLS).
- **Global Reach:** Full support for **19 languages**, including RTL support (Arabic, Persian, Urdu, Hebrew).
- **Accessibility First:** WCAG 2.1 AA compliant with ARIA grid semantics, 44px tap targets, and keyboard-first navigation.

---

## 🚀 Features

### 📅 Smart Calendar & Deadlines

- **Automated Stress Indicator:** Real-time calculation of academic workload based on upcoming assignment density.
- **Dynamic Weekly View:** Interactive calendar with time indicators and CRUD management for units and deadlines.
- **JSON-LD Integration:** Structured data for SEO and rich snippets.

### 🗺️ Precision Campus Map

- **Hybrid Navigation:** Walking path previews via OpenRouteService proxy with handoff to Google/Apple Maps.
- **Building Directory:** Exhaustive data for 100+ campus structures sourced from OpenStreetMap.
- **Overlay Layers:** Toggleable views for Car Parking, Drinking Water, Accessibility, and Exam Sites.

### 🎮 Gamification Engine

- **XP & Levels:** Earn experience points for completing deadlines and engaging with campus events.
- **Streak Tracking:** Maintain daily activity streaks with milestone rewards.
- **Tiered Badging:** Visual progression from Freshman to Grand Scholar.

### 🔔 Enterprise Notifications

- **Intelligent Scheduling:** Automated browser push notifications for upcoming classes and deadlines.
- **Preference Management:** Granular control over notification types and timing.

---

## 🛠️ Technical Stack

| Category     | Technologies                                               |
| :----------- | :--------------------------------------------------------- |
| **Frontend** | React 19, Next.js 16 (Turbopack), Zustand, Framer Motion   |
| **Backend**  | Supabase (Auth/DB/Storage), Node.js API Routes             |
| **Styling**  | Tailwind CSS, Radix UI Primitives, Lucide Icons            |
| **Security** | Upstash Redis (Rate Limiting), CSRF Validation, CSP Nonces |
| **Testing**  | Vitest (Unit/Store), Playwright (E2E/Accessibility)        |
| **i18n**     | Custom JSON-based 19-language translation engine           |

---

## 📥 Getting Started

### Prerequisites

- **Node.js 22+** (LTS recommended)
- **Supabase Account**
- **Upstash Redis** (for production rate limiting)

### Installation

1. **Clone & Install**

   ```bash
   git clone https://github.com/mrpouyaalavi/syllabus-sync.git
   cd syllabus-sync
   npm install
   ```

2. **Environment Configuration**

   ```bash
   cp .env.example .env.local
   ```

   Add your Supabase URLs, API Keys, and Redis credentials to `.env.local`.

3. **Database Setup**
   Execute `database-schema.sql` in your Supabase SQL Editor to initialize tables, RLS policies, and triggers.

4. **Development Launch**
   ```bash
   npm run dev
   ```

---

## 🏗️ Project Architecture

```
syllabus-sync/
├── app/                  # Next.js 16 App Router (Server/Client Components)
│   ├── api/              # Standardized REST API with Middleware
│   ├── home/             # Main Dashboard Engine
│   └── ...               # Feature-based routing
├── components/           # Atomic Design Component Library
│   ├── ui/mq/           # Macquarie University Design System components
│   └── gamification/     # XP and Leveling components
├── lib/
│   ├── store/            # Zustand State Management (Units, Deadlines, Auth)
│   ├── security/         # CSRF & CSP protection logic
│   └── services/         # ORS Routing & Rate Limiting services
└── tests/                # 275+ Unit and E2E Tests
```

---

## 🔒 Security & Quality Assurance

We maintain a production-ready security posture:

- **CSRF Protection:** Strict origin validation across all mutation endpoints.
- **Rate Limiting:** IP-based distributed limiting for authentication and API routes.
- **Data Integrity:** Zod schema validation and PostgreSQL foreign key constraints.
- **CI/CD:** Automated checks for secrets, formatting, linting, and 100% test pass rate.

---

## 📄 Documentation

- **[AGENT.md](Team_Plan/AGENT.md)** - Detailed technical work logs and team protocols.
- **[CHANGELOG.md](Team_Plan/CHANGELOG.md)** - Version history and feature rollout.
- **[API Reference](docs/api.md)** - Comprehensive endpoint documentation.

---

## 👥 Contributors

- **Pouya** - Frontend Lead (UI/UX, Components, State Management)
- **Raouf** - Backend Lead (API, Database, Security, Infrastructure)
- **Kit** - AI Integration Specialist

---

**Built for the Macquarie University community with modern engineering standards.**
