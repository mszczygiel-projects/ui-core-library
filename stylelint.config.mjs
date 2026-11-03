// @ts-check
import stylelint from 'stylelint';

import { uiCorePlugins } from './tools/lint-rules/src/stylelint.ts';

/**
 * The rules for every stylesheet: token names from tokens.json, no raw values, the breakpoint and
 * Baseline Widely available. Components also read only the Components layer, the focus ring and
 * motion, declare only private --_ properties and use logical properties.
 *
 * @type {import('stylelint').Config['rules']}
 */
const componentRules = {
  'ui-core/token-layer': true,
  'property-disallowed-list': [
    ['/^--(?!_)/'],
    { message: 'A component declares only private --_ properties' },
  ],
  'csstools/use-logical': ['always'],
};

/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard'],
  plugins: [...uiCorePlugins(stylelint), 'stylelint-plugin-use-baseline', 'stylelint-use-logical'],
  rules: {
    'ui-core/known-tokens': true,
    'ui-core/no-raw-values': true,
    'ui-core/breakpoint': true,
    'ui-core/container-breakpoint': true,
    'color-no-hex': true,
    'color-named': 'never',
    'function-disallowed-list': [
      ['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'color', 'color-mix'],
      { message: 'Colours come from tokens' },
    ],
    'plugin/use-baseline': [true, { available: 'widely' }],
    // Names of custom properties come from tokens.json, whose names this pattern cannot describe.
    'custom-property-pattern': null,
    // BEM: block, element and modifier, each in kebab case.
    'selector-class-pattern': [
      '^[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:__[a-z0-9]+(?:-[a-z0-9]+)*)?(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?$',
      { message: 'Class names follow BEM in kebab case' },
    ],
  },
  overrides: [
    {
      files: ['packages/web-components/src/**/*.css', 'packages/react/src/**/*.css'],
      rules: componentRules,
    },
    {
      // The documentation site lays out its own pages and may write raw values; the tokens it
      // reads still have to exist.
      files: ['apps/storybook/**/*.css'],
      rules: {
        'ui-core/no-raw-values': null,
        'color-no-hex': null,
        'color-named': null,
        'function-disallowed-list': null,
      },
    },
  ],
};
