// @ts-check
import { join } from 'node:path';

import js from '@eslint/js';
import eslintReact from '@eslint-react/eslint-plugin';
import nx from '@nx/eslint-plugin';
import stencil from '@stencil/eslint-plugin';
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

/** Entries of no-restricted-syntax that share a message. */
const restricted = (/** @type {string} */ message, /** @type {string[]} */ ...selectors) =>
  selectors.map((selector) => ({ selector, message }));
const LOCALE_METHODS = '/^toLocale(String|DateString|TimeString|LowerCase|UpperCase)$/';
const TIME_ZONE_OPTION = "Property:matches([key.name='timeZone'], [key.value='timeZone'])";

export default defineConfig(
  globalIgnores([
    '**/dist',
    '**/coverage',
    '**/out-tsc',
    '**/.nx',
    // Written by build steps, such as the typed token references.
    '**/generated',
    // The snapshot of the public API of shared, written by its test.
    'packages/shared/api',
    // Written by the Stencil compiler.
    '**/.stencil',
    '**/components.d.ts',
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
    // Shared logic runs on servers and in browsers alike, and the two read different clocks, time
    // zones and languages and draw different random numbers, so all of them come in as arguments
    //. The compiler keeps the browser out of these files; these are the usual forms in
    // which the language itself reads the machine.
    files: ['packages/shared/src/**/*.ts'],
    ignores: ['packages/shared/src/**/*.test.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...restricted(
          'Take the time as an argument.',
          "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          "NewExpression[callee.name='Date'][arguments.length=0]",
          "CallExpression[callee.name='Date']",
          // Intl formats the current time when no instant is given.
          'CallExpression[callee.property.name=/^format(ToParts)?$/][arguments.length=0]',
        ),
        ...restricted(
          'Pass the locale.',
          "NewExpression[callee.object.name='Intl'][arguments.length=0]",
          "CallExpression[callee.object.name='Intl'][arguments.length=0]",
          "NewExpression[callee.object.name='Intl'] > Identifier.arguments:first-child[name='undefined']",
          "CallExpression[callee.object.name='Intl'] > Identifier.arguments:first-child[name='undefined']",
          "NewExpression[callee.object.name='Intl'] > ArrayExpression.arguments:first-child[elements.length=0]",
          `CallExpression[callee.property.name=${LOCALE_METHODS}][arguments.length=0]`,
          `CallExpression[callee.property.name=${LOCALE_METHODS}] > Identifier.arguments:first-child[name='undefined']`,
          "CallExpression[callee.property.name='localeCompare'][arguments.length<2]",
          "CallExpression[callee.property.name='localeCompare'] > Identifier.arguments:nth-child(2)[name='undefined']",
        ),
        ...restricted(
          'Take the time zone as an argument, or work in UTC.',
          'CallExpression[callee.property.name=/^(get|set)(FullYear|Year|Month|Date|Day|Hours|Minutes|Seconds|Milliseconds)$|^getTimezoneOffset$/]',
          'CallExpression[callee.property.name=/^to(Date|Time)String$/]',
          "NewExpression[callee.name='Date'][arguments.length>1]",
          // A format without a time zone formats in the time zone of the machine.
          `NewExpression[callee.object.name='Intl'][callee.property.name='DateTimeFormat']:not(:has(${TIME_ZONE_OPTION}))`,
          `CallExpression[callee.object.name='Intl'][callee.property.name='DateTimeFormat']:not(:has(${TIME_ZONE_OPTION}))`,
          `CallExpression[callee.property.name=/^toLocale(Date|Time)String$/]:not(:has(${TIME_ZONE_OPTION}))`,
        ),
        ...restricted(
          'Take random values as an argument.',
          "CallExpression[callee.object.name='Math'][callee.property.name='random']",
        ),
      ],
    },
  },
  {
    // The rules of Stencil's recommended set. Its own flat configs also load eslint-plugin-react
    // for one rule about JSX callbacks, which the components do not need.
    files: ['packages/web-components/src/**/*.tsx'],
    plugins: { stencil },
    rules: {
      'stencil/async-methods': 'error',
      'stencil/ban-prefix': ['error', ['stencil', 'stnl', 'st']],
      'stencil/decorators-context': 'error',
      'stencil/element-type': 'error',
      'stencil/host-data-deprecated': 'error',
      'stencil/methods-must-be-public': 'error',
      'stencil/no-unused-watch': 'error',
      'stencil/prefer-vdom-listener': 'error',
      'stencil/props-must-be-public': 'error',
      'stencil/reserved-member-names': 'error',
      'stencil/single-export': 'error',
      'stencil/strict-boolean-conditions': 'warn',
      'stencil/ban-default-true': 'error',
      'stencil/ban-exported-const-enums': 'error',
      'stencil/ban-side-effects': 'error',
      'stencil/strict-mutable': 'error',
      'stencil/decorators-style': [
        'error',
        {
          prop: 'inline',
          state: 'inline',
          element: 'inline',
          event: 'inline',
          method: 'multiline',
          watch: 'multiline',
          listen: 'multiline',
        },
      ],
      'stencil/own-methods-must-be-private': 'error',
      'stencil/own-props-must-be-private': 'error',
      'stencil/required-jsdoc': 'error',
      'stencil/enforce-slot-jsdoc': 'error',
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
    // The sources import @stencil/core, but its compiler builds the runtime into the package, so
    // the published modules do not import it.
    files: ['packages/web-components/package.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredFiles: [
            '{projectRoot}/vitest.config.ts',
            '{projectRoot}/stencil.config.ts',
            '{projectRoot}/**/*.test.ts',
            '{projectRoot}/src/internal/test-utils.ts',
            '{projectRoot}/scripts/**/*',
          ],
          ignoredDependencies: ['@stencil/core'],
        },
      ],
    },
  },
  {
    // React's renderer is a peer dependency of the React package, whether or not a module imports
    // it, so that an application installs one react-dom for both.
    files: ['packages/react/package.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredFiles: [
            '{projectRoot}/vitest.config.ts',
            '{projectRoot}/**/*.test.ts',
            '{projectRoot}/**/*.test.tsx',
            '{projectRoot}/scripts/**/*',
          ],
          ignoredDependencies: ['react-dom'],
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
