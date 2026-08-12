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
  | 'Components'
  | 'Sizes'
  | 'Density';

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
  'Components',
  'Sizes',
  'Density',
];

export const SURFACE_MODE_SELECTOR: Record<string, string> = {
  Default: ':root',
  Subtle: '[data-surface="subtle"]',
  Inverse: '[data-surface="inverse"]',
  Primary: '[data-surface="primary"]',
};

/** Emission order for the Surfaces modes the Core library ships. Extra client modes follow. */
export const KNOWN_SURFACE_MODES = Object.keys(SURFACE_MODE_SELECTOR);

/**
 * Density is a second context layer beside Surfaces, switched by an attribute rather than a
 * media query. Unlike `Surfaces.Default`, the base mode names its own attribute as well as
 * `:root`: without that, a `[data-density="comfortable"]` container nested inside a compact
 * one would keep inheriting the compact values with nothing to reset it.
 */
export const DENSITY_MODE_SELECTOR: Record<string, string> = {
  Comfortable: ':root,\n[data-density="comfortable"]',
  Compact: '[data-density="compact"]',
};

export const KNOWN_DENSITY_MODES = Object.keys(DENSITY_MODE_SELECTOR);

/** The mode that lands on `:root`. Everything else is opt-in through the attribute. */
export const BASE_DENSITY_MODE = 'Comfortable';

/** Sizes modes the build knows how to map to a media query. Anything else is reported. */
export const KNOWN_SIZE_MODES = ['Mobile', 'Desktop'];

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
  // Component tokens are single aliases to a role — that indirection is the whole point.
  // `Surfaces` is the expected target for colour, `Sizes` for dimensions; `Themes` covers the
  // roles that have no surface counterpart (typography, radius, ring). `Components` itself is
  // allowed because a few tokens legitimately follow another component token
  // (`checkbox/field/line-height` → `checkbox/size/default`).
  Components: new Set([
    'Primitives Colors',
    'Primitives Sizes',
    'Primitives Motions',
    'Primitives Shadows',
    'Themes',
    'Surfaces',
    'Sizes',
    'Density',
    'Components',
  ]),
  // `Sizes` holds two layers that were never separated: the ramp (`layout/*`, `icon/*`) and the
  // control slots (`control/*`) that alias it. Density belongs between them, so the slots have
  // to be allowed to reach down into it — `control/padding/stack` → `Density.padding/stack/xs`
  // → `Sizes.layout/padding/stack/md`. The variable graph stays acyclic; only the collection
  // order does not, and splitting the collection is not an option: 1583 live bindings in
  // `[Core] UI Library` point at these roles, 193 of them on unwritable instance sub-nodes.
  Sizes: new Set([
    'Primitives Colors',
    'Primitives Sizes',
    'Primitives Motions',
    'Primitives Shadows',
    'Themes',
    'Sizes',
    'Density',
  ]),
  // A density slot points at a step of the responsive ramp, which is what lets the two axes
  // combine without a cartesian: the slot resolves on the `[data-density]` element, reading a
  // ramp value the media query has already adjusted on `:root`.
  Density: new Set(['Primitives Sizes', 'Sizes', 'Density']),
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

// ─── Figma modes ─────────────────────────────────────────────────────────

/** A leaf carries one value per Figma mode when its `$value` is an object. */
export function isModeMap(value: LeafValue): value is Record<string, Primitive> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Figma mode name → attribute value.
 * `Dark` → `dark`, `DarkGreen` → `dark-green`, `Tenant Light` → `tenant-light`.
 */
