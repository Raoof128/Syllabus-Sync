import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['tests/e2e.spec.ts', 'tests/accessibility.spec.ts'],
    globals: true,
    testTimeout: 10000,
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'tests/**',
        '**/*.d.ts',
        '**/*.config.{ts,js,mjs}',
        '**/types/**',
        'public/**',
        '.next/**',
        'coverage/**',
        // Exclude files that are hard to test (configs, scripts)
        'scripts/**',
        'sentry.*.config.ts',
        'app/api/_lib/versioning.ts', // Minimal utility
      ],
      // Coverage thresholds - starting points based on current coverage
      // TODO: Gradually increase these as more tests are added
      thresholds: {
        statements: 40,
        branches: 30,
        functions: 40,
        lines: 40,
      },
    },
  },
});
