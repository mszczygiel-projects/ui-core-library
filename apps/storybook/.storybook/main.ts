import type { StorybookConfig } from '@storybook/react-vite';

/**
 * The documentation site of the library. Its pages and stories live in src/, and it
 * reads the packages through their exports, built, the way an application does.
 */
const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../src/**/*.mdx', '../src/**/*.stories.tsx'],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-mcp',
    '@storybook/addon-vitest',
  ],
  core: {
    // Storybook reports usage to its makers unless told not to; the repository sends nothing.
    disableTelemetry: true,
    disableWhatsNewNotifications: true,
  },
  features: {
    // A story's background comes from its surface, so the background tool would only disagree.
    backgrounds: false,
    // The documentation tools of the MCP server read the manifests.
    componentsManifest: true,
    menuOnboardingChecklist: false,
    sidebarOnboardingChecklist: false,
  },
  // The stories declare their controls, so Storybook's docgen of the sources has nothing to read.
  typescript: { reactDocgen: false },
};

export default config;
