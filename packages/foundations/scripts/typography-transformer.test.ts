import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  resolveRef,
  deriveFontWeightVar,
  toCssClass,
  buildTypographyCss,
  HEADER,
  type TextStyle,
} from './typography-transformer.ts';

// ─── Test helpers ─────────────────────────────────────────────────────────

function makeStyle(overrides: Partial<TextStyle> = {}): TextStyle {
  return {
    id: 'test-id',
    name: 'Body',
    description: '',
    fontFamily: '{typography.body.font-family}',
    fontStyle: 'Regular',
    fontSize: '{typography.body.font-size}',
    letterSpacing: '{typography.body.letter-spacing}',
    lineHeight: '{typography.body.line-height}',
    textCase: 'ORIGINAL',
    textDecoration: 'NONE',
    ...overrides,
  };
}

// ─── 1. resolveRef ────────────────────────────────────────────────────────

describe('resolveRef', () => {
  it('converts {a.b.c} to var(--a-b-c)', () => {
    expect(resolveRef('{typography.body.font-size}')).toBe('var(--typography-body-font-size)');
    expect(resolveRef('{typography.heading.h1.font-family}')).toBe(
      'var(--typography-heading-h1-font-family)',
    );
  });

  it('returns null for non-reference strings', () => {
    expect(resolveRef('Inter')).toBeNull();
    expect(resolveRef('16px')).toBeNull();
    expect(resolveRef('')).toBeNull();
  });

  it('returns null for partial braces', () => {
    expect(resolveRef('{typography.body.font-size')).toBeNull();
    expect(resolveRef('typography.body.font-size}')).toBeNull();
  });
});

// ─── 2. deriveFontWeightVar ───────────────────────────────────────────────

describe('deriveFontWeightVar', () => {
  it('derives font-weight var from font-family ref', () => {
    expect(deriveFontWeightVar('{typography.body.font-family}')).toBe(
      'var(--typography-body-font-weight)',
    );
    expect(deriveFontWeightVar('{typography.heading.h1.font-family}')).toBe(
      'var(--typography-heading-h1-font-weight)',
    );
    expect(deriveFontWeightVar('{typography.heading.display.font-family}')).toBe(
      'var(--typography-heading-display-font-weight)',
    );
  });

  it('returns null for non-font-family references', () => {
    expect(deriveFontWeightVar('{typography.body.font-size}')).toBeNull();
    expect(deriveFontWeightVar('{typography.body.letter-spacing}')).toBeNull();
  });

  it('returns null for non-reference strings', () => {
    expect(deriveFontWeightVar('Inter')).toBeNull();
    expect(deriveFontWeightVar('')).toBeNull();
  });
});

// ─── 3. toCssClass ────────────────────────────────────────────────────────

describe('toCssClass', () => {
  it('lowercases and prefixes with .text-', () => {
    expect(toCssClass('Body')).toBe('.text-body');
    expect(toCssClass('Caption')).toBe('.text-caption');
  });

  it('replaces "/" with "-"', () => {
    expect(toCssClass('Heading/H1')).toBe('.text-heading-h1');
    expect(toCssClass('Heading/Display')).toBe('.text-heading-display');
    expect(toCssClass('Heading/Display/Large')).toBe('.text-heading-display-large');
  });

  it('replaces spaces with "-"', () => {
    expect(toCssClass('Body Small')).toBe('.text-body-small');
    expect(toCssClass('Body Large')).toBe('.text-body-large');
  });

  it('handles combined slashes and spaces', () => {
    expect(toCssClass('Body/Small Text')).toBe('.text-body-small-text');
  });
});

// ─── 4. buildTypographyCss — CSS generation ───────────────────────────────

