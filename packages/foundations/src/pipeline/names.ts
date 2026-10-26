import type { Collection } from './model.ts';

/**
 * Figma mode name → the value of its attribute: `Dark` → `dark`, `DarkGreen` → `dark-green`,
 * `Tenant Light` → `tenant-light`.
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

/**
 * Collapses a doubled hyphen. The export writes a variable's own name with a single hyphen but
 * keeps the doubled one in the aliases that point at it, so both spellings have to meet here.
 * Every such alias is reported as a naming violation.
 */
export function normalizeSegment(segment: string): string {
  return segment.replace(/--/g, '-');
}

export function normalizedPath(path: readonly string[]): string[] {
  return path.map(normalizeSegment);
}

/**
 * Semantic paths that would take the CSS name of a primitive. Figma tells two variables with the
 * same path apart by their collection; CSS has one flat namespace and cannot. The semantic side
 * moves, never the primitive: consumers and the Tailwind theme already read the primitive names,
 * while a colliding semantic token never reached the output at all. A whole family moves, so
 * that it is never split across two prefixes.
 */
export const SEMANTIC_RENAMES: readonly {
  readonly collection: Collection;
  readonly from: readonly string[];
  readonly to: string;
}[] = [
  // The radius roles; `Primitives Sizes/radius/*` is the raw ramp behind them.
  { collection: 'Themes', from: ['radius'], to: 'shape-radius' },
];

/** Applies `SEMANTIC_RENAMES` to a normalized path. */
export function renamedPath(collection: Collection, path: readonly string[]): string[] {
  for (const rule of SEMANTIC_RENAMES) {
    if (rule.collection !== collection || rule.from.length > path.length) {
      continue;
    }
    if (rule.from.every((segment, i) => path[i] === segment)) {
      return [rule.to, ...path.slice(rule.from.length)];
    }
  }
  return [...path];
}

/**
 * The CSS custom property of a token. Roles and component tokens add no prefix of their
 * collection, so moving a variable between them keeps its name.
 */
export function cssVarName(collection: Collection, path: readonly string[]): string {
  const name = renamedPath(collection, normalizedPath(path));

  switch (collection) {
    case 'Primitives Colors':
      return `--color-${name.join('-').toLowerCase()}`;
    case 'Primitives Sizes': {
      // A text size and its line height follow Tailwind's convention: `--text-sm` and
      // `--text-sm--line-height`, so the Tailwind theme can pair them.
      if (name[0] === 'text') {
        const rest = name.slice(1).join('-');
        if (rest.endsWith('-line-height')) {
          return `--text-${rest.slice(0, -'-line-height'.length)}--line-height`;
        }
      }
      return `--${name.join('-').toLowerCase()}`;
    }
    case 'Primitives Motions':
      // Easing curves are named like Tailwind's: `--ease-in`, not `--easing-ease-in`.
      return name[0] === 'easing'
        ? `--${name.slice(1).join('-').toLowerCase()}`
        : `--${name.join('-').toLowerCase()}`;
    default:
      return `--${name.join('-').toLowerCase()}`;
  }
}

/** kebab-case → camelCase, for the keys of `tokens.ts`. */
export function toCamel(key: string): string {
  return key.replace(/-([a-zA-Z0-9])/g, (_match, char: string) => char.toUpperCase());
}

const JS_IDENTIFIER = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

/** A path segment as an object key of `tokens.ts`, quoted when it is not an identifier. */
export function tsKey(segment: string): string {
  const camel = toCamel(normalizeSegment(segment));
  return JS_IDENTIFIER.test(camel) ? camel : JSON.stringify(camel);
}
