# Development Onboarding Guide

**Comprehensive Developer Onboarding for The Syllabus Sync**

## 👋 Welcome to The Syllabus Sync!

We're excited to have you join our development team! This guide will help you get set up quickly and understand our development practices, codebase architecture, and team workflows.

## 🎯 First Week Goals

By the end of your first week, you should be able to:

- ✅ Set up development environment and run the application locally
- ✅ Understand our codebase architecture and development patterns
- ✅ Make your first contribution and submit a pull request
- ✅ Set up development tools and IDE configuration
- ✅ Understand our testing and deployment processes

## 🛠️ Environment Setup

### **Prerequisites**

Before you begin, ensure you have:

```bash
# Required tools
- Node.js 22.x LTS
- npm 10.x or yarn 1.22.x
- Git 2.x
- VS Code (recommended) or your preferred IDE
- Docker (for container development)

# Accounts you'll need
- GitHub account with 2FA enabled
- Supabase account (access to our project database)
```

### **Quick Start**

```bash
# 1. Clone the repository
git clone https://github.com/mrpouyaalavi/syllabus-sync.git
cd syllabus-sync

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env.local

# 4. Configure your environment
# Add your Supabase credentials and other API keys
# See .env.example for required variables

# 5. Start development server
npm run dev

# 6. Verify everything works
# Open http://localhost:3000 in your browser
# Create an account and test basic functionality
```

### **VS Code Setup**

Install these recommended extensions:

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "github.vscode-pull-request-github",
    "ms-playwright.playwright",
    "vitest.explorer"
  ]
}
```

#### **Workspace Settings**

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative",
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "emmet.includeLanguages": ["typescript", "typescriptreact"]
}
```

## 🏗️ Codebase Architecture

### **Project Structure Overview**

```
syllabus-sync/
├── app/                    # Next.js 16 App Router
│   ├── api/               # API routes with security middleware
│   ├── calendar/           # Academic calendar
│   ├── home/              # Dashboard & analytics
│   ├── map/                # Campus navigation
│   └── settings/           # User preferences
├── components/              # React component library
│   ├── ui/                 # Base UI primitives
│   ├── gamification/         # XP & achievements
│   └── ...                 # Feature-specific components
├── lib/                     # Core business logic
│   ├── store/            # Zustand state management
│   ├── services/         # External API integrations
│   ├── hooks/            # Custom React hooks
│   └── utils/            # Utility functions
├── tests/                    # Comprehensive test suite
├── docs/                     # Technical documentation
├── public/                    # Static assets
└── docker/                   # Container configurations
```

### **Key Technologies**

- **Frontend:** React 19, Next.js 16, TypeScript 5.x
- **Styling:** Tailwind CSS 4.x, Custom MQ Design System
- **State Management:** Zustand 5.x with persistence
- **Database:** Supabase (PostgreSQL) with Row Level Security
- **Authentication:** Supabase Auth + WebAuthn Passkeys
- **Testing:** Vitest (unit), Playwright (E2E), @axe-core (accessibility)
- **Deployment:** Docker, Kubernetes, Vercel

## 🔧 Development Workflow

### **Our Development Process**

#### **1. Feature Development**

```bash
# Create feature branch
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# Make changes and test locally
npm run dev
npm run test:watch

# Commit with conventional messages
git add .
git commit -m "feat: add user profile management"

# Push and create PR
git push origin feature/your-feature-name
# Create PR on GitHub with proper template
```

#### **2. Code Quality Standards**

We use these tools and standards:

```bash
# Before committing
npm run check  # Runs: secrets → format → typecheck → lint → tests → build
```

**Our Standards:**

- **TypeScript:** Strict mode, no `any` types
- **ESLint:** Custom rules for security and consistency
- **Prettier:** Consistent formatting
- **Conventional Commits:** Standardized commit messages

#### **3. Testing Strategy**

```bash
# Unit tests
npm run test                    # Run all unit tests
npm run test:watch               # Watch mode
npm run test:coverage            # With coverage report

# E2E tests
npm run test:e2e                # Playwright tests
npm run test:e2e:ui            # Interactive mode
npm run test:accessibility       # Accessibility focused tests

# Performance tests
npm run lighthouse                # Lighthouse CI audits
npm run analyze                  # Bundle analysis
```

### **Branch Protection**

- **Main branch** is protected and requires PR review
- **Automatic deployments** happen from `develop` branch
- **Feature branches** should be regularly rebased

## 🎨 Our Design System

### **Liquid Glass UI**

Our signature "Liquid Glass" design system provides:

- **Premium aesthetics** with blur effects and refractions
- **Accessibility-first** components
- **Responsive design** built into the system
- **Dark/light theme** support with consistent design tokens

### **Component Development**

When creating components:

