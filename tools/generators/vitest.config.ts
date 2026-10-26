import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'generators',
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