export function modeSlug(mode: string): string {
  return mode
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .trim()
    .replace(/[\s_/.]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

/** Every mode name present in a collection, in first-seen order. */
export function collectModes(tokens: Token[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tokens) {
    if (!isModeMap(t.value)) continue;
    for (const mode of Object.keys(t.value)) {
      if (seen.has(mode)) continue;
      seen.add(mode);
      out.push(mode);
    }
  }
  return out;
}

/**
 * The mode emitted on `:root` — the one every other mode overrides.
 * `Default` when Figma has it, otherwise the first mode of the collection.
 */
export function baseModeOf(modes: string[]): string | null {
  if (modes.length === 0) return null;
  return modes.find((m) => m === 'Default') ?? modes[0]!;
}

/**
 * Selector list for one Themes mode.
 *
 * The base mode also answers to its own explicit attribute, so a consumer can pin
 * the default theme instead of relying on the absence of `data-theme`. Every mode
 * additionally covers nested `[data-surface="default"]` containers, which reset the
 * surface context back to the page theme.
 */
export function themeModeSelector(mode: string, isBase: boolean): string {
  const slug = modeSlug(mode);
  if (isBase) {
    return `:root,\n[data-theme="${slug}"],\n[data-surface="default"]`;
  }
  return `[data-theme="${slug}"],\n[data-theme="${slug}"] [data-surface="default"]`;
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

  // Themes, Surfaces, Components, Sizes, Density — no collection prefix
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

/**
 * Does this token's alias chain reach `target` in any mode?
 *
 * Used to pick out the component dimensions that have to be repeated per density scope.
 * Repeating all of them instead would turn 252 declarations into ~750 identical ones, and the
 * surplus would be inert — a dimension that never resolves through `Density` cannot change.
 */
export function dependsOnCollection(
  token: Token,
  target: Collection,
  registry: Map<string, Token>,
  seen: Set<string> = new Set(),
): boolean {
  const key = tokenKey(token.collection, token.path);
  if (seen.has(key)) return false;
  seen.add(key);

  const values = isModeMap(token.value)
    ? Object.values(token.value as Record<string, Primitive>)
    : [token.value as Primitive];

  for (const v of values) {
    if (!isAlias(v)) continue;
    const parsed = parseAlias(v);
    if (!parsed) continue;
    if (parsed.collection === target) return true;
    const next = registry.get(tokenKey(parsed.collection, normalizedPath(parsed.path)));
    if (next && dependsOnCollection(next, target, registry, seen)) return true;
  }
  return false;
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
    const b = typeof rawValue === 'boolean' ? rawValue : String(rawValue) === 'true';
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
    if (isModeMap(t.value)) {
      for (const v of Object.values(t.value)) pushIfAlias(v);
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
  if (isModeMap(token.value)) {
    return Object.entries(token.value).map(([mode, raw]) => ({ mode, raw }));
  }
  return [{ mode: null, raw: token.value as Primitive }];
}

/**
 * Reverse alias graph over the Themes collection: target key → keys that alias it.
 * Used to pull dependent aliases into a mode block alongside the tokens they follow.
 */
export function buildReverseThemeDeps(themes: Token[]): Map<string, Set<string>> {
  const themeKeys = new Set(themes.map((t) => tokenKey(t.collection, normalizedPath(t.path))));
  const reverse = new Map<string, Set<string>>();

  for (const t of themes) {
    const fromKey = tokenKey(t.collection, normalizedPath(t.path));
    for (const { raw } of valuesByMode(t)) {
      if (!isAlias(raw)) continue;
      const parsed = parseAlias(raw);
      if (!parsed || parsed.collection !== 'Themes') continue;
      const targetKey = tokenKey(parsed.collection, normalizedPath(parsed.path));
      if (!themeKeys.has(targetKey)) continue;
      const dependents = reverse.get(targetKey) ?? new Set<string>();
      dependents.add(fromKey);
      reverse.set(targetKey, dependents);
    }
  }
  return reverse;
}

/**
 * Tokens that have to be re-declared for `mode`: those whose value differs from the
 * base mode, plus every alias that transitively depends on one of them.
 */
export function tokensForThemeMode(
  themes: Token[],
  mode: string,
  baseMode: string,
  reverseThemeDeps: Map<string, Set<string>>,
): Token[] {
  const overriddenKeys = new Set(
    themes
      .filter((t) => {
        if (!isModeMap(t.value)) return false;
        return mode in t.value && baseMode in t.value && t.value[mode] !== t.value[baseMode];
      })
      .map((t) => tokenKey(t.collection, normalizedPath(t.path))),
  );

  const queue = [...overriddenKeys];
  while (queue.length > 0) {
    const key = queue.shift();
    if (!key) continue;
    for (const dependent of reverseThemeDeps.get(key) ?? []) {
      if (overriddenKeys.has(dependent)) continue;
      overriddenKeys.add(dependent);
      queue.push(dependent);
    }
  }

  return themes.filter((t) => overriddenKeys.has(tokenKey(t.collection, normalizedPath(t.path))));
}

/** Value of `token` in `mode`, falling back to the base mode and then to the first mode. */
export function rawForMode(token: Token, mode: string, baseMode: string): Primitive {
  if (!isModeMap(token.value)) return token.value as Primitive;
  return token.value[mode] ?? token.value[baseMode] ?? (Object.values(token.value)[0] as Primitive);
}

export interface BuildTokensCssOptions {
  /**
   * Also mirror the `Dark` mode into `@media (prefers-color-scheme: dark)`, scoped to
   * `:root:not([data-theme])` so an explicit `data-theme` always wins over the OS setting.
   */
  autoDarkMode?: boolean;
}

export function buildTokensCss(
  tokens: Token[],
  registry: Map<string, Token>,
  warnings: WarningBucket,
  breakpointXlPx: number = 1280,
  options: BuildTokensCssOptions = {},
): string {
  const { autoDarkMode = true } = options;
  const primSizes = tokens.filter((t) => t.collection === 'Primitives Sizes');
  const primColors = tokens.filter((t) => t.collection === 'Primitives Colors');
  const primMotion = tokens.filter((t) => t.collection === 'Primitives Motions');
  const primShadows = tokens.filter((t) => t.collection === 'Primitives Shadows');
  const themes = tokens.filter((t) => t.collection === 'Themes');
  const surfaces = tokens.filter((t) => t.collection === 'Surfaces');
  const components = tokens.filter((t) => t.collection === 'Components');
  const sizes = tokens.filter((t) => t.collection === 'Sizes');
  const density = tokens.filter((t) => t.collection === 'Density');

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

  // Themes — one block per Figma mode. The base mode lands on :root; every other mode
  // becomes [data-theme="<slug>"], so a single attribute on <html> switches the theme.
  const themeModes = collectModes(themes);
  const baseThemeMode = baseModeOf(themeModes) ?? 'Default';

  const themesBaseLines: string[] = [];
  for (const t of themes) {
    const raw = rawForMode(t, baseThemeMode, baseThemeMode);
    const line = resolveCssLine(t, raw, baseThemeMode, registry, warnings);
    if (line !== null) themesBaseLines.push(line);
  }
  if (themesBaseLines.length > 0) {
    chunks.push(`/* === Themes === */\n${themeModeSelector(baseThemeMode, true)} {`);
    chunks.push(...themesBaseLines);
    chunks.push('}\n');
  }

  const reverseThemeDeps = buildReverseThemeDeps(themes);

  for (const mode of themeModes) {
    if (mode === baseThemeMode) continue;
    const modeTokens = tokensForThemeMode(themes, mode, baseThemeMode, reverseThemeDeps);
    const modeLines: string[] = [];
    for (const t of modeTokens) {
      const line = resolveCssLine(t, rawForMode(t, mode, baseThemeMode), mode, registry, warnings);
      if (line !== null) modeLines.push(line);
    }
    if (modeLines.length === 0) continue;

    chunks.push(`/* === Themes (${mode}) === */\n${themeModeSelector(mode, false)} {`);
    chunks.push(...modeLines);
    chunks.push('}\n');

    // Opt-out mirror of the Dark mode onto the OS setting. `:root:not([data-theme])`
    // keeps it from ever competing with an explicitly selected theme.
    if (autoDarkMode && modeSlug(mode) === 'dark') {
      chunks.push(
        `/* === Themes (${mode} — system preference) === */\n` +
          '@media (prefers-color-scheme: dark) {\n' +
          '  :root:not([data-theme]),\n' +
          '  :root:not([data-theme]) [data-surface="default"] {',
      );
      chunks.push(...modeLines.map((l) => '  ' + l));
      chunks.push('  }\n}\n');
    }
  }

  // Surfaces — per mode (Default is skipped when all lines are self-referential)
  const surfaceModes = collectModes(surfaces);
  const orderedSurfaceModes = [
    ...KNOWN_SURFACE_MODES.filter((m) => surfaceModes.includes(m)),
    ...surfaceModes.filter((m) => !KNOWN_SURFACE_MODES.includes(m)),
  ];
  for (const mode of orderedSurfaceModes) {
    const selector = SURFACE_MODE_SELECTOR[mode] ?? `[data-surface="${modeSlug(mode)}"]`;
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

  // Density — the second context layer. Like Surfaces it is attribute-driven, but it carries
  // dimensions rather than colour, and its base mode claims `[data-density="comfortable"]`
  // alongside `:root` so a nested comfortable container can reset out of a compact ancestor.
  const densityModes = collectModes(density);
  const orderedDensityModes = [
    ...KNOWN_DENSITY_MODES.filter((m) => densityModes.includes(m)),
    ...densityModes.filter((m) => !KNOWN_DENSITY_MODES.includes(m)),
  ];
  const densityScopes: string[] = [];
  for (const mode of orderedDensityModes) {
    const selector = DENSITY_MODE_SELECTOR[mode] ?? `[data-density="${modeSlug(mode)}"]`;
    densityScopes.push(selector);
    const densityLines: string[] = [];
    for (const t of density) {
      const modeValues = valuesByMode(t);
      const entry = modeValues.find((m) => m.mode === mode) ?? modeValues[0];
      if (!entry) continue;
      const line = resolveCssLine(t, entry.raw, mode, registry, warnings);
      if (line !== null) densityLines.push(line);
    }
    if (densityLines.length > 0) {
      chunks.push(`/* === Density (${mode}) === */\n${selector} {`);
      chunks.push(...densityLines);
      chunks.push('}\n');
    }
  }

  // Components — a single-mode collection whose every token is one alias to a role.
  //
  // The identical declaration list is repeated into every scope where a role can change.
  // That repetition is required, not defensive: a custom property containing `var()` is
  // substituted at computed-value time **on the element the declaration applies to**, and
  // descendants inherit the already-substituted result. Declared only on `:root`,
  // `--color-chip-x: var(--color-role-y)` would freeze at the `:root` value and ignore a
  // `[data-surface="subtle"]` container further down — verified in Chromium.
  //
  // In Figma the same token needs no modes at all, because an alias there resolves in the
  // mode context of the consuming node. The asymmetry is why the collection stays small in
  // Figma while its CSS is emitted once per scope.
  // A dimension is neither surface-aware nor theme-aware, so it stays out of those scopes.
  // Whether it needs the density scopes depends on the token: one that resolves through
  // `Density` must be repeated for the same substitution reason as colour, while one that only
  // reaches a `Sizes` role recomputes on its own, because a media query redeclares that role on
  // `:root` — the same element the declaration applies to.
  const componentLines: string[] = [];
  const staticDimensionLines: string[] = [];
  const densityDimensionLines: string[] = [];
  for (const t of components) {
    const entry = valuesByMode(t)[0];
    if (!entry) continue;
    const line = resolveCssLine(t, entry.raw, entry.mode, registry, warnings);
    if (line === null) continue;
    if (t.type === 'color') componentLines.push(line);
    else if (dependsOnCollection(t, 'Density', registry)) densityDimensionLines.push(line);
    else staticDimensionLines.push(line);
  }

  if (staticDimensionLines.length > 0) {
    chunks.push('/* === Components — dimensions === */\n:root {');
    chunks.push(...staticDimensionLines);
    chunks.push('}\n');
  }

  if (densityDimensionLines.length > 0) {
    const scopes = densityScopes.length > 0 ? densityScopes : [':root'];
    for (const selector of scopes) {
      chunks.push(`/* === Components — dimensions (density) === */\n${selector} {`);
      chunks.push(...densityDimensionLines);
      chunks.push('}\n');
    }
  }

  if (componentLines.length > 0) {
    const scopes: string[] = [themeModeSelector(baseThemeMode, true)];
    for (const mode of themeModes) {
      if (mode !== baseThemeMode) scopes.push(themeModeSelector(mode, false));
    }
    for (const mode of orderedSurfaceModes) {
      const selector = SURFACE_MODE_SELECTOR[mode] ?? `[data-surface="${modeSlug(mode)}"]`;
      if (selector !== ':root') scopes.push(selector);
    }

    for (const selector of scopes) {
      chunks.push(`/* === Components === */\n${selector} {`);
      chunks.push(...componentLines);
      chunks.push('}\n');
    }

    if (autoDarkMode && themeModes.some((m) => modeSlug(m) === 'dark')) {
      chunks.push(
        '/* === Components (system preference) === */\n' +
          '@media (prefers-color-scheme: dark) {\n' +
          '  :root:not([data-theme]),\n' +
          '  :root:not([data-theme]) [data-surface="default"] {',
      );
      chunks.push(...componentLines.map((l) => '  ' + l));
      chunks.push('  }\n}\n');
    }
  }

  // CSS var names already claimed by Primitives — Sizes tokens with the same name would
  // overwrite raw primitive values with aliases that point back to those same primitives,
  // creating an irresolvable circular reference (e.g. --radius-md → var(--radius-md-mobile)
  // → var(--radius-md) → ∞). Skip any Sizes token whose var name collides with a primitive.
  const primitiveSizeVarNames = new Set(
    [...primSizes, ...primColors, ...primMotion, ...primShadows].map((t) =>
      cssVarName(t.collection, t.path),
    ),
  );

  // Sizes modes map to media queries, not attributes, so only the two the build knows
  // a breakpoint for can be emitted. Report the rest instead of dropping them silently.
  for (const mode of collectModes(sizes)) {
    if (KNOWN_SIZE_MODES.includes(mode)) continue;
    console.warn(
      `⚠ UNMAPPED MODE: Sizes."${mode}" — only ${KNOWN_SIZE_MODES.join(' and ')} are emitted`,
    );
  }

  // Sizes — Mobile (default → :root)
  //
  // A `control/*` slot may alias a Density slot, and then it needs the same per-scope
  // repetition as a component dimension: declared once on `:root` it would be substituted
  // there and ignore a `[data-density]` container below. Everything else stays on `:root`.
  const mobileSizeLines: string[] = [];
  const densitySizeLines: string[] = [];
  for (const t of sizes) {
    if (primitiveSizeVarNames.has(cssVarName(t.collection, t.path))) continue;
    const modeValues = valuesByMode(t);
    const entry = modeValues.find((m) => m.mode === 'Mobile') ?? modeValues[0];
    if (!entry) continue;
    const line = resolveCssLine(t, entry.raw, 'Mobile', registry, warnings);
    if (line === null) continue;
    if (dependsOnCollection(t, 'Density', registry)) densitySizeLines.push(line);
    else mobileSizeLines.push(line);
  }
  if (mobileSizeLines.length > 0) {
    chunks.push('/* === Sizes (Mobile — default) === */\n:root {');
    chunks.push(...mobileSizeLines);
    chunks.push('}\n');
  }
  if (densitySizeLines.length > 0) {
    const scopes = densityScopes.length > 0 ? densityScopes : [':root'];
    for (const selector of scopes) {
      chunks.push(`/* === Sizes — density-aware roles === */\n${selector} {`);
      chunks.push(...densitySizeLines);
      chunks.push('}\n');
    }
  }

  // Sizes — Desktop (only vars whose Desktop value differs from Mobile, inside @media)
  const breakpointXlRem = toRem(breakpointXlPx);
  const desktopSizeLines: string[] = [];
  for (const t of sizes) {
    if (primitiveSizeVarNames.has(cssVarName(t.collection, t.path))) continue;
    const modeValues = valuesByMode(t);
    const mobileEntry = modeValues.find((m) => m.mode === 'Mobile') ?? modeValues[0];
    const desktopEntry = modeValues.find((m) => m.mode === 'Desktop');
    if (!desktopEntry || !mobileEntry || desktopEntry.raw === mobileEntry.raw) continue;
    // The two axes cannot both be expressed here: this block declares on `:root`, so a
    // density-aware role redeclared inside the media query would freeze at the `:root` value
    // and stop following `[data-density]`. Put the breakpoint in the ramp entry the density
    // slot points at instead — that is what `layout/padding/inline/control-adaptive` is for.
    if (dependsOnCollection(t, 'Density', registry)) {
      console.warn(
        `⚠ DENSITY × BREAKPOINT: Sizes."${t.path.join('/')}" reaches Density and also varies by ` +
          `Sizes mode — move the responsive step into the ramp entry the slot aliases`,
      );
      continue;
    }
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

  const seenSemanticVars = new Set<string>();
  for (const t of tokens) {
    if (t.collection !== 'Themes' && t.collection !== 'Surfaces' && t.collection !== 'Components')
      continue;
    const varName = cssVarName(t.collection, t.path);
    if (!varName.startsWith('--color-')) continue;
    if (seenSemanticVars.has(varName)) continue;
    seenSemanticVars.add(varName);
    lines.push(`  ${varName}: var(${varName});`);
  }

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
  // Precedence Components > Surfaces > Themes. The collections share CSS variable names
  // after the collection prefix is dropped, so only the most specific definition of a path
  // may reach the public TS API — otherwise `tokens.color.chip.…` would be emitted several
  // times and the last writer would win by accident.
  const surfacesPaths = new Set<string>();
  const componentsPaths = new Set<string>();
  for (const t of tokens) {
    if (t.collection === 'Surfaces') surfacesPaths.add(normalizedPath(t.path).join('.'));
    if (t.collection === 'Components') componentsPaths.add(normalizedPath(t.path).join('.'));
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

    const pathKey = normalizedPath(t.path).join('.');
    if (t.collection === 'Themes' && (surfacesPaths.has(pathKey) || componentsPaths.has(pathKey)))
      continue;
    if (t.collection === 'Surfaces' && componentsPaths.has(pathKey)) continue;
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