1. **Use our base components:** Start with `MagicCard`, `Button`, etc.
2. **Follow naming conventions:** PascalCase for components, camelCase for props
3. **Responsive by default:** Mobile-first approach
4. **Include accessibility:** Proper ARIA labels and keyboard navigation

### **Using Design Tokens**

We use CSS custom properties for consistency:

```css
.component {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  color: var(--text-primary);
  padding: var(--space-4);
}
```

## 🔒 Security Practices

### **Our Security Approach**

- **Defense in depth:** Multiple layers of security
- **Zero trust:** Validate all inputs and authenticate all requests
- **Principle of least privilege:** Minimal necessary permissions
- **Regular audits:** Automated security scanning

### **Security Development Guidelines**

- **Input validation:** Use Zod schemas for all API inputs
- **SQL injection prevention:** Use parameterized queries only
- **Authentication:** Secure JWT handling with proper expiration
- **Rate limiting:** IP-based limiting with Redis backend
- **HTTPS everywhere:** All API calls use HTTPS

## 📊 Our Testing Philosophy

### **Testing Pyramid**

```
        E2E Tests
           /         \
          /          \
    Integration Tests   System Tests
     /             \      /
      Unit Tests
```

- **Unit Tests (70%):** Fast, isolated tests for individual functions
- **Integration Tests (20%):** Tests for component interactions and API calls
- **E2E Tests (10%):** Full user workflows in browsers

### **Test Organization**

```
tests/
├── unit/                 # Component and logic tests
│   ├── components/      # UI component tests
│   ├── hooks/          # Custom hook tests
│   └── lib/            # Utility function tests
├── integration/          # API and database tests
├── e2e/                 # End-to-end workflows
└── fixtures/           # Test data and mocks
```

## 🚀 Deployment

### **Our Deployment Pipeline**

```mermaid
gitGraph LR
    A[Developer] -->|B[Feature Branch]
    B --> |C[PR Review]
    C --> |D[CI/CD Pipeline]
    D --> |E[Staging Environment]
    E --> |F[Production Environment]
```

### **Environments**

- **Development:** Local development with hot reload
- **Staging:** Testing environment with production data
- **Production:** Live environment with monitoring

## 📞 Team Communication

### **Channels We Use**

- **GitHub:** Issues, PRs, project management
- **Slack:** Daily standups, quick questions, announcements
- **Discord:** Community support and general discussions
- **Email:** Formal communications, external partners

### **Meeting Schedule**

- **Daily Standup:** 9:30 AM Sydney time ( async)
- **Sprint Planning:** Every 2 weeks on Mondays
- **Retrospective:** End of each sprint
- **Technical Reviews:** As needed for architectural decisions

## 🎓 Your First Tasks

### **Week 1: Setup & Orientation**

- [ ] Set up development environment
- [ ] Complete local development setup guide
- [ ] Make first commit to development branch
- [ ] Set up VS Code with all recommended extensions
- [ ] Run full test suite to verify setup
- [ ] Attend team introduction meeting

### **Week 1 Goals**

- [ ] Successfully run application locally
- [ ] Understand codebase structure and architecture
- [ ] Review our coding standards and practices
- [ ] Make first small contribution (documentation or bug fix)

## 🔗 Helpful Resources

### **Internal Documentation**

- **[Architecture Guide](ARCHITECTURE.md):** System design and data flow
- **[API Documentation](api.md):** Complete API reference
- **[Component Library](design-system.md):** UI components and design system
- **[Contribution Guide](../CONTRIBUTING.md):** Detailed development practices

### **External Tools**

- **Supabase Dashboard:** [https://app.supabase.com](https://app.supabase.com)
- **Vercel Dashboard:** [https://vercel.com](https://vercel.com) (deployment)
- **GitHub Repository:** [Repository management](https://github.com/mrpouyaalavi/syllabus-sync)

### **Learning Resources**

- **React Documentation:** [react.dev](https://react.dev)
- **Next.js Documentation:** [nextjs.org/docs](https://nextjs.org/docs)
- **Tailwind CSS:** [tailwindcss.com](https://tailwindcss.com)

## 🤝 Questions?

We're here to help you succeed! Don't hesitate to ask questions.

### **For Technical Questions**

- **Raouf:** Backend, database, security, infrastructure
- **Pouya:** Frontend, UI/UX, state management

### **For Process Questions**

- **Project Management:** Sprint planning, task prioritization
- **Tools & Environment:** Setup issues, tool configuration

### **Getting Help**

- **Slack:** Ask in #development channel
- **GitHub:** Create an issue with the `question` label
- **Email:** team@syllabus-sync.dev

---

**Welcome aboard!** 🚀

_We're building the best academic management platform for Macquarie University students. Let's create something amazing together!_
