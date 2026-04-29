// Pure transformation functions for the token build pipeline.
// No file I/O — imported by build-tokens.ts (production) and tokens-transformer.test.ts (tests).

// ─── Types ───────────────────────────────────────────────────────────────

export type TokenType = 'color' | 'number' | 'string' | 'boolean';

export type Primitive = string | number | boolean;

export type LeafValue = Primitive | { [mode: string]: Primitive };

export type Leaf = {
  $value: LeafValue;
  $type: TokenType;
  $description?: string;
};

export type Collection =
  | 'Primitives Colors'
  | 'Primitives Sizes'
  | 'Primitives Motions'
  | 'Primitives Shadows'
  | 'Themes'
  | 'Surfaces'
  | 'Sizes';

export type Token = {
  collection: Collection;
  path: string[];
  type: TokenType;
  value: LeafValue;
  description?: string;
};

export type WarningBucket = { circular: string[]; violations: string[]; broken: string[] };

export type TsNode = { [key: string]: TsNode | string };

// ─── Constants ───────────────────────────────────────────────────────────

export const HEADER = `/* AUTO-GENERATED — do not edit. Run "pnpm run tokens:build" to regenerate. */\n\n`;
export const TS_HEADER = `// AUTO-GENERATED — do not edit. Run "pnpm run tokens:build" to regenerate.\n\n`;

export const COLLECTIONS: Collection[] = [
  'Primitives Colors',
  'Primitives Sizes',
  'Primitives Motions',
  'Primitives Shadows',
  'Themes',
  'Surfaces',
  'Sizes',
];

export const SURFACE_MODE_SELECTOR: Record<string, string> = {
  Default: ':root',
  Subtle: '[data-surface="subtle"]',
  Inverse: '[data-surface="inverse"]',
  Primary: '[data-surface="primary"]',
};


export const ALLOWED_DEPS: Record<Collection, Set<Collection>> = {
  'Primitives Colors': new Set(),
  'Primitives Sizes': new Set(),
  'Primitives Motions': new Set(),
  'Primitives Shadows': new Set(),
  Themes: new Set([
    'Primitives Colors',
    'Primitives Sizes',
    'Primitives Motions',
    'Primitives Shadows',
    'Themes',
  ]),
  Surfaces: new Set([
    'Primitives Colors',
    'Primitives Sizes',
    'Primitives Motions',
    'Primitives Shadows',
    'Themes',
  ]),
  Sizes: new Set([
    'Primitives Colors',
    'Primitives Sizes',
    'Primitives Motions',
    'Primitives Shadows',
    'Themes',
    'Sizes',
  ]),
};

export const SHADOW_COMPOSITES: [string, string, string][] = [
  ['--shadow-2xs', '2xs', 'soft'],
  ['--shadow-xs', 'xs', 'soft'],
  ['--shadow-sm', 'sm', 'default'],
  ['--shadow-md', 'md', 'default'],
  ['--shadow-lg', 'lg', 'default'],
  ['--shadow-xl', 'xl', 'default'],
  ['--shadow-2xl', '2xl', 'strong'],
];

export const INSET_SHADOW_COMPOSITES: [string, string, string][] = [
  ['--inset-shadow-2xs', '2xs', 'soft'],
  ['--inset-shadow-xs', 'xs', 'soft'],
  ['--inset-shadow-sm', 'sm', 'soft'],
];

// ─── Walk → Token registry ───────────────────────────────────────────────

export function isLeaf(node: unknown): node is Leaf {
  return typeof node === 'object' && node !== null && '$value' in node && '$type' in node;
}

export function walk(node: unknown, collection: Collection, path: string[], out: Token[]): void {
  if (!node || typeof node !== 'object') return;
  if (isLeaf(node)) {
    out.push({
      collection,
      path,
      type: node.$type,
      value: node.$value,
      description: node.$description,
    });
    return;
  }
  for (const [key, child] of Object.entries(node)) {
    walk(child, collection, [...path, key], out);
  }
}

// ─── Path / var-name helpers ─────────────────────────────────────────────

export function tokenKey(collection: Collection, path: string[]): string {
  return `${collection}::${path.join('.')}`;
}

