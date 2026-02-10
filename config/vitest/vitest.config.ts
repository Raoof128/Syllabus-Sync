import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    globals: true,
    testTimeout: 10000,
    alias: {
      '@': path.resolve(__dirname, '../..'),
    },
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
        statements: 35,
        branches: 30,
        functions: 35,
        lines: 35,
      },
    },
  },
});
