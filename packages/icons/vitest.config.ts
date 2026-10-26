import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'icons',
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    environment: 'node',
  },
});