export function normalizeSegment(seg: string): string {
  // Tailwind v4 modifier convention: `xs--line-height` → primitive key `xs-line-height`.
  return seg.replace(/--/g, '-');
}

export function normalizedPath(path: string[]): string[] {
  return path.map(normalizeSegment);
}

export function cssVarName(collection: Collection, path: string[]): string {
  const norm = normalizedPath(path);

  if (collection === 'Primitives Colors') {
    return `--color-${norm.join('-').toLowerCase()}`;
  }

  if (collection === 'Primitives Sizes') {
    if (norm[0] === 'text') {
      const name = norm.slice(1).join('-');
      if (name.endsWith('-line-height')) {
        const base = name.slice(0, -'-line-height'.length);
        return `--text-${base}--line-height`;
      }
    }
    return `--${norm.join('-').toLowerCase()}`;
  }

  if (collection === 'Primitives Motions') {
    if (norm[0] === 'easing') {
      return `--${norm.slice(1).join('-').toLowerCase()}`;
    }
    return `--${norm.join('-').toLowerCase()}`;
  }

  if (collection === 'Primitives Shadows') {
    return `--${norm.join('-').toLowerCase()}`;
  }

  // Themes, Surfaces, Sizes — no collection prefix
  return `--${norm.join('-').toLowerCase()}`;
}

// ─── Alias parsing ───────────────────────────────────────────────────────

export function isAlias(v: unknown): v is string {
  return typeof v === 'string' && v.startsWith('{') && v.endsWith('}');
}

export function parseAlias(alias: string): { collection: Collection; path: string[] } | null {
  const inner = alias.slice(1, -1);
  for (const c of COLLECTIONS) {
    if (inner === c) return { collection: c, path: [] };
    if (inner.startsWith(c + '.')) {
      return { collection: c, path: inner.slice(c.length + 1).split('.') };
    }
  }
  return null;
}

// ─── Unit formatting ─────────────────────────────────────────────────────

export function cleanNum(n: number, precision = 4): string {
  return parseFloat(n.toFixed(precision)).toString();
}

export function toRem(n: number): string {
  if (n === 0) return '0';
  return `${cleanNum(n / 16)}rem`;
}

export function pathCategory(
  path: string[],
): 'line-height' | 'font-weight' | 'tracking' | 'duration' | 'other' {
  const norm = normalizedPath(path).map((s) => s.toLowerCase());
  const last = norm[norm.length - 1] ?? '';
  if (last === 'line-height' || last.endsWith('-line-height')) return 'line-height';
  if (norm.some((p) => p === 'font-weight' || p.includes('font-weight'))) return 'font-weight';
  if (norm.some((p) => p === 'tracking' || p === 'letter-spacing')) return 'tracking';
  if (norm.some((p) => p === 'duration')) return 'duration';
  return 'other';
}

export function formatNumber(path: string[], n: number): string {
  if (n === 0) return '0';
  const cat = pathCategory(path);
  if (cat === 'font-weight') return cleanNum(n);
  if (cat === 'tracking') return `${cleanNum(n)}em`;
  if (cat === 'duration') return `${n}ms`;
  return toRem(n);
}

export function formatString(path: string[], s: string): string {
  const norm = normalizedPath(path).map((p) => p.toLowerCase());
  if (norm.some((p) => p === 'font-family' || p.includes('font-family'))) {
    return `"${s}"`;
  }
  return s;
}

export function formatBoolean(path: string[], b: boolean): string {
  const norm = normalizedPath(path).map((p) => p.toLowerCase());
  const isTextTransform = norm.some((p) => p === 'text-transform' || p.includes('text-transform'));
  if (isTextTransform) return b ? 'uppercase' : 'none';
  return b ? 'true' : 'false';
}

// ─── Line-height pairing ─────────────────────────────────────────────────

export function findFontSizePair(token: Token, registry: Map<string, Token>): Token | null {
  const norm = normalizedPath(token.path);
  const last = norm[norm.length - 1];
  if (!last) return null;

  if (last.endsWith('-line-height') && last !== 'line-height') {
    const base = last.slice(0, -'-line-height'.length);
    const pairPath = [...norm.slice(0, -1), base];
    return registry.get(tokenKey(token.collection, pairPath)) ?? null;
  }

  if (last === 'line-height') {
    const pairPath = [...norm.slice(0, -1), 'font-size'];
    return registry.get(tokenKey(token.collection, pairPath)) ?? null;
  }

  return null;
}

