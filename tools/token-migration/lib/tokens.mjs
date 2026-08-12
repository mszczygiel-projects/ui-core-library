// Loader + resolver for the Luckino token exports, shared by the migration tools.
//
// This is migration-time tooling, not part of the build pipeline. It answers one
// question the build never has to: what colour does a token end up with for a given
// *combination* of collection modes (theme × surface)? `build-tokens.ts` emits one
// CSS block per mode and lets the cascade compose them, so it never resolves a
// cross-collection combination itself.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Collections that carry a mode dimension, and the export file each lives in. */
export const MODAL_COLLECTIONS = ['Themes', 'Surfaces', 'Sizes'];

export const THEME_MODES = ['Default', 'Dark'];
export const SURFACE_MODES = ['Default', 'Subtle', 'Inverse', 'Primary'];
export const SIZE_MODES = ['Mobile', 'Desktop'];

/** The `Themes` namespace each surface mode reads from — the mirror convention. */
export const SURFACE_MIRROR_PREFIX = {
  Default: '',
  Subtle: 'on-subtle.',
  Inverse: 'on-inverse.',
  Primary: 'on-brand-primary.',
};

function flatten(node, prefix, collection, out) {
  if (!node || typeof node !== 'object') return out;
  if ('$value' in node) {
    const path = prefix.join('.');
    out.push({
      key: collection === 'Primitives' ? path : `${collection}.${path}`,
      collection,
      path,
      type: node.$type,
      value: node.$value,
      description: node.$description,
    });
    return out;
  }
  for (const [k, child] of Object.entries(node)) flatten(child, [...prefix, k], collection, out);
  return out;
}

/**
 * Reads the four Luckino exports into a flat registry.
 *
 * Primitive keys keep the collection name Figma gives them (`Primitives Colors.gray.500`),
 * because that is exactly how aliases spell them. Everything else is `<Collection>.<path>`.
 */
export function loadTokens(dir) {
  const all = [];
  const primitives = JSON.parse(readFileSync(join(dir, 'primitives.json'), 'utf8'));
  for (const [collectionName, tree] of Object.entries(primitives)) {
    flatten(tree, [collectionName], 'Primitives', all);
  }
  for (const [collection, file] of [
    ['Themes', 'themes.json'],
    ['Surfaces', 'surfaces.json'],
    ['Sizes', 'sizes.json'],
  ]) {
    flatten(JSON.parse(readFileSync(join(dir, file), 'utf8')), [], collection, all);
  }
  // Present only after the restructure; absent in a pre-migration export.
  try {
    flatten(JSON.parse(readFileSync(join(dir, 'components.json'), 'utf8')), [], 'Components', all);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }

  const byKey = new Map();
  for (const t of all) byKey.set(normalizeKey(t.key), t);
  return { all, byKey };
}

const isAlias = (v) => typeof v === 'string' && v.startsWith('{') && v.endsWith('}');

/**
 * Collapses the Tailwind modifier convention the way `build-tokens.ts` does.
 *
 * A line-height primitive is stored as `text.3xl-line-height` but referenced as
 * `{Primitives Sizes.text.3xl--line-height}`. The build normalises `--` to `-` per segment
 * (`normalizeSegment`); without the same step here, 42 typography tokens resolve to
 * `<MISSING:…>` and every size comparison built on them is meaningless.
 */
const normalizeKey = (key) => key.replace(/--/g, '-');

/**
 * Picks the raw value of a token for a given mode selection.
 *
 * The mode is chosen by the token's OWN collection — this is the whole point of the
 * function. Carrying one mode name down an alias chain would let `Surfaces=Subtle`
 * leak into a `Themes` lookup, where `Subtle` does not exist; the lookup would then
 * silently fall back to `Default` and every surface would resolve identically.
 */
function rawFor(token, modes) {
  const v = token.value;
  if (v === null || typeof v !== 'object' || Array.isArray(v)) return v;
  const wanted = modes[token.collection];
  if (wanted !== undefined && wanted in v) return v[wanted];
  if ('Default' in v) return v.Default;
  return Object.values(v)[0];
}