describe('buildTypographyCss', () => {
  it('starts with the auto-generated header', () => {
    const { css } = buildTypographyCss([makeStyle()]);
    expect(css.startsWith(HEADER)).toBe(true);
  });

  it('generates correct class name and properties for a full style', () => {
    const { css, warnings } = buildTypographyCss([makeStyle()]);
    expect(warnings).toHaveLength(0);
    expect(css).toContain('.text-body {');
    expect(css).toContain('  font-family: var(--typography-body-font-family);');
    expect(css).toContain('  font-size: var(--typography-body-font-size);');
    expect(css).toContain('  font-weight: var(--typography-body-font-weight);');
    expect(css).toContain('  letter-spacing: var(--typography-body-letter-spacing);');
    expect(css).toContain('  line-height: var(--typography-body-line-height);');
  });

  it('derives font-weight from font-family reference', () => {
    const style = makeStyle({ fontFamily: '{typography.heading.h1.font-family}' });
    const { css } = buildTypographyCss([style]);
    expect(css).toContain('  font-weight: var(--typography-heading-h1-font-weight);');
  });

  it('omits font-weight when font-family is not a variable reference', () => {
    const style = makeStyle({ fontFamily: 'Inter' });
    const { css } = buildTypographyCss([style]);
    expect(css).not.toContain('font-weight:');
  });

  it('adds text-transform: uppercase for UPPERCASE textCase', () => {
    const style = makeStyle({ textCase: 'UPPERCASE' });
    const { css, warnings } = buildTypographyCss([style]);
    expect(css).toContain('  text-transform: uppercase;');
    expect(warnings).toHaveLength(0);
  });

  it('omits text-transform for ORIGINAL textCase', () => {
    const { css } = buildTypographyCss([makeStyle({ textCase: 'ORIGINAL' })]);
    expect(css).not.toContain('text-transform');
  });

  it('warns and skips unknown textCase values', () => {
    const style = makeStyle({ textCase: 'CAPITALIZE' });
    const { warnings } = buildTypographyCss([style]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('CAPITALIZE');
  });

  it('adds text-decoration when not NONE', () => {
    const style = makeStyle({ textDecoration: 'UNDERLINE' });
    const { css } = buildTypographyCss([style]);
    expect(css).toContain('  text-decoration: underline;');
  });

  it('omits text-decoration for NONE', () => {
    const { css } = buildTypographyCss([makeStyle({ textDecoration: 'NONE' })]);
    expect(css).not.toContain('text-decoration');
  });

  it('warns when fontFamily is not a variable reference', () => {
    const style = makeStyle({ fontFamily: 'Inter' });
    const { warnings } = buildTypographyCss([style]);
    expect(warnings.some((w) => w.includes('fontFamily'))).toBe(true);
  });

  it('warns when fontSize is not a variable reference', () => {
    const style = makeStyle({ fontSize: '16px' });
    const { warnings } = buildTypographyCss([style]);
    expect(warnings.some((w) => w.includes('fontSize'))).toBe(true);
  });

  it('generates multiple classes separated by a blank line', () => {
    const a = makeStyle({ name: 'Body' });
    const b = makeStyle({
      name: 'Caption',
      fontFamily: '{typography.caption.font-family}',
      fontSize: '{typography.caption.font-size}',
    });
    const { css } = buildTypographyCss([a, b]);
    expect(css).toContain('.text-body {');
    expect(css).toContain('.text-caption {');
    // blank line between blocks
    expect(css).toContain('}\n\n.');
  });

  it('handles Heading/H1 name → .text-heading-h1', () => {
    const style = makeStyle({
      name: 'Heading/H1',
      fontFamily: '{typography.heading.h1.font-family}',
      fontSize: '{typography.heading.h1.font-size}',
    });
    const { css } = buildTypographyCss([style]);
    expect(css).toContain('.text-heading-h1 {');
  });

  it('omits optional properties when not references (letter-spacing, line-height)', () => {
    const style = makeStyle({ letterSpacing: '0', lineHeight: '24' });
    const { css } = buildTypographyCss([style]);
    expect(css).not.toContain('letter-spacing:');
    expect(css).not.toContain('line-height:');
  });
});

// ─── 5. Integration: generated typography.css ─────────────────────────────

describe('typography.css — generated output', () => {
  let css: string;

  beforeAll(() => {
    css = readFileSync(join(import.meta.dirname, '../src/typography.css'), 'utf8');
  });

  it('starts with the auto-generated header comment', () => {
    expect(css.startsWith('/* AUTO-GENERATED')).toBe(true);
  });

  it('contains .text-body class with var() references', () => {
    expect(css).toContain('.text-body {');
    expect(css).toContain('var(--typography-body-font-family)');
    expect(css).toContain('var(--typography-body-font-size)');
    expect(css).toContain('var(--typography-body-font-weight)');
  });

  it('contains heading classes from Heading/* styles', () => {
    expect(css).toContain('.text-heading-h1 {');
    expect(css).toContain('.text-heading-h2 {');
    expect(css).toContain('.text-heading-display {');
    expect(css).toContain('.text-heading-display-large {');
  });

  it('contains variant classes from Body/* styles', () => {
    expect(css).toContain('.text-body-small {');
    expect(css).toContain('.text-body-large {');
  });

  it('has no hardcoded font-family values — only var() references', () => {
    const fontFamilyLines = css.split('\n').filter((l) => l.trim().startsWith('font-family:'));
    expect(fontFamilyLines.length).toBeGreaterThan(0);
    for (const line of fontFamilyLines) {
      expect(line).toMatch(/font-family:\s*var\(--/);
    }
  });

  it('has no hardcoded font-size values — only var() references', () => {
    const lines = css.split('\n').filter((l) => l.trim().startsWith('font-size:'));
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) {
      expect(line).toMatch(/font-size:\s*var\(--/);
    }
  });
});