export function resolveNumericValue(
  token: Token,
  mode: string | null,
  registry: Map<string, Token>,
  warnings: WarningBucket,
  visitedAliases: Set<string> = new Set(),
): number | null {
  const v =
    mode === null ? (token.value as Primitive) : (token.value as Record<string, Primitive>)[mode];
  if (typeof v === 'number') return v;
  if (isAlias(v)) {
    const parsed = parseAlias(v);
    if (!parsed) return null;
    const target = registry.get(tokenKey(parsed.collection, normalizedPath(parsed.path)));
    if (!target) return null;
    const targetKey = tokenKey(target.collection, target.path);
    if (visitedAliases.has(targetKey)) return null;
    visitedAliases.add(targetKey);
    const targetMode =
      typeof target.value === 'object' && target.value !== null && !Array.isArray(target.value)
        ? mode && mode in (target.value as Record<string, unknown>)
          ? mode
          : (Object.keys(target.value as Record<string, unknown>)[0] ?? null)
        : null;
    return resolveNumericValue(target, targetMode, registry, warnings, visitedAliases);
  }
  return null;
}

export function formatLineHeight(
  token: Token,
  mode: string | null,
  registry: Map<string, Token>,
  warnings: WarningBucket,
): string {
  const fsToken = findFontSizePair(token, registry);
  const lhNum = resolveNumericValue(token, mode, registry, warnings);
  if (lhNum === null) return '0';
  if (lhNum === 0) return '0';
  const lhRem = cleanNum(lhNum / 16);

  if (!fsToken) {
    const pathStr = `${token.collection}.${token.path.join('.')}`;
    console.warn(`⚠ UNPAIRED line-height: ${pathStr} — assumed base 16px`);
    return `calc(${lhRem} / 1)`;
  }
  const fsNum = resolveNumericValue(fsToken, mode, registry, warnings);
  if (fsNum === null || fsNum === 0) {
    return `calc(${lhRem} / 1)`;
  }
  const fsRem = cleanNum(fsNum / 16);
  return `calc(${lhRem} / ${fsRem})`;
}

// ─── Value → CSS string ──────────────────────────────────────────────────

export function valueToCss(
  token: Token,
  rawValue: Primitive,
  mode: string | null,
  registry: Map<string, Token>,
  warnings: WarningBucket,
): string {
  if (isAlias(rawValue)) {
    const parsed = parseAlias(rawValue);
    if (!parsed) {
      warnings.broken.push(
        `${token.collection}.${token.path.join('.')} → ${rawValue} (unparseable)`,
      );
      return 'initial';
    }
    const targetVarPath = normalizedPath(parsed.path);
    const targetKey = tokenKey(parsed.collection, targetVarPath);
    if (!registry.has(targetKey)) {
      warnings.broken.push(
        `${token.collection}.${token.path.join('.')} → ${parsed.collection}.${parsed.path.join('.')} (target not found)`,
      );
    } else {
      const allowed = ALLOWED_DEPS[token.collection];
      if (!allowed.has(parsed.collection)) {
        warnings.violations.push(
          `${token.collection}.${token.path.join('.')} → ${parsed.collection}.${parsed.path.join('.')} (${token.collection} should not reference ${parsed.collection})`,
        );
      }
    }
    return `var(${cssVarName(parsed.collection, targetVarPath)})`;
  }

  if (token.type === 'color') return String(rawValue);
  if (token.type === 'number') {
    if (pathCategory(token.path) === 'line-height') {
      return formatLineHeight(token, mode, registry, warnings);
    }
    return formatNumber(token.path, rawValue as number);
  }
  if (token.type === 'string') return formatString(token.path, String(rawValue));
  if (token.type === 'boolean') {
    const b = typeof rawValue === 'boolean' ? rawValue : rawValue === 'true';
    return formatBoolean(token.path, b);
  }
  return String(rawValue);
}

// ─── Self-ref detection ──────────────────────────────────────────────────