/**
 * Resolves a token to its final primitive value under `modes`
 * (e.g. `{ Themes: 'Dark', Surfaces: 'Inverse' }`).
 *
 * Returns a `<MISSING:…>` / `<CYCLE:…>` marker rather than throwing, so a broken
 * reference shows up as a diff in the snapshot instead of aborting the run.
 */
export function resolve(byKey, key, modes, seen = new Set()) {
  key = normalizeKey(key);
  if (seen.has(key)) return `<CYCLE:${key}>`;
  const token = byKey.get(key);
  if (!token) return `<MISSING:${key}>`;
  const raw = rawFor(token, modes);
  if (!isAlias(raw)) return raw;
  return resolve(byKey, raw.slice(1, -1), modes, new Set([...seen, key]));
}

/**
 * Follows the alias chain and returns the key of the last token in it — the primitive the
 * value ultimately comes from, or the token's own key when it holds a raw value.
 *
 * The migration re-points component tokens at roles, and each new role has to alias the
 * SAME primitive its consumers already resolved to. Deriving that from the chain keeps the
 * values exact; reverse-looking-up a hex would be ambiguous, because several primitives
 * share a value (`gray.200` and `border.default` are both `#ededed` today).
 */
export function resolveToPrimitiveKey(byKey, key, modes, seen = new Set()) {
  key = normalizeKey(key);
  if (seen.has(key)) return null;
  const token = byKey.get(key);
  if (!token) return null;
  const raw = rawFor(token, modes);
  if (!isAlias(raw)) return key;
  return resolveToPrimitiveKey(byKey, raw.slice(1, -1), modes, new Set([...seen, key]));
}

/**
 * The full behaviour of a token: its value in every theme × surface combination.
 * Two tokens with the same tuple are interchangeable for every consumer.
 */
export function tupleOf(byKey, key, themeModes = THEME_MODES, surfaceModes = SURFACE_MODES) {
  const out = [];
  for (const theme of themeModes) {
    for (const surface of surfaceModes) {
      out.push(resolve(byKey, key, { Themes: theme, Surfaces: surface }));
    }
  }
  return out;
}

export const tupleKey = (tuple) => tuple.join('~');

/**
 * Splits the component-facing set into generic semantic roles and component-scoped
 * tokens. The generic groups are the ones that describe a page, not a widget.
 */
export const GENERIC_GROUPS = [
  'background',
  'text',
  'icon',
  'border',
  'ring',
  'link',
  'feedback',
  'brand',
  'action',
  'selection',
];

export const isGeneric = (path) => GENERIC_GROUPS.includes(path.split('.')[1]);

/**
 * Every colour token a consumer can bind, wherever it lives.
 *
 * Before the restructure that is the whole colour set of `Surfaces` (797 = 726 component
 * tokens + 71 generic roles). After it, the component tokens moved to `Components` and
 * `Surfaces` kept the roles — so the union is what keeps a post-migration export comparable
 * against a pre-migration baseline: every path in the baseline is still in the set, under the
 * same name, and the 8-way values line up one to one.
 *
 * Taking only `Components` would report all 71 roles as removed, which is a lie about the
 * file — they are still there, one collection over.
 *
 * `Components` wins a path collision, matching the build's precedence.
 */
export function componentFacingTokens(all) {
  const byPath = new Map();
  for (const t of all) {
    if (t.type !== 'color') continue;
    if (t.collection === 'Surfaces') byPath.set(t.path, t);
  }
  for (const t of all) {
    if (t.type !== 'color') continue;
    if (t.collection === 'Components') byPath.set(t.path, t);
  }
  return [...byPath.values()];
}

/**
 * The non-colour half of the same question: everything a component can bind for a dimension.
 *
 * Lives in `Sizes` today; the component-scoped part of it is due to move to `Components`, so
 * the union keeps a post-move export comparable against a pre-move baseline — exactly as
 * `componentFacingTokens` does for colour. `Components` wins a path collision.
 */
export function sizeFacingTokens(all) {
  const byPath = new Map();
  for (const t of all) {
    if (t.type === 'color') continue;
    if (t.collection === 'Sizes') byPath.set(t.path, t);
  }
  for (const t of all) {
    if (t.type === 'color') continue;
    if (t.collection === 'Components') byPath.set(t.path, t);
  }
  return [...byPath.values()];
}
