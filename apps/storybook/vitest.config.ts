import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      { test: { name: 'storybook-unit', include: ['src/**/*.test.ts'], environment: 'node' } },
      ...['light', 'dark'].map((theme) => ({
        plugins: [
          storybookTest({
            configDir: import.meta.dirname + '/.storybook',
            initialGlobals: { theme },
          }),
        ],
        test: {
          name: `stories-${theme}`,
          provide: { expectedTheme: theme },
          setupFiles: ['./.storybook/theme.setup.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' as const }],
          },
        },
      })),
    ],
  },
});