/**
 * Resolves a token value to a CSS declaration line.
 * Returns null when the resolved value would equal `var(<own-var-name>)` — a
 * self-referential custom property that results from Themes and Surfaces sharing
 * the same CSS variable name after collection-prefix removal.
 */
export function resolveCssLine(
  token: Token,
  raw: Primitive,
  mode: string | null,
  registry: Map<string, Token>,
  warnings: WarningBucket,
): string | null {
  const varName = cssVarName(token.collection, token.path);
  const value = valueToCss(token, raw, mode, registry, warnings);
  return value === `var(${varName})` ? null : `  ${varName}: ${value};`;
}

// ─── Cycle detection ─────────────────────────────────────────────────────

export function detectCycles(
  tokens: Token[],
  registry: Map<string, Token>,
  warnings: WarningBucket,
): void {
  const WHITE = 0,
    GRAY = 1,
    BLACK = 2;
  const colour = new Map<string, number>();
  for (const t of tokens) colour.set(tokenKey(t.collection, t.path), WHITE);

  function edgesOf(t: Token): string[] {
    const edges: string[] = [];
    const pushIfAlias = (v: Primitive) => {
      if (isAlias(v)) {
        const parsed = parseAlias(v);
        if (parsed) edges.push(tokenKey(parsed.collection, normalizedPath(parsed.path)));
      }
    };
    if (typeof t.value === 'object' && t.value !== null && !Array.isArray(t.value)) {
      for (const v of Object.values(t.value as Record<string, Primitive>)) pushIfAlias(v);
    } else {
      pushIfAlias(t.value as Primitive);
    }
    return edges;
  }

  function dfs(key: string, stack: string[]): void {
    colour.set(key, GRAY);
    const t = registry.get(key);
    if (t) {
      for (const next of edgesOf(t)) {
        if (!registry.has(next)) continue;
        const c = colour.get(next);
        if (c === GRAY) {
          const startIdx = stack.indexOf(next);
          const chain = [...stack.slice(startIdx), next].map((k) => k.replace('::', '.'));
          warnings.circular.push(chain.join(' → '));
        } else if (c === WHITE) {
          dfs(next, [...stack, next]);
        }
      }
    }
    colour.set(key, BLACK);
  }

  for (const [key, c] of colour) {
    if (c === WHITE) dfs(key, [key]);
  }
}

// ─── CSS output ──────────────────────────────────────────────────────────

export function emitLine(
  token: Token,
  rawValue: Primitive,
  mode: string | null,
  registry: Map<string, Token>,
  warnings: WarningBucket,
): string {
  const value = valueToCss(token, rawValue, mode, registry, warnings);
  const varName = cssVarName(token.collection, token.path);
  return `  ${varName}: ${value};`;
}

export function valuesByMode(token: Token): { mode: string | null; raw: Primitive }[] {
  if (typeof token.value === 'object' && token.value !== null && !Array.isArray(token.value)) {
    return Object.entries(token.value as Record<string, Primitive>).map(([mode, raw]) => ({
      mode,
      raw,
    }));
  }
  return [{ mode: null, raw: token.value as Primitive }];
}

