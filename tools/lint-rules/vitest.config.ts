import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'lint-rules',
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
