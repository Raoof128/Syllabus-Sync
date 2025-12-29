import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    globals: true,
    // Run tests sequentially to avoid memory issues
    sequence: {
      shuffle: false,
    },
    // Use threads pool with single thread for stability
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    // Increase timeout for slower systems
    testTimeout: 10000,
  },
});
