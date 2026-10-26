// @ts-check
import js from '@eslint/js';
import nx from '@nx/eslint-plugin';
import stylistic from '@stylistic/eslint-plugin';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier/flat';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tseslint from 'typescript-eslint';

const tsFiles = ['**/*.ts', '**/*.mts', '**/*.cts', '**/*.tsx'];
const jsFiles = ['**/*.js', '**/*.mjs', '**/*.cjs'];

export default defineConfig(
  globalIgnores([
    '**/dist',
    '**/coverage',
    '**/out-tsc',
    '**/.nx',
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
    files: [...tsFiles, ...jsFiles],
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },
  {
    files: jsFiles,
    extends: [tseslint.configs.disableTypeChecked],
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
