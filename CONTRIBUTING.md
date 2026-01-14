# Contributing to Syllabus Sync

First off, thank you for considering contributing to Syllabus Sync! It's people like you that make this a great tool for the Macquarie University community.

### 🚩 Quick Start

1. **Fork** the repository.
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/syllabus-sync.git`
3. **Install** dependencies: `npm install`
4. **Create** a branch: `git checkout -b feat/your-feature`
5. **Verify**: Ensure the project builds and tests pass: `npm run prepush`

### 🏗️ Project Standards

#### 1. Code Quality
- **TypeScript**: No `as any` (unless for dynamic i18n keys). Use strict typing.
- **Components**: Follow the "Apple Liquid Glass" design system (see `docs/ARCHITECTURE.md`).
- **Tests**: Every new feature requires unit tests in `tests/`.

#### 2. Workflow
- We use **Conventional Commits**:
  - `feat:` for new features
  - `fix:` for bug fixes
  - `docs:` for documentation
  - `refactor:` for code changes that neither fix a bug nor add a feature
- **Pre-push Hook**: We enforce `npm run prepush` which runs linting, typechecking, and tests.

#### 3. Pull Request Process
- Ensure your PR is linked to an issue.
- Maintain a clean commit history (rebase if necessary).
- PRs require at least one approval from the core team (Pouya or Raouf).

### 🎨 Design System
Our UI is built on a custom extension of Shadcn UI, tailored for MQ's brand.
- **Colors**: Use variables from `app/mq-tokens.css`.
- **Icons**: Exclusively use `lucide-react`.
- **Animations**: Use `framer-motion` for fluid transitions.

---

**Built with 💡 by the MQ Community.**