export function buildTokensCss(
  tokens: Token[],
  registry: Map<string, Token>,
  warnings: WarningBucket,
  breakpointXlPx: number = 1280,
): string {
  const primSizes = tokens.filter((t) => t.collection === 'Primitives Sizes');
  const primColors = tokens.filter((t) => t.collection === 'Primitives Colors');
  const primMotion = tokens.filter((t) => t.collection === 'Primitives Motions');
  const primShadows = tokens.filter((t) => t.collection === 'Primitives Shadows');
  const themes = tokens.filter((t) => t.collection === 'Themes');
  const surfaces = tokens.filter((t) => t.collection === 'Surfaces');
  const sizes = tokens.filter((t) => t.collection === 'Sizes');

  const chunks: string[] = [HEADER];

  chunks.push('/* === Primitives — Sizes === */\n:root {');
  for (const t of primSizes)
    chunks.push(emitLine(t, t.value as Primitive, null, registry, warnings));
  chunks.push('}\n');

  chunks.push('/* === Primitives — Colors === */\n:root {');
  for (const t of primColors)
    chunks.push(emitLine(t, t.value as Primitive, null, registry, warnings));
  chunks.push('}\n');

  chunks.push('/* === Primitives — Motion === */\n:root {');
  for (const t of primMotion)
    chunks.push(emitLine(t, t.value as Primitive, null, registry, warnings));
  chunks.push('}\n');

  chunks.push('/* === Primitives — Shadows === */\n:root {');
  for (const t of primShadows)
    chunks.push(emitLine(t, t.value as Primitive, null, registry, warnings));
  chunks.push('}\n');

  chunks.push('/* === Shadows (composite) === */\n:root {');
  for (const [name, shape, color] of SHADOW_COMPOSITES)
    chunks.push(`  ${name}: var(--shadow-shape-${shape}) var(--shadow-color-${color});`);
  for (const [name, shape, color] of INSET_SHADOW_COMPOSITES)
    chunks.push(`  ${name}: var(--inset-shadow-shape-${shape}) var(--shadow-color-${color});`);
  chunks.push('}\n');

  // Themes — Default mode (Light)
  const themesDefaultLines: string[] = [];
  for (const t of themes) {
    const raw =
      typeof t.value === 'object' && t.value !== null && !Array.isArray(t.value)
        ? ((t.value as Record<string, Primitive>)['Default'] ??
          (Object.values(t.value as Record<string, Primitive>)[0] as Primitive))
        : (t.value as Primitive);
    const line = resolveCssLine(t, raw, 'Default', registry, warnings);
    if (line !== null) themesDefaultLines.push(line);
  }
  if (themesDefaultLines.length > 0) {
    chunks.push('/* === Themes === */\n:root {');
    chunks.push(...themesDefaultLines);
    chunks.push('}\n');
  }

  // Themes — Dark mode (only tokens where Dark value differs from Default)
  const darkThemes = themes.filter((t) => {
    if (typeof t.value !== 'object' || t.value === null || Array.isArray(t.value)) return false;
    const vals = t.value as Record<string, Primitive>;
    return 'Dark' in vals && 'Default' in vals && vals['Dark'] !== vals['Default'];
  });
  if (darkThemes.length > 0) {
    const darkLines: string[] = [];
    for (const t of darkThemes) {
      const raw = (t.value as Record<string, Primitive>)['Dark'] as Primitive;
      const line = resolveCssLine(t, raw, 'Dark', registry, warnings);
      if (line !== null) darkLines.push(line);
    }
    if (darkLines.length > 0) {
      chunks.push('/* === Themes (Dark) === */\n[data-theme="dark"] {');
      chunks.push(...darkLines);
      chunks.push('}\n');
    }
  }

  // Surfaces — per mode (Default is skipped when all lines are self-referential)
  for (const mode of ['Default', 'Subtle', 'Inverse', 'Primary']) {
    const selector = SURFACE_MODE_SELECTOR[mode];
    const surfaceLines: string[] = [];
    for (const t of surfaces) {
      const modeValues = valuesByMode(t);
      const entry = modeValues.find((m) => m.mode === mode) ?? modeValues[0];
      if (!entry) continue;
      const line = resolveCssLine(t, entry.raw, mode, registry, warnings);
      if (line !== null) surfaceLines.push(line);
    }
    if (surfaceLines.length > 0) {
      chunks.push(`/* === Surfaces (${mode}) === */\n${selector} {`);
      chunks.push(...surfaceLines);
      chunks.push('}\n');
    }
  }

  // Sizes — Mobile (default → :root)
  const mobileSizeLines: string[] = [];
  for (const t of sizes) {
    const modeValues = valuesByMode(t);
    const entry = modeValues.find((m) => m.mode === 'Mobile') ?? modeValues[0];
    if (!entry) continue;
    const line = resolveCssLine(t, entry.raw, 'Mobile', registry, warnings);
    if (line !== null) mobileSizeLines.push(line);
  }
  if (mobileSizeLines.length > 0) {
    chunks.push('/* === Sizes (Mobile — default) === */\n:root {');
    chunks.push(...mobileSizeLines);
    chunks.push('}\n');
  }

  // Sizes — Desktop (only vars whose Desktop value differs from Mobile, inside @media)
  const breakpointXlRem = toRem(breakpointXlPx);
  const desktopSizeLines: string[] = [];
  for (const t of sizes) {
    const modeValues = valuesByMode(t);
    const mobileEntry = modeValues.find((m) => m.mode === 'Mobile') ?? modeValues[0];
    const desktopEntry = modeValues.find((m) => m.mode === 'Desktop');
    if (!desktopEntry || !mobileEntry || desktopEntry.raw === mobileEntry.raw) continue;
    const line = resolveCssLine(t, desktopEntry.raw, 'Desktop', registry, warnings);
    if (line !== null) desktopSizeLines.push(line);
  }
  if (desktopSizeLines.length > 0) {
    chunks.push(
      `/* === Sizes (Desktop) === */\n@media (min-width: ${breakpointXlRem}) {\n  :root {`,
    );
    chunks.push(...desktopSizeLines.map((line) => '  ' + line));
    chunks.push('  }\n}\n');
  }

  return chunks.join('\n');
}

