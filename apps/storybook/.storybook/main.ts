import type { StorybookConfig } from '@storybook/react-vite';
import type { Plugin } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');

const config: StorybookConfig = {
  stories: [
    `${root}/packages/web-components/src/**/*.stories.ts`,
    `${root}/packages/react/src/**/*.stories.tsx`,
  ],
  addons: [],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async (config) => {
    const { mergeConfig } = await import('vite');

    const merged = mergeConfig(config, {
      base: process.env.CI ? '/ui-core-library/' : '/',
      resolve: {
        alias: {
          '@ui-core/foundations': path.resolve(__dirname, '../../../packages/foundations/src'),
          '@ui-core/wc': path.resolve(__dirname, '../../../packages/web-components/src'),
          '@ui-core/react': path.resolve(__dirname, '../../../packages/react/src'),
          '@ui-core/icons': path.resolve(__dirname, '../../../packages/icons/src'),
        },
      },
    });

    // react-docgen (Babel) can't parse Lit's legacy decorator syntax (@decorator before export).
    // Skip plain .ts files — only .tsx and .stories.ts files need docgen.
    merged.plugins = (merged.plugins as Plugin[]).map((plugin) => {
      if (
        !plugin ||
        typeof plugin !== 'object' ||
        plugin.name !== 'storybook:react-docgen-plugin'
      ) {
        return plugin;
      }
      const original = plugin.transform as Plugin['transform'];
      return {
        ...plugin,
        transform(code: string, id: string, ...rest: unknown[]) {
          if (id.endsWith('.ts') && !id.endsWith('.stories.ts')) return null;
          return (original as Function)?.call(this, code, id, ...rest);
        },
      };
    });

    return merged;
  },
};

export default config;
