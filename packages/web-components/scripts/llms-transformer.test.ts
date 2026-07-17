import { describe, it, expect } from 'vitest';
import {
  extractComponents,
  renderComponentSection,
  renderLlmsTxt,
  type CemManifest,
  type CemDeclaration,
} from './llms-transformer.ts';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const LOADER_DECLARATION: CemDeclaration = {
  kind: 'class',
  name: 'UiFixtureLoader',
  customElement: true,
  tagName: 'ui-fixture-loader',
  description: 'Inline spinner indicating a pending asynchronous operation.',
  example: '```html\n<ui-fixture-loader data-size="small"></ui-fixture-loader>\n```',
  members: [
    {
      kind: 'field',
      name: 'size',
      attribute: 'data-size',
      type: { text: "| 'small'\n    | 'default'\n    | 'large'" },
      default: "'default'",
      description: 'Spinner diameter.',
    },
    { kind: 'method', name: 'render' },
  ],
  cssProperties: [
    { name: '--loader-color', description: 'Spinner color. Defaults to `--color-icon-default`.' },
  ],
};

const BUTTON_DECLARATION: CemDeclaration = {
  kind: 'class',
  name: 'UiFixtureButton',
  customElement: true,
  tagName: 'ui-fixture-button',
  description: 'Fixture button.',
  members: [
    {
      kind: 'field',
      name: 'variant',
      attribute: 'variant',
      type: { text: "'primary' | 'secondary'" },
      default: "'primary'",
      description: 'Visual emphasis.',
    },
  ],
  slots: [
    { name: '', description: 'Button label content.' },
    { name: 'icon-left', description: 'Icon before the label.' },
  ],
  events: [{ name: 'ui-click', type: { text: 'CustomEvent' }, description: 'Fired on click.' }],
};

const FIXTURE_MANIFEST: CemManifest = {
  modules: [
    { declarations: [LOADER_DECLARATION] },
    // Non-component declarations (style exports, helpers) must be skipped.
    { declarations: [{ kind: 'variable', name: 'fixtureStyles' }] },
    { declarations: [BUTTON_DECLARATION] },
  ],
};

// ─── extractComponents ────────────────────────────────────────────────────────

describe('extractComponents', () => {
  it('keeps only custom-element declarations', () => {
    const components = extractComponents(FIXTURE_MANIFEST);
    expect(components).toHaveLength(2);
    expect(components.every((c) => c.customElement)).toBe(true);
  });

  it('sorts components by tag name', () => {
    const components = extractComponents(FIXTURE_MANIFEST);
    expect(components.map((c) => c.tagName)).toEqual(['ui-fixture-button', 'ui-fixture-loader']);
  });

  it('handles an empty manifest', () => {
    expect(extractComponents({})).toEqual([]);
    expect(extractComponents({ modules: [] })).toEqual([]);
  });
});

// ─── renderComponentSection ───────────────────────────────────────────────────

describe('renderComponentSection', () => {
  it('renders the heading with class and tag name', () => {
    const section = renderComponentSection(LOADER_DECLARATION);
    expect(section).toContain('## UiFixtureLoader (`<ui-fixture-loader>`)');
  });

  it('renders the description', () => {
    const section = renderComponentSection(LOADER_DECLARATION);
    expect(section).toContain('Inline spinner indicating a pending asynchronous operation.');
  });

  it('renders an already-fenced @example verbatim under Usage', () => {
    const section = renderComponentSection(LOADER_DECLARATION);
    expect(section).toContain('### Usage');
    expect(section).toContain(
      '```html\n<ui-fixture-loader data-size="small"></ui-fixture-loader>\n```',
    );
    expect(section).not.toContain('```html\n```html');
  });

  it('wraps an unfenced @example in an html fence', () => {
    const section = renderComponentSection({
      ...BUTTON_DECLARATION,
      example: '<ui-fixture-button></ui-fixture-button>',
    });
    expect(section).toContain('```html\n<ui-fixture-button></ui-fixture-button>\n```');
  });

  it('renders a properties table with attribute, type, default, and description', () => {
    const section = renderComponentSection(LOADER_DECLARATION);
    expect(section).toContain('### Properties / Attributes');
    expect(section).toContain('| Property | Attribute | Type | Default | Description |');
    expect(section).toMatch(
      /\| `size` \| `data-size` \| `.+` \| `'default'` \| Spinner diameter\. \|/,
    );
  });

  it('collapses multi-line union types and strips the leading pipe', () => {
    const section = renderComponentSection(LOADER_DECLARATION);
    expect(section).toContain("`'small' \\| 'default' \\| 'large'`");
    expect(section).not.toContain('\n    |');
  });

  it('omits methods from the properties table', () => {
    const section = renderComponentSection(LOADER_DECLARATION);
    expect(section).not.toContain('render');
  });

  it('renders slots with a default-slot marker', () => {
    const section = renderComponentSection(BUTTON_DECLARATION);
    expect(section).toContain('### Slots');
    expect(section).toContain('| _(default)_ | Button label content. |');
    expect(section).toContain('| `icon-left` | Icon before the label. |');
  });

  it('renders events', () => {
    const section = renderComponentSection(BUTTON_DECLARATION);
    expect(section).toContain('### Events');
    expect(section).toContain('| `ui-click` | `CustomEvent` | Fired on click. |');
  });

  it('renders CSS custom properties', () => {
    const section = renderComponentSection(LOADER_DECLARATION);
    expect(section).toContain('### CSS Custom Properties');
    expect(section).toContain(
      '| `--loader-color` | Spinner color. Defaults to `--color-icon-default`. |',
    );
  });

  it('omits empty sections', () => {
    const section = renderComponentSection(LOADER_DECLARATION);
    expect(section).not.toContain('### Slots');
    expect(section).not.toContain('### Events');
  });
});

// ─── renderLlmsTxt ────────────────────────────────────────────────────────────

describe('renderLlmsTxt', () => {
  const output = renderLlmsTxt(
    '@fixture/wc',
    'Fixture summary.',
    'Fixture intro paragraph.',
    extractComponents(FIXTURE_MANIFEST),
  );

  it('starts with the package name as H1 and the summary as blockquote', () => {
    expect(output.startsWith('# @fixture/wc\n\n> Fixture summary.\n')).toBe(true);
    expect(output).toContain('Fixture intro paragraph.');
  });

  it('contains one section per component', () => {
    expect(output.match(/^## /gm)).toHaveLength(2);
  });

  it('never emits more than one consecutive blank line', () => {
    expect(output).not.toMatch(/\n{3,}/);
  });
});