// ─── Tailwind @theme output ──────────────────────────────────────────────

export function tailwindVarName(token: Token): string | null {
  const path = normalizedPath(token.path);
  const first = path[0];
  if (!first) return null;

  if (token.collection === 'Primitives Colors') {
    return `--color-${path.join('-').toLowerCase()}`;
  }

  if (token.collection === 'Primitives Sizes') {
    const rest = path.slice(1);
    switch (first) {
      case 'spacing':
        return `--spacing-${rest.join('-')}`;
      case 'size':
        return `--size-${rest.join('-')}`;
      case 'radius':
        return `--radius-${rest.join('-')}`;
      case 'text': {
        const name = rest.join('-');
        if (name.endsWith('-line-height')) {
          const base = name.slice(0, -'-line-height'.length);
          return `--text-${base}--line-height`;
        }
        return `--text-${name}`;
      }
      case 'font-weight':
        return `--font-weight-${rest.join('-')}`;
      case 'tracking':
        return `--tracking-${rest.join('-')}`;
      default:
        return null;
    }
  }

  if (token.collection === 'Primitives Motions') {
    const rest = path.slice(1);
    switch (first) {
      case 'easing':
        return `--${rest.join('-')}`;
      case 'duration':
        return `--duration-${rest.join('-')}`;
      default:
        return null;
    }
  }

  return null;
}

export function buildTailwindCss(tokens: Token[]): string {
  const lines: string[] = [HEADER, '@import "./tokens.css";', '', '@theme inline {'];
  lines.push('  --color-*: initial;');

  const colors = tokens.filter((t) => t.collection === 'Primitives Colors');
  for (const t of colors) {
    const name = tailwindVarName(t);
    if (!name) continue;
    lines.push(`  ${name}: var(${cssVarName(t.collection, normalizedPath(t.path))});`);
  }

  const sizesTokens = tokens.filter((t) => t.collection === 'Primitives Sizes');
  const groups: Record<string, Token[]> = {};
  for (const t of sizesTokens) {
    const key = t.path[0] ?? '';
    (groups[key] ??= []).push(t);
  }
  const groupOrder = ['spacing', 'size', 'radius', 'text', 'font-weight', 'tracking'];
  for (const groupKey of groupOrder) {
    const group = groups[groupKey];
    if (!group) continue;
    if (groupKey === 'text') {
      const byBase = new Map<string, { fs?: Token; lh?: Token }>();
      for (const t of group) {
        const last = normalizeSegment(t.path[t.path.length - 1]!);
        const base = last.endsWith('-line-height') ? last.slice(0, -'-line-height'.length) : last;
        const entry = byBase.get(base) ?? {};
        if (last.endsWith('-line-height')) entry.lh = t;
        else entry.fs = t;
        byBase.set(base, entry);
      }
      for (const { fs, lh } of byBase.values()) {
        if (fs) {
          const name = tailwindVarName(fs);
          if (name)
            lines.push(`  ${name}: var(${cssVarName(fs.collection, normalizedPath(fs.path))});`);
        }
        if (lh) {
          const name = tailwindVarName(lh);
          if (name)
            lines.push(`  ${name}: var(${cssVarName(lh.collection, normalizedPath(lh.path))});`);
        }
      }
    } else {
      for (const t of group) {
        const name = tailwindVarName(t);
        if (!name) continue;
        lines.push(`  ${name}: var(${cssVarName(t.collection, normalizedPath(t.path))});`);
      }
    }
  }

  const motionGroups: Record<string, Token[]> = {};
  for (const t of tokens.filter((t) => t.collection === 'Primitives Motions')) {
    (motionGroups[t.path[0] ?? ''] ??= []).push(t);
  }
  for (const groupKey of ['easing', 'duration']) {
    const group = motionGroups[groupKey];
    if (!group) continue;
    for (const t of group) {
      const name = tailwindVarName(t);
      if (!name) continue;
      lines.push(`  ${name}: var(${cssVarName(t.collection, normalizedPath(t.path))});`);
    }
  }

  for (const [name, shape, color] of SHADOW_COMPOSITES)
    lines.push(`  ${name}: var(--shadow-shape-${shape}) var(--shadow-color-${color});`);
  for (const [name, shape, color] of INSET_SHADOW_COMPOSITES)
    lines.push(`  ${name}: var(--inset-shadow-shape-${shape}) var(--shadow-color-${color});`);

  lines.push('}\n');
  return lines.join('\n');
}

