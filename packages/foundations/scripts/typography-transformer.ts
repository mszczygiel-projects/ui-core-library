// Pure typography transformation logic.
// I/O (file reading / writing) lives in build-typography.ts.

// ─── Types ───────────────────────────────────────────────────────────────

export type TextStyle = {
  id: string;
  name: string;
  description: string;
  fontFamily: string;
  fontStyle: string;
  fontSize: string;
  letterSpacing: string;
  lineHeight: string;
  textCase: string;
  textDecoration: string;
};

export type TextStylesJson = {
  textStyles: TextStyle[];
  metadata: {
    exportedAt: string;
    totalStyles: number;
    successfulStyles: number;
    version: string;
  };
};

// ─── Header ──────────────────────────────────────────────────────────────

export const HEADER = `/* AUTO-GENERATED — do not edit. Run "pnpm foundations:build" to regenerate. */\n\n`;

// ─── Helpers ─────────────────────────────────────────────────────────────

export function resolveRef(value: string): string | null {
  if (!value.startsWith('{') || !value.endsWith('}')) return null;
  const inner = value.slice(1, -1);
  return `var(--${inner.replace(/\./g, '-')})`;
}

// {typography.body.font-family} → var(--typography-body-font-weight)
export function deriveFontWeightVar(fontFamilyRef: string): string | null {
  if (!fontFamilyRef.startsWith('{') || !fontFamilyRef.endsWith('}')) return null;
  const inner = fontFamilyRef.slice(1, -1);
  if (!inner.endsWith('.font-family')) return null;
  const base = inner.slice(0, -'.font-family'.length);
  return `var(--${base.replace(/\./g, '-')}-font-weight)`;
}

export function toCssClass(name: string): string {
  return `.text-${name.toLowerCase().replace(/\//g, '-').replace(/\s+/g, '-')}`;
}

function buildClass(style: TextStyle, warnings: string[]): string {
  const className = toCssClass(style.name);
  const lines: string[] = [`${className} {`];

  const fontFamilyVar = resolveRef(style.fontFamily);
  if (fontFamilyVar) {
    lines.push(`  font-family: ${fontFamilyVar};`);
  } else {
    warnings.push(
      `${style.name}: fontFamily is not a variable reference — skipped: ${style.fontFamily}`,
    );
  }

  const fontSizeVar = resolveRef(style.fontSize);
  if (fontSizeVar) {
    lines.push(`  font-size: ${fontSizeVar};`);
  } else {
    warnings.push(
      `${style.name}: fontSize is not a variable reference — skipped: ${style.fontSize}`,
    );
  }

  const fontWeightVar = deriveFontWeightVar(style.fontFamily);
  if (fontWeightVar) {
    lines.push(`  font-weight: ${fontWeightVar};`);
  }

  const letterSpacingVar = resolveRef(style.letterSpacing);
  if (letterSpacingVar) {
    lines.push(`  letter-spacing: ${letterSpacingVar};`);
  }

  const lineHeightVar = resolveRef(style.lineHeight);
  if (lineHeightVar) {
    lines.push(`  line-height: ${lineHeightVar};`);
  }

  if (style.textCase === 'UPPERCASE') {
    lines.push(`  text-transform: uppercase;`);
  } else if (style.textCase !== 'ORIGINAL') {
    warnings.push(`${style.name}: unknown textCase "${style.textCase}" — skipped`);
  }

  if (style.textDecoration !== 'NONE') {
    lines.push(`  text-decoration: ${style.textDecoration.toLowerCase()};`);
  }

  lines.push('}');
  return lines.join('\n');
}

// ─── Main export ─────────────────────────────────────────────────────────

export function buildTypographyCss(styles: TextStyle[]): { css: string; warnings: string[] } {
  const warnings: string[] = [];
  const blocks = styles.map((s) => buildClass(s, warnings));
  const css = HEADER + blocks.join('\n\n') + '\n';
  return { css, warnings };
}
