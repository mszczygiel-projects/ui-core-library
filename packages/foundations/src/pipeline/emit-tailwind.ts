import { GENERATED_NOTICE, shadowDeclarations } from './emit-css.ts';
import type { Token } from './model.ts';
import { cssVarName, normalizedPath, normalizeSegment } from './names.ts';

/** The Tailwind theme key of a primitive, or null when Tailwind has no namespace for it. */
export function tailwindKey(token: Token): string | null {
  const path = normalizedPath(token.path);
  const [first, ...rest] = path;
  if (first === undefined) {
    return null;
  }
  const name = rest.join('-');

  // The brand ramps are primitives under `brand/*`, so they become `bg-brand-primary-500`.
  if (token.collection === 'Primitives Colors') {
    return `--color-${path.join('-').toLowerCase()}`;
  }
  if (token.collection === 'Primitives Sizes') {
    switch (first) {
      case 'spacing':
      case 'size':
      case 'radius':
      case 'font-weight':
      case 'tracking':
        return `--${first}-${name}`;
      case 'text':
        return name.endsWith('-line-height')
          ? `--text-${name.slice(0, -'-line-height'.length)}--line-height`
          : `--text-${name}`;
      default:
        return null;
    }
  }
  if (token.collection === 'Primitives Motions') {
    switch (first) {
      case 'easing':
        return `--${name}`;
      case 'duration':
        return `--duration-${name}`;
      default:
        return null;
    }
  }
  return null;
}

function themeDeclaration(token: Token): string | null {
  const key = tailwindKey(token);
  return key === null
    ? null
    : `  ${key}: var(${cssVarName(token.collection, normalizedPath(token.path))});`;
}

function isPresent<T>(value: T | null): value is T {
  return value !== null;
}

/**
 * tailwind.css: a Tailwind 4 theme over tokens.css. `@theme inline` makes the utilities read the
 * custom properties: roles follow their context, while primitives remain fixed. `reference` keeps
 * Tailwind from declaring each token again as `var()` of itself, which would empty every token
 * that a page puts in a layer before Tailwind's `theme`. Tailwind's default colours are reset
 * first, so only the library's palette remains.
 */
export function emitTailwindCss(tokens: readonly Token[]): string {
  const lines = [
    `/* ${GENERATED_NOTICE} */\n\n`,
    '@import "./tokens.css";',
    '',
    '@theme inline reference {',
  ];
  lines.push('  --color-*: initial;');

  lines.push(
    ...tokens
      .filter((t) => t.collection === 'Primitives Colors')
      .map(themeDeclaration)
      .filter(isPresent),
  );

  const sizes = Map.groupBy(
    tokens.filter((t) => t.collection === 'Primitives Sizes'),
    (t) => t.path[0] ?? '',
  );
  for (const group of ['spacing', 'size', 'radius', 'text', 'font-weight', 'tracking']) {
    const members = sizes.get(group) ?? [];
    if (group !== 'text') {
      lines.push(...members.map(themeDeclaration).filter(isPresent));
      continue;
    }
    // Each text size is followed by its line height, as Tailwind pairs them.
    const pairs = new Map<string, { size?: Token; lineHeight?: Token }>();
    for (const member of members) {
      const last = normalizeSegment(member.path[member.path.length - 1] ?? '');
      const isLineHeight = last.endsWith('-line-height');
      const base = isLineHeight ? last.slice(0, -'-line-height'.length) : last;
      const pair = pairs.get(base) ?? {};
      if (isLineHeight) {
        pair.lineHeight = member;
      } else {
        pair.size = member;
      }
      pairs.set(base, pair);
    }
    for (const { size, lineHeight } of pairs.values()) {
      for (const member of [size, lineHeight]) {
        const declaration = member === undefined ? null : themeDeclaration(member);
        if (declaration !== null) {
          lines.push(declaration);
        }
      }
    }
  }

  const motions = Map.groupBy(
    tokens.filter((t) => t.collection === 'Primitives Motions'),
    (t) => t.path[0] ?? '',
  );
  for (const group of ['easing', 'duration']) {
    lines.push(...(motions.get(group) ?? []).map(themeDeclaration).filter(isPresent));
  }

  lines.push(...shadowDeclarations());

  // Semantic colours become utilities too, under the names tokens.css declares.
  const semanticColors = new Set<string>();
  for (const t of tokens) {
    if (t.collection !== 'Themes' && t.collection !== 'Surfaces' && t.collection !== 'Components') {
      continue;
    }
    const name = cssVarName(t.collection, t.path);
    if (name.startsWith('--color-') && !semanticColors.has(name)) {
      semanticColors.add(name);
      lines.push(`  ${name}: var(${name});`);
    }
  }

  lines.push('}\n');
  return lines.join('\n');
}
