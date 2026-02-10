# Unit Testing Guidelines

**Comprehensive Unit Testing Strategy for The Syllabus Sync**

## 🎯 Unit Testing Philosophy

Unit testing validates that individual parts of our application work correctly in isolation. It's our first line of defense against bugs and regressions.

### **Testing Goals**

- **Fast Feedback:** Quick test execution under 2 seconds per test
- **High Coverage:** 85%+ line coverage for all new code
- **Reliability:** Consistent, reproducible test results
- **Maintainability:** Clear, readable test code that serves as documentation

## 🧪 Testing Framework

### **Vitest Configuration**

Our unit testing uses Vitest with these configurations:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  testEnvironment: 'jsdom',
  setupFiles: ['tests/setup.ts'],
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    exclude: ['node_modules/', 'tests/', '**/*.d.ts', '**/*.config.js'],
    thresholds: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
  globals: {
    vi: 'vitest/globals',
    React: 'vitest/globals/react',
  },
});
```

### **Testing Utilities**

```typescript
// tests/utils/test-helpers.ts
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { vi } from 'vitest';

// Custom render with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <UnitsStoreProvider>
      <ThemeProvider>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </ThemeProvider>
    </UnitsStoreProvider>
  </AuthProvider>
);

export const renderWithProviders = (ui: ReactElement, options?: RenderOptions) => {
  return render(ui, { wrapper: AllTheProviders, ...options });
};

// Mock utilities
export const mockFunction = (fn: Function) => vi.fn(fn);
export const mockObject = (obj: object) => vi.fn().mockReturnValue(obj);
export const mockPromise = <T>(value: T) => vi.fn().mockResolvedValue(value);

// Test data generators
export const createMockUser = (overrides: Partial<User> = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  fullName: 'Test User',
  studentId: '12345678',
  ...overrides
});
```

## 🧪 Test Structure

### **Directory Organization**

```
tests/
├── unit/                     # Unit tests by feature
│   ├── components/           # Component unit tests
│   │   ├── ui/           # Base UI components
│   │   ├── gamification/ # Gamification features
│   │   └── units/         # Academic units
│   ├── hooks/              # Custom hook tests
│   ├── lib/                # Utility function tests
│   └── stores/              # Store tests
├── integration/              # Integration tests
├── e2e/                     # End-to-end tests
├── fixtures/               # Test data and mocks
├── utils/                   # Testing utilities
└── setup.ts                # Global test setup
```

## 📝 Test Writing Guidelines

### **AAA Pattern**

Each test should follow the **Arrange, Act, Assert** pattern:

```typescript
describe('UserService.createUser', () => {
  // Arrange
  const mockUser = createMockUser({
    email: 'test@example.com',
    fullName: 'Test User',
  });
  const mockSave = vi.fn().mockResolvedValue(mockUser);

  // Act
  const result = await userService.createUser(mockUser);

  // Assert
  expect(result).toEqual(mockUser);
  expect(mockSave).toHaveBeenCalledWith(mockUser);
  expect(mockSave).toHaveBeenCalledTimes(1);
});
```

### **Test Naming Conventions**

```typescript
// Good test names
describe('Button Component', () => {
  it('should render with correct text', () => {
    // Test implementation
  });

  it('should handle click events', () => {
    // Test implementation
  });

  it('should be accessible', () => {
    // Test implementation
  });

  it('should show loading state', () => {
    // Test implementation
  });
});

// Descriptive test names with context
describe('UnitsStore.addUnit', () => {
  it('should add unit to store and persist to database', async () => {
    // Clear what the test does
  });

  it('should handle database errors gracefully', async () => {
    // Test error scenario
  });

  it('should update UI optimistically', async () => {
    // Test optimistic update behavior
  });
});
```

### **Test Data Management**

```typescript
// tests/factories/index.ts
export * from './userFactory';
export * from './unitFactory';
export * from './deadlineFactory';

