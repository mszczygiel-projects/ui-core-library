// @ts-check
import { join } from 'node:path';

import js from '@eslint/js';
import eslintReact from '@eslint-react/eslint-plugin';
import nx from '@nx/eslint-plugin';
import stylistic from '@stylistic/eslint-plugin';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier/flat';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import storybook from 'eslint-plugin-storybook';
import * as jsoncParser from 'jsonc-eslint-parser';
import tseslint from 'typescript-eslint';

import noLiteralText from './tools/lint-rules/src/no-literal-text.ts';

/** Files that render React: the React components, the site and the contracts. */
const reactFiles = ['packages/react/src/**/*.tsx', 'apps/storybook/**/*.tsx', 'testing/**/*.tsx'];

const tsFiles = ['**/*.ts', '**/*.mts', '**/*.cts', '**/*.tsx'];
const jsFiles = ['**/*.js', '**/*.mjs', '**/*.cjs'];

/**
 * The allowed dependencies between projects, by their `type:*` tag. A project whose tags match no
 * constraint can neither depend on a project nor be depended on, so a missing tag fails lint.
 */
const depConstraints = [
  { sourceTag: 'type:foundations', onlyDependOnLibsWithTags: ['type:foundations'] },
  { sourceTag: 'type:icons', onlyDependOnLibsWithTags: ['type:icons'] },
  { sourceTag: 'type:shared', onlyDependOnLibsWithTags: ['type:shared'] },
  {
    sourceTag: 'type:web-components',
    onlyDependOnLibsWithTags: [
      'type:foundations',
      'type:icons',
      'type:shared',
      'type:web-components',
    ],
  },
  {
    sourceTag: 'type:react',
    onlyDependOnLibsWithTags: ['type:foundations', 'type:icons', 'type:shared', 'type:react'],
  },
  {
    sourceTag: 'type:testing',
    onlyDependOnLibsWithTags: [
      'type:foundations',
      'type:icons',
      'type:shared',
      'type:web-components',
      'type:react',
      'type:testing',
    ],
  },
  {
    sourceTag: 'type:app',
    onlyDependOnLibsWithTags: [
      'type:foundations',
      'type:icons',
      'type:shared',
      'type:web-components',
      'type:react',
      'type:tool',
      'type:app',
    ],
  },
  {
    sourceTag: 'type:tool',
    onlyDependOnLibsWithTags: ['type:foundations', 'type:icons', 'type:shared', 'type:tool'],
  },
];

export default defineConfig(
  globalIgnores([
    '**/dist',
    '**/coverage',
    '**/out-tsc',
    '**/.nx',
    // Written by build steps, such as the typed token references.
    '**/generated',
    // The static build of the Storybook site.
    '**/storybook-static',
    // Agent skills belong to their makers, wherever their tools put them.
    '**/.agents/skills',
    '**/.claude/skills',
  ]),
  js.configs.recommended,
  nx.configs['flat/base'],
  {
    files: tsFiles,
    extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Prefers `value!`, which the strict rule no-non-null-assertion forbids.
      '@typescript-eslint/non-nullable-type-assertion-style': 'off',
    },
  },
  {
    files: reactFiles,
    extends: [
      reactHooks.configs.flat.recommended,
      eslintReact.configs['recommended-type-checked'],
      jsxA11y.flatConfigs.recommended,
    ],
    rules: {
      // Safari drops the semantics of a list styled without markers, and role="list" restores them.
      'jsx-a11y/no-redundant-roles': ['error', { ul: ['list'], ol: ['list'] }],
    },
  },
  storybook.configs['flat/recommended'],
  {
    // The recommended config looks for main.ts at the root; the site keeps it in its folder.
    files: ['apps/storybook/.storybook/main.ts'],
    rules: {
      'storybook/no-uninstalled-addons': [
        'error',
        { packageJsonLocation: join(import.meta.dirname, 'apps/storybook/package.json') },
      ],
    },
  },
  {
    // Text that a component renders on its own comes from a prop or from the labels.
    files: ['packages/web-components/src/**/*.tsx', 'packages/react/src/**/*.tsx'],
    ignores: ['**/*.test.tsx', '**/*.figma.ts'],
    plugins: { 'ui-core': { rules: { 'no-literal-text': noLiteralText } } },
    rules: { 'ui-core/no-literal-text': 'error' },
  },
  {
    files: [...tsFiles, ...jsFiles],
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      '@nx/enforce-module-boundaries': [
        'error',
        { enforceBuildableLibDependency: true, allow: [], depConstraints },
      ],
    },
  },
  {
    files: jsFiles,
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ['**/package.json'],
    languageOptions: { parser: jsoncParser },
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          // Tests and build scripts run in the repository and never ship, so what they import is
          // a development dependency.
          ignoredFiles: [
            '{projectRoot}/vitest.config.ts',
            '{projectRoot}/.storybook/*.setup.ts',
            '{projectRoot}/**/*.test.ts',
            '{projectRoot}/**/*.test.tsx',
            '{projectRoot}/scripts/**/*',
          ],
        },
      ],
    },
  },
  {
    // The MDX pages import addon-docs and the targets run the storybook CLI; the dependency check
    // traces neither, and its autofix would remove them.
    files: ['apps/storybook/package.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredFiles: [
            '{projectRoot}/vitest.config.ts',
            '{projectRoot}/.storybook/*.setup.ts',
            '{projectRoot}/**/*.test.ts',
            '{projectRoot}/**/*.test.tsx',
          ],
          ignoredDependencies: ['@storybook/addon-docs', 'storybook'],
        },
      ],
    },
  },
  prettier,
  {
    files: [...tsFiles, ...jsFiles],
    plugins: { '@stylistic': stylistic },
    rules: {
      // The Prettier preset turns `curly` off; with `all` it cannot conflict with
      // Prettier, so it is enabled again after the preset.
      curly: ['error', 'all'],
      // Prettier keeps blank lines but never adds them; a class whose members touch is hard to read.
      '@stylistic/lines-between-class-members': ['error', 'always'],
    },
  },
);