// ─── TypeScript refs output ──────────────────────────────────────────────

const JS_IDENT = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

export function toCamel(key: string): string {
  return key.replace(/-([a-zA-Z0-9])/g, (_, c: string) => c.toUpperCase());
}

export function tsKey(key: string): string {
  const camel = toCamel(normalizeSegment(key));
  return JS_IDENT.test(camel) ? camel : JSON.stringify(camel);
}

export function buildTsTree(tokens: Token[]): TsNode {
  // Surfaces-precedence: collect all Surfaces paths so Themes tokens with a
  // Surfaces counterpart are excluded from the public TS API (use --surfaces-* instead).
  const surfacesPaths = new Set<string>();
  for (const t of tokens) {
    if (t.collection === 'Surfaces') surfacesPaths.add(normalizedPath(t.path).join('.'));
  }

  const root: TsNode = {};
  for (const t of tokens) {
    if (
      t.collection === 'Primitives Colors' ||
      t.collection === 'Primitives Sizes' ||
      t.collection === 'Primitives Motions' ||
      t.collection === 'Primitives Shadows'
    )
      continue;

    // Surfaces takes precedence: skip Themes tokens that have a Surfaces counterpart.
    if (t.collection === 'Themes' && surfacesPaths.has(normalizedPath(t.path).join('.'))) continue;
    const collectionKey = t.collection.toLowerCase();
    const ref = `var(${cssVarName(t.collection, t.path)})`;

    let cursor: TsNode = root;
    const topKey = collectionKey;
    if (typeof cursor[topKey] !== 'object') cursor[topKey] = {};
    cursor = cursor[topKey] as TsNode;

    for (let i = 0; i < t.path.length - 1; i++) {
      const seg = normalizeSegment(t.path[i]!);
      if (typeof cursor[seg] !== 'object') cursor[seg] = {};
      cursor = cursor[seg] as TsNode;
    }
    const leafSeg = normalizeSegment(t.path[t.path.length - 1]!);
    cursor[leafSeg] = ref;
  }
  return root;
}

export function serializeTs(node: TsNode, indent: number): string {
  const pad = '  '.repeat(indent);
  const innerPad = '  '.repeat(indent + 1);
  const keys = Object.keys(node);
  if (keys.length === 0) return '{}';

  const lines: string[] = ['{'];
  for (const k of keys) {
    const formattedKey = tsKey(k);
    const v = node[k]!;
    if (typeof v === 'string') {
      lines.push(`${innerPad}${formattedKey}: '${v}',`);
    } else {
      lines.push(`${innerPad}${formattedKey}: ${serializeTs(v, indent + 1)},`);
    }
  }
  lines.push(`${pad}}`);
  return lines.join('\n');
}

export function buildTokensTs(tokens: Token[]): string {
  const tree = buildTsTree(tokens);
  return (
    TS_HEADER +
    `export const tokens = ${serializeTs(tree, 0)} as const;\n\n` +
    `export type Tokens = typeof tokens;\n` +
    `type DeepValues<T> = T extends Record<string, unknown> ? DeepValues<T[keyof T]> : T;\n` +
    `export type TokenKey = DeepValues<Tokens>;\n`
  );
}