// Clean test data after each test
afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});
```

## 🔧 Component Testing

### **React Component Tests**

```typescript
// tests/unit/components/Button.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  it('renders with correct text and props', () => {
    const { getByRole } = render(
      <Button onClick={vi.fn()}>
        Click me
      </Button>
    );

    const button = getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');
  });

  it('handles click events correctly', () => {
    const handleClick = vi.fn();
    const { getByRole } = render(
      <Button onClick={handleClick}>
        Click me
      </Button>
    );

    const button = getByRole('button');
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies correct CSS classes based on variant', () => {
    const { getByRole } = render(
      <Button variant="primary" onClick={vi.fn()}>
        Primary Button
      </Button>
    );

    const button = getByRole('button');
    expect(button).toHaveClass('bg-primary-500');
  });

  it('is accessible with proper ARIA attributes', () => {
    const handleClick = vi.fn();
    const { getByRole } = render(
      <Button onClick={handleClick} ariaLabel="Submit form">
        Submit
      </Button>
    );

    const button = getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Submit form');
    expect(button).toHaveAttribute('type', 'button');
  });
});
```

### **Hook Testing**

```typescript
// tests/unit/hooks/useAuth.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useAuth } from '@/lib/hooks/useAuth';

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial auth state', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
    expect(result.current.loading).toBe(false);
  });

  it('handles login state changes', async () => {
    const mockLogin = vi.fn();
    const { result, rerender } = renderHook(() => useAuth());

    await act(async () => {
      mockLogin.mockResolvedValue({
        user: createMockUser(),
        token: 'mock-token',
      });
      rerender();
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(createMockUser());
    expect(result.current.loading).toBe(false);
  });

  it('handles logout correctly', async () => {
    const mockLogout = vi.fn();
    const { result, rerender } = renderHook(() => useAuth());

    await act(async () => {
      mockLogout.mockResolvedValue();
      rerender();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
```

## 🔧 Store Testing

### **Zustand Store Tests**

```typescript
// tests/unit/stores/unitsStore.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { create } from 'zustand';
import type { UnitsStore } from '@/lib/store/unitsStore';

describe('UnitsStore', () => {
  let store: UnitsStore;

  beforeEach(() => {
    // Create fresh store for each test
    store = create<UnitsStore>((set, get) => ({
      units: [],
      isLoading: false,
      addUnit: async (unit) => {
        set({ isLoading: true });
        try {
          // Mock API call
          const newUnit = await mockApiCall(unit);
          set({ units: [...get().units, newUnit], isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      removeUnit: async (id) => {
        set({ isLoading: true });
        try {
          await mockApiDelete(id);
          set((state) => ({
            units: state.units.filter((unit) => unit.id !== id),
            isLoading: false,
          }));
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
    }));
  });

  it('should initialize with empty state', () => {
    expect(store.units).toEqual([]);
    expect(store.isLoading).toBe(false);
  });

  it('should add unit successfully', async () => {
    const mockUnit = createMockUnit({ name: 'Test Unit' });
    await store.addUnit(mockUnit);

    expect(store.units).toContainEqual(mockUnit);
    expect(store.isLoading).toBe(false);
  });

  it('should handle errors gracefully', async () => {
    const mockError = new Error('API Error');
    vi.mocked(mockApiCall).mockRejectedValue(mockError);

    await expect(store.addUnit(createMockUnit())).rejects.toThrow('API Error');
    expect(store.isLoading).toBe(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
});
```

## 🔧 Service Testing

### **API Service Tests**

```typescript
// tests/unit/lib/apiService.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { apiRequest } from '@/lib/utils/api';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Service', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('makes GET request correctly', async () => {
    const mockResponse = { success: true, data: { id: '123' } };
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => Promise.resolve(mockResponse),
    } as Response);

    const result = await apiRequest('/test/endpoint');

    expect(mockFetch).toHaveBeenCalledWith('/test/endpoint', {
      method: 'GET',
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
      }),
    });
    expect(result).toEqual(mockResponse.data);
  });

  it('handles POST requests with body', async () => {
    const testData = { name: 'Test' };
    const mockResponse = { success: true, data: { id: '456' } };
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => Promise.resolve(mockResponse),
    } as Response);

    const result = await apiRequest('/test/endpoint', {
      method: 'POST',
      body: testData,
    });

    expect(mockFetch).toHaveBeenCalledWith('/test/endpoint', {
      method: 'POST',
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(testData),
    });
    expect(result).toEqual(mockResponse.data);
  });

  it('handles API errors correctly', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () =>
        Promise.resolve({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Server error' },
        }),
    } as Response);

    await expect(apiRequest('/test/endpoint')).rejects.toThrow('Server error');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
});
```

## 🧪 Advanced Testing Patterns

### **Property-Based Testing**

```typescript
// tests/unit/components/FormInput.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormInput } from '@/components/ui/FormInput';

describe('FormInput Component', () => {
  it.each([
    { type: 'text', required: true, label: 'Name' },
    { type: 'email', required: true, label: 'Email' },
    { type: 'password', required: true, label: 'Password' },
    { type: 'number', required: false, label: 'Age' }
  ])('renders correctly with type: $type, required: $required, label: $label', ({ type, required, label }) => {
    const mockOnChange = vi.fn();

    render(
      <FormInput
        type={type}
        required={required}
        label={label}
        onChange={mockOnChange}
        value=""
      />
    );

    const input = screen.getByLabelText(label);

    // Basic rendering assertions
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', type);
    expect(input).toHaveAttribute('required', required ? '' : null);
    expect(input).toHaveAttribute('aria-label', label);

    // Required field validation
    fireEvent.change(input, 'test value');
    expect(mockOnChange).toHaveBeenCalledWith('test value');

    // Accessibility
    expect(input).toHaveAttribute('aria-required', required ? 'true' : null);
  });
});
```

### **Mock Management**

```typescript
// tests/utils/mocks.ts
import { vi } from 'vitest';

// Mock external modules
vi.mock('@/lib/supabase/client');
vi.mock('@/lib/services/orsRouting');

// Mock implementations
export const mockSupabaseClient = {
  auth: {
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  })),
};

// Mock environment variables
export const mockEnv = {
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  DATABASE_URL: 'postgresql://localhost:5432/test',
};
```

## 📊 Coverage Requirements

### **Coverage Targets**

| File Type  | Minimum Coverage | Rationale                             |
| ---------- | ---------------- | ------------------------------------- |
| Components | 90%              | Critical user-facing code             |
| Hooks      | 85%              | Business logic, moderate complexity   |
| Utils      | 80%              | Utility functions, some complexity    |
| Stores     | 85%              | State management, important to test   |
| Services   | 90%              | External integrations, critical paths |

### **Exclusions**

```typescript
// vitest.config.ts
export default defineConfig({
  coverage: {
    exclude: [
      'node_modules/',
      'tests/',
      '**/*.d.ts',
      '**/*.config.js',
      '**/stories/', // Storybook stories
      '**/__mocks__/', // Mock data files
      '**/.next/', // Next.js build files
      'coverage/', // Coverage reports
    ],
  },
});
```

---

**Comprehensive Unit Testing** 🧪

_For integration testing guidelines, see [integration-testing.md](integration-testing.md)_
