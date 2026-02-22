# Contributing to The Syllabus Sync

**Enterprise-Grade Development Guidelines for Industry Professionals**

We welcome contributions from the development community! This document outlines our professional development standards and contribution workflow.

## 🎯 Development Philosophy

### **Core Principles**

- **Security First:** Every PR must pass comprehensive security validation
- **Accessibility Always:** WCAG 2.1 AA compliance is non-negotiable
- **Performance Obsessed:** Core Web Vitals and bundle analysis are mandatory
- **Test Coverage:** All features require comprehensive test suites
- **Documentation Driven:** Code must be self-documenting and well-commented

### **Quality Gates**

- **100% Test Pass Rate:** All tests must pass in CI/CD
- **Zero Security Vulnerabilities:** Automated security scans must be clean
- **Type Safety:** Strict TypeScript with zero `any` types
- **Code Coverage:** Minimum 40% coverage for new features
- **Performance:** Lighthouse scores >90 across all categories

## 🚀 Getting Started

### **Development Environment**

```bash
# Clone and setup
git clone https://github.com/mrpouyaalavi/syllabus-sync.git
cd syllabus-sync
npm install

# Configure environment
cp .env.example .env.local
# Add your Supabase credentials and API keys

# Start development with hot reload
npm run dev

# Run comprehensive checks before committing
npm run check
```

### **Recommended Tools**

- **IDE:** VS Code with our workspace settings
- **Browser:** Chrome DevTools for debugging
- **Testing:** Vitest for unit tests, Playwright for E2E
- **Performance:** Lighthouse CI integration
- **Security:** OWASP ZAP for security testing

## 📋 Contribution Workflow

### **1. Issue Creation**

- All significant changes must start with a GitHub issue
- Use our issue templates for bug reports, features, and security
- Include reproduction steps, expected behavior, and environment details

### **2. Branch Strategy**

```bash
# Create feature branch from main
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-number-description
```

### **3. Development Standards**

```bash
# Format code
npm run format

# Type checking
npm run typecheck

# Linting
npm run lint

# Run tests
npm run test

# Full validation
npm run check
```

### **4. Pull Request Process**

- **Draft PRs** are encouraged for early feedback
- All PRs must pass automated checks
- PR descriptions must include:
  - Clear problem statement
  - Implementation approach
  - Testing strategy
  - Screenshots/demos for UI changes
  - Performance impact assessment

## 🏗️ Code Standards

### **TypeScript Guidelines**

```typescript
// ✅ Good - Explicit typing with interfaces
interface UserProfile {
  id: string;
  fullName: string;
  email: string;
}

const createUser = (profile: UserProfile): User => {
  // Implementation with full type safety
};

// ❌ Bad - Using 'any' type
const createUser = (profile: any): any => {
  // Unsafe implementation
};
```

### **React Component Standards**

```tsx
// ✅ Good - Proper typing and accessibility
interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  "aria-label"?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  "aria-label": ariaLabel,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="btn-primary"
      type="button"
    >
      {children}
    </button>
  );
};

export default Button;
```

### **State Management (Zustand)**

```typescript
// ✅ Good - Proper typing and middleware
interface AppStore {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

const useAppStore = create<AppStore>((set) => ({
  user: null,
  isLoading: false,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
}));

// Use in components with proper selectors
const { user, isLoading, setUser } = useAppStore();
```

## 🧪 Testing Requirements

### **Unit Tests**

```typescript
// ✅ Good - Comprehensive test coverage
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Button from './Button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button onClick={vi.fn()}>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is accessible', () => {
    const { container } = render(<Button onClick={vi.fn()}>Click me</Button>);
    expect(container.firstChild).toHaveAccessibleName();
  });
});
```

### **E2E Tests**

```typescript
// ✅ Good - Accessibility and functionality
import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("user can login with valid credentials", async ({ page }) => {
    await page.goto("/login");

    // Fill login form
    await page.fill('[data-testid="email-input"]', "user@example.com");
    await page.fill('[data-testid="password-input"]', "password");
    await page.click('[data-testid="login-button"]');

    // Verify successful login
    await expect(page).toHaveURL("/home");
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
  });

  test("login form is accessible", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveAccessibleName();
  });
});
```

## 🔒 Security Standards

### **Input Validation**

```typescript
// ✅ Good - Zod schema validation
import { z } from "zod";

const CreateUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z
    .string()
    .min(1, "Full name is required")
    .max(100, "Name too long"),
});

type CreateUserInput = z.infer<typeof CreateUserSchema>;
```

### **API Security**

