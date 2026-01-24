# Integration Testing Guide

**Comprehensive Integration Testing Strategy for The Syllabus Sync**

## 🎯 Integration Testing Philosophy

### **Why Integration Testing Matters**

Integration testing verifies that different parts of our system work together correctly. It catches issues that unit tests miss and ensures our platform works reliably in real-world scenarios.

### **Testing Pyramid**

```
                      +-----------------+
                      |                 |
                      |     E2E Tests |
                      |     (10%)       |
                      +--------+--------+
                      |                 |
      System/Integration | Unit Tests     |
        Tests (20%)      | (70%)          |
                      |                 |
                      +--------+--------+
```

- **Unit Tests (70%):** Fast, isolated tests for individual functions
- **Integration Tests (20%):** Tests component interactions and API integrations
- **E2E Tests (10%):** Full user workflows in browsers

## 🔧 Testing Architecture

### **Test Categories**

#### **API Integration Tests**

- **Database Integration:** Supabase operations and RLS policies
- **External Service Integration:** ORS routing, Redis caching
- **Authentication Flow:** Login, passkey, session management
- **Rate Limiting:** Security middleware functionality
- **Error Handling:** API error responses and client-side handling

#### **Component Integration Tests**

- **Store Integration:** Zustand state management with components
- **Form Integration:** Multi-step forms with validation
- **Navigation Integration:** React Router and programmatic navigation
- **Theme Integration:** Dark/light mode switching
- **Notification Integration:** Push notification system

#### **Workflow Integration Tests**

- **User Registration:** Complete signup flow
- **Unit Management:** CRUD operations with schedules
- **Deadline Management:** Creation, completion, notifications
- **Calendar Integration:** Event creation and management
- **Map Integration:** Navigation and location services

## 🛠️ Testing Setup

### **Integration Test Environment**

```typescript
// tests/integration/setup.ts
import { beforeAll, afterAll } from 'vitest';
import { createTestClient } from '@/lib/test/client';

// Test database setup
beforeAll(async () => {
  // Setup test database
  await setupTestDatabase();

  // Mock external services
  mockExternalServices();

  // Initialize test client
  global.testClient = createTestClient();
});

afterAll(async () => {
  // Cleanup
  await cleanupTestDatabase();

  // Restore mocks
  restoreExternalServices();
});
```

### **Test Data Factory**

```typescript
// tests/factories/userFactory.ts
import { faker } from '@faker-js/faker';

interface TestData {
  id?: string;
  email?: string;
  fullName?: string;
  studentId?: string;
}

export const createUser = (overrides: Partial<TestData> = {}) => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  fullName: faker.person.fullName(),
  studentId: faker.datatype.string({ format: '#######' }),
  ...overrides,
});

export const createUsers = (count: number, overrides: Partial<TestData> = {}) =>
  Array.from({ length: count }, () => createUser(overrides));
```

### **Mock Service Configurations**

```typescript
// tests/mocks/services.ts
import { vi } from 'vitest';

// Mock ORS routing service
export const mockORSRouting = vi.fn().mockImplementation(async (start, end) => {
  return {
    routes: [
      {
        coordinates: [start.lng, start.lat],
        instruction: 'Head north on University Avenue',
      },
    ],
    distance: 1500, // meters
    duration: 1200, // seconds
  };
});

// Mock Supabase client
export const mockSupabaseClient = {
  from: vi.fn().mockReturnValue({
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }),
};
```

## 🧪 Integration Test Examples

### **Authentication Integration**

```typescript
// tests/integration/auth.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '@/lib/auth/context';
import { LoginClient } from '@/app/login/LoginClient';

describe('Authentication Integration', () => {
  beforeEach(() => {
    render(
      <AuthProvider>
        <LoginClient />
      </AuthProvider>
    );
  });

  afterEach(() => {
    // Cleanup auth state
    localStorage.clear();
  });

  it('should login with valid credentials', async () => {
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, 'student@mq.edu.au');
    fireEvent.change(passwordInput, 'validPassword123');
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
      expect(window.location.pathname).toBe('/home');
    }, { timeout: 5000 });
  });

  it('should show error for invalid credentials', async () => {
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, 'invalid@example.com');
    fireEvent.change(passwordInput, 'wrongPassword');
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
```

### **Unit Management Integration**

```typescript
// tests/integration/units.test.ts
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UnitsStore } from '@/lib/store/unitsStore';
import { UnitCard } from '@/components/units/UnitCard';

describe('Units Management Integration', () => {
  it('should create and display new unit', async () => {
    render(<UnitsPage />);

    const addButton = screen.getByText(/add unit/i);
    fireEvent.click(addButton);

    const unitNameInput = screen.getByLabelText(/unit name/i);
    const unitCodeInput = screen.getByLabelText(/unit code/i);
    const submitButton = screen.getByRole('button', { name: /save/i });

    fireEvent.change(unitNameInput, 'Test Unit');
    fireEvent.change(unitCodeInput, 'TEST101');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Test Unit')).toBeInTheDocument();
      expect(screen.getByText('TEST101')).toBeInTheDocument();
    });
  });

  it('should handle unit creation errors gracefully', async () => {
    render(<UnitsPage />);

    const addButton = screen.getByText(/add unit/i);
    fireEvent.click(addButton);

    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/unit code is required/i)).toBeInTheDocument();
    });
  });
});
```

