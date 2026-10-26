import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

// What only the React components do, such as a ref or hydration, runs in Chromium; the behaviour
// both implementations share is in testing/contracts. The build scripts run in Node.js.
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'react',
          include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        test: { name: 'react-scripts', include: ['scripts/**/*.test.ts'], environment: 'node' },
      },
    ],
  },
});