```typescript
// ✅ Good - CSRF protection and rate limiting
import { NextRequest, NextResponse } from "next/server";
import { validateCSRF } from "@/lib/security/csrf";
import { rateLimit } from "@/lib/security/rateLimit";

export async function POST(request: NextRequest) {
  // Validate CSRF token
  if (!validateCSRF(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  // Apply rate limiting
  const rateLimitResult = await rateLimit(request);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": rateLimitResult.retryAfter },
      },
    );
  }

  // Process request...
}
```

## 🌐 Internationalization

### **Translation Standards**

```typescript
// ✅ Good - Proper i18n usage
import { useTranslation } from '@/lib/i18n/client';

const Component = () => {
  const { t } = useTranslation('common');

  return (
    <div>
      <h1>{t('welcome')}</h1>
      <p>{t('description', { count: userCount })}</p>
    </div>
  );
};
```

### **Adding New Translation Keys**

```json
// en/translations.json
{
  "feature": {
    "title": "New Feature",
    "description": "Describe what this feature does",
    "actions": {
      "save": "Save",
      "cancel": "Cancel"
    }
  }
}
```

## 📊 Performance Guidelines

### **Code Splitting**

```typescript
// ✅ Good - Lazy loading with error boundaries
import { lazy, Suspense } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

const App = () => (
  <ErrorBoundary>
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyComponent />
    </Suspense>
  </ErrorBoundary>
);
```

### **Image Optimization**

```tsx
// ✅ Good - Next.js Image optimization
import Image from "next/image";

const Avatar = ({ src, alt, size = 40 }) => (
  <Image
    src={src}
    alt={alt}
    width={size}
    height={size}
    className="rounded-full"
    priority={size < 80} // Prioritize small avatars
  />
);
```

## 🎨 Design System Usage

### **Component Examples**

```tsx
// ✅ Good - Using design tokens and proper theming
import { MagicCard } from "@/components/ui/MagicCard";
import { Button } from "@/components/ui/Button";

const FeatureCard = ({ title, description, actionLabel }) => (
  <MagicCard className="p-6 border-mq-border">
    <h3 className="text-xl font-semibold text-mq-content mb-2">{title}</h3>
    <p className="text-mq-content-secondary mb-4">{description}</p>
    <Button variant="primary" onClick={actionHandler}>
      {actionLabel}
    </Button>
  </MagicCard>
);
```

## 🚨 Issue Templates

### **Bug Report Template**

```markdown
## Bug Description

Brief description of the bug

## Steps to Reproduce

1. Go to...
2. Click on...
3. Scroll down to...
4. See error

## Expected Behavior

Clear and concise description of what you expected to happen

## Actual Behavior

What actually happened. Include error messages, screenshots if possible

## Environment

- OS: [e.g. macOS 14.0]
- Browser: [e.g. Chrome 120.0]
- Device: [e.g. Desktop, Mobile]
- Version: [e.g. v1.0.0-rc.8]
```

### **Feature Request Template**

```markdown
## Feature Description

Clear and concise description of the feature

## Problem Statement

What problem does this feature solve?

## Proposed Solution

How do you envision this feature working?

## Alternatives Considered

What other approaches did you consider?

## Additional Context

Any other context, mockups, or examples
```

## 📋 Review Checklist

Before submitting your PR, ensure:

### **Code Quality**

- [ ] All tests pass (`npm run test`)
- [ ] Code is formatted (`npm run format:check`)
- [ ] No linting errors (`npm run lint`)
- [ ] TypeScript compiles (`npm run typecheck`)
- [ ] No `any` types in new code

### **Security & Performance**

- [ ] No security vulnerabilities
- [ ] Input validation implemented
- [ ] Performance impact assessed
- [ ] Bundle size analyzed

### **Accessibility**

- [ ] ARIA labels are descriptive
- [ ] Keyboard navigation works
- [ ] Color contrast meets WCAG standards
- [ ] Screen reader compatibility

### **Documentation**

- [ ] Code is well-commented
- [ ] Translation keys added
- [ ] API documentation updated
- [ ] Tests are documented

## 🤝 Code of Conduct

By contributing to this project, you agree to:

- Be respectful and inclusive
- Provide constructive feedback
- Welcome newcomers and help them learn
- Focus on what is best for the community

## 📞 Getting Help

- **Discord:** [Our Community Server](https://discord.gg/syllabus-sync)
- **GitHub Issues:** [Create an Issue](https://github.com/mrpouyaalavi/syllabus-sync/issues)
- **Documentation:** [Developer Portal](https://docs.syllabus-sync.dev)

---

**Thank you for contributing to The Syllabus Sync! 🎓**

_Your contributions help thousands of Macquarie University students succeed academically._
