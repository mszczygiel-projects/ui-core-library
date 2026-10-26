import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'guidelines',
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
