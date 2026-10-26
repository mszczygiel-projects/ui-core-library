import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

// What only the web components do, such as the attributes of a host, runs here in Chromium against
// the built modules; the behaviour both implementations share is in testing/contracts.
export default defineConfig({
  test: {
    name: 'web-components',
    include: ['src/**/*.test.ts'],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
  },
});
