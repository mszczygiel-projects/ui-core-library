import { defineConfig } from 'vitest/config';

// Node-environment tests for the build scripts only — component tests run in
// jsdom via vitest.config.ts.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['scripts/**/*.test.ts'],
    globals: false,
  },
});
