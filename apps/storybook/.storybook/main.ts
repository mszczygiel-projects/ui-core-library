import { dirname } from 'node:path';

import type { StorybookConfig } from '@storybook/react-vite';

import { readReactApi, typesEntry } from './react-api.ts';

const REACT_API = 'virtual:ui-core/react-api';

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
    // The stories import the React components from their package, built, so only an
    // engine that reads the published types through TypeScript finds their props.
    experimentalReactComponentMeta: true,
    menuOnboardingChecklist: false,
    sidebarOnboardingChecklist: false,
  },
  // The API tables come from react-docgen-typescript over the published types, and
  // the stories declare their controls, so Storybook's docgen of the sources has nothing to read.
  typescript: { reactDocgen: false },
  viteFinal: (viteConfig) => ({
    ...viteConfig,
    plugins: [
      ...(viteConfig.plugins ?? []),
      {
        // The API tables of the React components, read from the published types of the package.
        name: 'ui-core-react-api',
        resolveId: (id: string) => (id === REACT_API ? `\0${REACT_API}` : undefined),
        load: (id: string) =>
          id === `\0${REACT_API}` ? `export default ${JSON.stringify(readReactApi())};` : undefined,
        // A rebuild of the package while Storybook runs adds or changes components, so the
        // tables are read again and the pages reload.
        configureServer: (server) => {
          const types = dirname(typesEntry());
          server.watcher.add(types);
          server.watcher.on('change', (file) => {
            const module = server.moduleGraph.getModuleById(`\0${REACT_API}`);
            if (file.startsWith(types) && file.endsWith('.d.ts') && module !== undefined) {
              server.moduleGraph.invalidateModule(module);
              server.ws.send({ type: 'full-reload' });
            }
          });
        },
      },
    ],
  }),
};

export default config;
