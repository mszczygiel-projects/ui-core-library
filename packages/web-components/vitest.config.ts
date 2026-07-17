import { defineConfig } from 'vitest/config';

// Node-environment tests for the build scripts only — component tests run in
// real browsers via @web/test-runner (see web-test-runner.config.mjs).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['scripts/**/*.test.ts'],
    globals: false,
  },
});
