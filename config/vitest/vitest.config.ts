import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import react from '@vitejs/plugin-react';
import path from 'path';

const projectRoot = path.resolve(__dirname, '../..');

export default defineConfig({
  root: projectRoot,
  plugins: [tsconfigPaths({ root: projectRoot }), react()],
  resolve: {
    alias: [{ find: /^@\/(.*)/, replacement: path.join(projectRoot, '$1') }],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
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
      thresholds: {
        statements: 50,
        branches: 45,
        functions: 50,
        lines: 50,
      },
    },
  },
});
