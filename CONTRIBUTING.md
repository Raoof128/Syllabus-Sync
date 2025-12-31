# Contributing to The Syllabus Sync

Thank you for your interest in contributing to The Syllabus Sync! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Bugs

- Use the [GitHub Issues](https://github.com/your-username/syllabus-sync/issues) page
- Provide a clear description of the bug
- Include steps to reproduce
- Add screenshots if applicable
- Specify your environment (OS, browser, Node.js version)

### Suggesting Features

- Open an issue with the "enhancement" label
- Provide a clear description of the feature
- Explain the use case and benefits
- Consider if it fits the project's goals

### Code Contributions

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Follow the coding standards** (see below)
5. **Add tests** for new functionality
6. **Run tests and linting**
   ```bash
   npm test
   npm run lint
   npm run format
   ```
7. **Commit your changes**
   ```bash
   git commit -m "feat: add your feature description"
   ```
8. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
9. **Create a Pull Request**

## 📝 Coding Standards

### TypeScript/React

- Use TypeScript strict mode
- Define types for all props and state
- Avoid `any` type
- Use functional components with hooks
- Keep components small and focused (< 200 lines)
- Use proper key props in lists

### Styling

- Use Tailwind CSS utility classes
- Follow mobile-first approach
- Use Shadcn UI components for consistency
- Maintain Macquarie University branding colors

### File Naming

- Components: PascalCase (e.g., `UnitCard.tsx`)
- Utilities: camelCase (e.g., `utils.ts`)
- Pages: lowercase (e.g., `page.tsx`)

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code formatting
- `refactor:` Code restructuring
- `test:` Test updates
- `chore:` Build/config changes

## 🧪 Testing

- Write tests for new components and functionality
- Use Vitest and Testing Library
- Aim for good test coverage
- Test user interactions and edge cases

## 📋 Project Structure

```
syllabus-sync/
├── app/                      # Next.js pages
├── components/               # React components
├── lib/                     # Utilities and logic
├── data/                    # Sample data
├── tests/                   # Test files
├── public/                  # Static assets
└── Team_Plan/              # Documentation
```

## 🎨 Design Guidelines

### Macquarie University Branding

- **Primary Red:** `#A6192E`
- **Primary Blue:** `#002A45`
- **Accent Gold:** `#FFB81C`

### UI/UX Principles

- Mobile-first responsive design
- Accessibility first (ARIA labels, keyboard navigation)
- Consistent component usage
- Clear visual hierarchy

## 🚀 Development Setup

1. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/syllabus-sync.git
   cd syllabus-sync
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Run tests**
   ```bash
   npm test
   ```

## 📖 Documentation

- Keep documentation up to date
- Update AGENT.md for technical changes
- Update CHANGELOG.md for version changes
- Add comments for complex logic

## 🤓 Team Roles

- **Frontend Lead**: Pouya - UI/UX, Components, State Management
- **Backend Lead**: Raouf - Database, API, Configuration

See [TEAM_ROLES.md](Team_Plan/TEAM_ROLES.md) for detailed responsibilities.

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Code of Conduct

Please be respectful and professional in all interactions. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for details.

---

**Thank you for contributing to The Syllabus Sync!** 🎓
