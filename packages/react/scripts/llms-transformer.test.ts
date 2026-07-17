import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  listComponentFiles,
  loadCompilerOptions,
  parseComponents,
  renderLlmsTxt,
  type ComponentEntry,
} from './llms-transformer.ts';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptsDir, '..');
const fixturesDir = path.join(scriptsDir, '__fixtures__');

const compilerOptions = loadCompilerOptions(path.join(packageRoot, 'tsconfig.json'));

function parseFixture(): ComponentEntry[] {
  return parseComponents(listComponentFiles(fixturesDir), compilerOptions);
}

// ─── listComponentFiles ───────────────────────────────────────────────────────

describe('listComponentFiles', () => {
  it('finds src/<Component>/<Component>.tsx files', () => {
    const files = listComponentFiles(fixturesDir);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/FixtureBadge\/FixtureBadge\.tsx$/);
  });

  it('lists the real package components', () => {
    const files = listComponentFiles(path.join(packageRoot, 'src'));
    expect(files.length).toBeGreaterThanOrEqual(12);
    expect(files.some((f) => f.endsWith('Button/Button.tsx'))).toBe(true);
    expect(files.some((f) => f.includes('.stories.'))).toBe(false);
  });
});

// ─── parseComponents — docgen against the fixture component ──────────────────

describe('parseComponents', () => {
  const entries = parseFixture();
  const badge = entries[0];

  it('finds the fixture component', () => {
    expect(entries).toHaveLength(1);
    expect(badge.displayName).toBe('FixtureBadge');
  });

  it('takes the component description from the Props interface JSDoc', () => {
    expect(badge.description).toBe('Fixture badge exercising every llms-transformer feature.');
  });

  it('captures the @example snippet from the Props interface', () => {
    expect(badge.example).toBe('<FixtureBadge tone="danger" label="Deleted">3</FixtureBadge>');
  });

  it('expands literal-union prop types', () => {
    const tone = badge.props.find((p) => p.name === 'tone');
    expect(tone?.type).toBe('"neutral" | "danger"');
  });

  it('extracts the @default value', () => {
    const tone = badge.props.find((p) => p.name === 'tone');
    expect(tone?.defaultValue).toBe('neutral');
  });

  it('marks props without a default and with one as required/optional correctly', () => {
    const label = badge.props.find((p) => p.name === 'label');
    const children = badge.props.find((p) => p.name === 'children');
    expect(label?.required).toBe(true);
    expect(children?.required).toBe(false);
  });

  it('keeps per-prop descriptions', () => {
    const label = badge.props.find((p) => p.name === 'label');
    expect(label?.description).toBe('Required accessible name.');
  });

  it('drops props inherited from node_modules types', () => {
    // style: CSSProperties is declared locally, so it stays — but nothing
    // from React's own prop interfaces may leak in.
    expect(badge.props.some((p) => p.name === 'key' || p.name === 'ref')).toBe(false);
  });
});

// ─── renderLlmsTxt ────────────────────────────────────────────────────────────

describe('renderLlmsTxt', () => {
  const output = renderLlmsTxt(
    '@fixture/react',
    'Fixture summary.',
    'Fixture intro.',
    parseFixture(),
  );

  it('starts with the package name as H1 and the summary as blockquote', () => {
    expect(output.startsWith('# @fixture/react\n\n> Fixture summary.\n')).toBe(true);
    expect(output).toContain('Fixture intro.');
  });

  it('renders one section per component with Usage and Props', () => {
    expect(output).toContain('## FixtureBadge');
    expect(output).toContain('### Usage');
    expect(output).toContain('### Props');
  });

  it('wraps the @example in a tsx fence', () => {
    expect(output).toContain(
      '```tsx\n<FixtureBadge tone="danger" label="Deleted">3</FixtureBadge>\n```',
    );
  });

  it('renders prop rows with escaped union pipes', () => {
    expect(output).toContain(
      '| `tone` | `"neutral" \\| "danger"` | `neutral` | No | Visual tone of the fixture. |',
    );
    expect(output).toContain('| `label` | `string` | — | Yes | Required accessible name. |');
  });

  it('never emits more than one consecutive blank line', () => {
    expect(output).not.toMatch(/\n{3,}/);
  });
});