### **Database Integration**

```typescript
// tests/integration/database.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { supabase } from '@/lib/supabase/client';
import { createTestUser } from '@/tests/factories/userFactory';

describe('Database Integration', () => {
  let testUser: any;

  beforeAll(async () => {
    testUser = await createTestUser();
    await supabase.auth.signUp({
      email: testUser.email,
      password: 'testPassword123',
      options: {
        data: { full_name: testUser.fullName },
      },
    });

    // Verify user creation
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', testUser.email)
      .single();

    expect(error).toBeNull();
    expect(data).toBeTruthy();
  });

  it('should enforce RLS policies', async () => {
    // Test that user can only access their own data
    const otherUserData = await supabase
      .from('users')
      .select('*')
      .eq('email', 'other@example.com')
      .single();

    expect(otherUserData.data).toBeNull();
  });

  afterAll(async () => {
    // Cleanup test user
    if (testUser) {
      await supabase.auth.admin.deleteUser(testUser.id);
    }
  });
});
```

## 🔍 Test Utilities

### **Integration Test Helpers**

```typescript
// tests/utils/integration.ts
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

export const renderWithProviders = (
  ui: ReactElement,
  options?: RenderOptions
) => {
  return render(ui, {
    wrapper: ({ children }) => (
      <AuthProvider>
        <UnitsStoreProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </ThemeProvider>
      </UnitsStoreProvider>
    </AuthProvider>),
    ...options
  });
};

export const waitForElement = async (
  getByTestId: (testId: string) => Promise<Element>,
  timeout = 5000
) => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const element = getByTestId(testId);
      if (element) {
        return element;
      }
    } catch (error) {
      // Element not found yet
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  throw new Error(`Element ${testId} not found within ${timeout}ms`);
};
```

### **API Response Helpers**

```typescript
// tests/utils/api.ts
import { vi } from 'vitest';

export const mockApiResponse = <T>(data: T, status = 200) => ({
  ok: true,
  status,
  json: async () => Promise.resolve(data),
  headers: new Headers({
    'content-type': 'application/json',
    'x-request-id': vi.fn().mockReturnValue('test-request-123'),
  }),
  text: async () => Promise.resolve(JSON.stringify(data)),
});

export const mockApiError = (message: string, code = 'TEST_ERROR', status = 400) => ({
  ok: false,
  status,
  json: async () =>
    Promise.resolve({
      success: false,
      error: { code, message },
    }),
  text: async () =>
    Promise.resolve(
      JSON.stringify({
        success: false,
        error: { code, message },
      }),
    ),
});
```

## 🚀 Continuous Integration

### **CI/CD Integration Testing**

```yaml
# .github/workflows/integration-tests.yml
name: Integration Tests
on: [push, pull_request]

jobs:
  integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd=pg_isready
          --health-interval=10s
          --health-timeout=5s
          --health-retries=5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Setup Test Database
        run: |
          PGPASSWORD=$POSTGRES_PASSWORD psql -h localhost -U postgres -c test_db < tests/integration/setup.sql
        env:
          POSTGRES_PASSWORD: postgres

      - name: Run Integration Tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

      - name: Upload Test Results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: integration-test-results
          path: test-results/integration
```

## 📊 Test Reporting

### **Coverage Requirements**

- **Minimum Coverage:** 80% line coverage for integration tests
- **Critical Paths:** All authentication flows must be covered
- **Error Scenarios:** Both success and failure paths tested
- **Performance:** Test completion under 5 minutes per suite

### **Test Metrics Collection**

```typescript
// tests/utils/metrics.ts
interface TestMetrics {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  coverage: number;
  duration: number;
  performance: {
    averageResponseTime: number;
    slowestTest: string;
    fastestTest: string;
  };
}

export const collectTestMetrics = (testResults: TestResults[]): TestMetrics => {
  const totalTests = testResults.length;
  const passedTests = testResults.filter((result) => result.status === 'passed').length;
  const failedTests = totalTests - passedTests;

  return {
    totalTests,
    passedTests,
    failedTests,
    coverage: calculateCoverage(testResults),
    duration: calculateTotalDuration(testResults),
    performance: calculatePerformanceMetrics(testResults),
  };
};
```

## 🎭 Best Practices

### **Test Design Principles**

- **Independent Tests:** Each test should run independently without side effects
- **Deterministic Results:** Same input should always produce same output
- **Fast Feedback:** Quick test execution with immediate results
- **Clear Failure Messages:** Helpful error messages for debugging
- **Realistic Scenarios:** Test actual user workflows, not theoretical cases

### **Anti-Patterns**

- **Don't Test Implementation Details:** Test behavior, not code internals
- **Avoid Test Order Dependencies:** Tests should run in any order
- **No Shared Test State:** Each test should set up its own data
- **Minimize Mocks:** Use real implementations when possible

---

**Comprehensive Integration Testing** 🧪

_For unit testing guidelines, see [docs/unit-testing.md](docs/unit-testing.md)_
