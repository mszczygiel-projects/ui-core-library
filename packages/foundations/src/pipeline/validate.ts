import { needsDescription, scopesOf, surfaceUse, webCodeSyntax } from './figma.ts';
import {
  type Collection,
  isPrimitiveCollection,
  PRIMITIVE_COLLECTIONS,
  type Token,
  tokenId,
} from './model.ts';
import { cssVarName, normalizedPath } from './names.ts';
import {
  findCycles,
  isAlias,
  parseAlias,
  type Registry,
  tokenKey,
  valuesByMode,
} from './resolve.ts';

/**
 * The rules of the token layers, names and metadata. Breaking one still produces usable CSS,
 * but a token that breaks them no longer follows the theme, the surface or the brand, carries a
 * name that can change without anyone deciding it, or reaches designers and developers without
 * its metadata. In this library a violation fails the build; in a client's fork it is a warning.
 */
export type Rule =
  'layers' | 'raw-value' | 'alias-name' | 'metadata' | 'scopes' | 'code-syntax' | 'description';

export interface Violation {
  readonly rule: Rule;
  /** A stable identifier, the one written in the list of known violations. */
  readonly id: string;
  readonly message: string;
}

/** The collections each collection may alias: its own layer and the layers before it. */
export const ALLOWED_ALIASES: Readonly<Record<Collection, ReadonlySet<Collection>>> = {
  'Primitives Colors': new Set(),
  'Primitives Sizes': new Set(),
  'Primitives Motions': new Set(),
  'Primitives Shadows': new Set(),
  // Themes holds what changes with neither the screen nor the density, Sizes what does; neither
  // reads the other.
  Themes: new Set([...PRIMITIVE_COLLECTIONS, 'Themes']),
  Surfaces: new Set([...PRIMITIVE_COLLECTIONS, 'Themes']),
  Sizes: new Set([...PRIMITIVE_COLLECTIONS, 'Sizes']),
  // Roles carry brand and mode changes. Exact geometry aliases are checked separately.
  Components: new Set(['Themes', 'Surfaces', 'Sizes', 'Components']),
};

/**
 * The brand values that Themes holds as raw values: fonts, the flags of elements and
 * the geometry of the focus ring.
 */
function isRawBrandValue(collection: Collection, path: readonly string[]): boolean {
  const normalized = normalizedPath(path);
  const family = normalized[0];
  return (
    collection === 'Themes' &&
    (family === 'font' ||
      family === 'ring' ||
      family === 'text-uppercase' ||
      normalized[normalized.length - 1] === 'text-underline')
  );
}

/** A component token that may alias a primitive or hold a raw value. */
export interface LayoutConstant {
  readonly token: string;
  readonly reason: string;
}

/** One approved connection for a component's fixed geometry. */
export interface PrimitiveAlias extends LayoutConstant {
  readonly target: string;
}

/** What the library accepts from its own Figma file, kept in `token-exceptions.json`. */
export interface Exceptions {
  /** Values that no brand or mode changes, such as the maximum width of a dialog. */
  readonly layoutConstants: readonly LayoutConstant[];
  /** Exact aliases only; these entries never permit raw values. */
  readonly primitiveAliases?: readonly PrimitiveAlias[];
  /** Violations the Figma file still has, by id. The list may only shrink. */
  readonly knownViolations: readonly string[];
}

export const NO_EXCEPTIONS: Exceptions = { layoutConstants: [], knownViolations: [] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Reads `token-exceptions.json`; a malformed file is an error, not an empty list. */
export function parseExceptions(json: unknown): Exceptions {
  const malformed = (detail: string) => new Error(`token-exceptions.json: ${detail}`);
  if (!isRecord(json)) {
    throw malformed('expected an object');
  }
  const { layoutConstants, knownViolations } = json;
  const primitiveAliases: unknown =
    json['primitiveAliases'] === undefined ? [] : json['primitiveAliases'];
  if (!Array.isArray(layoutConstants) || !Array.isArray(knownViolations)) {
    throw malformed('expected the arrays "layoutConstants" and "knownViolations"');
  }
  if (!Array.isArray(primitiveAliases)) {
    throw malformed('"primitiveAliases" must be an array');
  }
  return {
    primitiveAliases: primitiveAliases.map((entry: unknown) => {
      if (
        !isRecord(entry) ||
        typeof entry['token'] !== 'string' ||
        typeof entry['target'] !== 'string' ||
        typeof entry['reason'] !== 'string' ||
        entry['token'].trim() === '' ||
        entry['target'].trim() === '' ||
        entry['reason'].trim() === ''
      ) {
        throw malformed('a primitive alias needs a nonempty "token", "target" and "reason"');
      }
      return { token: entry['token'], target: entry['target'], reason: entry['reason'] };
    }),
    layoutConstants: layoutConstants.map((entry: unknown) => {
      if (
        !isRecord(entry) ||
        typeof entry['token'] !== 'string' ||
        typeof entry['reason'] !== 'string'
      ) {
        throw malformed('a layout constant needs a "token" and a "reason"');
      }
      return { token: entry['token'], reason: entry['reason'] };
    }),
    knownViolations: knownViolations.map((entry: unknown) => {
      if (typeof entry !== 'string') {
        throw malformed('a known violation is the id of a violation, a string');
      }
      return entry;
    }),
  };
}

function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Every violation of the rules, sorted by id. */
export function findViolations(
  tokens: readonly Token[],
  layoutConstants: ReadonlySet<string> = new Set(),
  primitiveAliases: readonly PrimitiveAlias[] = [],
): Violation[] {
  const found = new Map<string, Violation>();
  const add = (violation: Violation) => {
    if (!found.has(violation.id)) {
      found.set(violation.id, violation);
    }
  };

  for (const token of tokens) {
    const id = tokenId(token.collection, token.path);
    const isLayoutConstant = layoutConstants.has(id);
    let holdsRawValue = false;

    for (const { raw } of valuesByMode(token)) {
      if (!isAlias(raw)) {
        holdsRawValue = true;
        continue;
      }
      const target = parseAlias(raw);
      if (target === null) {
        continue; // A broken alias is an error of its own.
      }
      if (target.path.some((segment) => segment.includes('--'))) {
        const named = tokenId(target.collection, target.path);
        add({
          rule: 'alias-name',
          id: `alias-name ${named}`,
          message: `${named} has a doubled hyphen, which the export renames; rename the variable in Figma`,
        });
      }
      const targetId = tokenId(target.collection, normalizedPath(target.path));
      const allowed =
        ALLOWED_ALIASES[token.collection].has(target.collection) ||
        (isLayoutConstant && isPrimitiveCollection(target.collection)) ||
        primitiveAliases.some((entry) => entry.token === id && entry.target === targetId);
      if (!allowed) {
        add({
          rule: 'layers',
          id: `layers ${id} -> ${targetId}`,
          message: `${id} aliases ${targetId}, but ${token.collection} may not alias it`,
        });
      }
    }

    if (
      holdsRawValue &&
      !isPrimitiveCollection(token.collection) &&
      !isRawBrandValue(token.collection, token.path) &&
      !isLayoutConstant
    ) {
      add({
        rule: 'raw-value',
        id: `raw-value ${id}`,
        message: `${id} holds a raw value; outside Primitives only the brand values of Themes and the layout constants may`,
      });
    }
  }

  return [...found.values()].sort((a, b) => compare(a.id, b.id));
}

function listed(scopes: readonly string[]): string {
  return scopes.length === 0 ? 'no field' : [...scopes].sort(compare).join(', ');
}

/**
 * The metadata of the variables against what they should carry: a description for
 * every role and Brand value, and, when the exports were made with the Figma metadata of the
 * variables, the scopes the rules give them and the WEB code syntax of their custom property.
 */
export function findMetadataViolations(tokens: readonly Token[]): Violation[] {
  const use = surfaceUse(tokens);
  const exported = tokens.some((token) => token.figma !== undefined);
  const violations: Violation[] = exported
    ? []
    : [
        {
          rule: 'metadata',
          id: 'metadata',
          message:
            'The exports carry no Figma metadata: export the variables with it, so that their scopes and code syntax can be checked',
        },
      ];
  for (const token of tokens) {
    const id = tokenId(token.collection, token.path);
    if (needsDescription(token, use) && (token.description ?? '').trim() === '') {
      violations.push({
        rule: 'description',
        id: `description ${id}`,
        message: `${id} has no description; every role and brand value needs one`,
      });
    }
    if (!exported) {
      continue;
    }
    if (token.figma === undefined) {
      violations.push({
        rule: 'metadata',
        id: `metadata ${id}`,
        message: `${id} has no Figma metadata in the export`,
      });
      continue;
    }
    const scopes = scopesOf(token, use);
    if (scopes === 'unknown') {
      violations.push({
        rule: 'scopes',
        id: `scopes ${id}`,
        message: `${id} matches no scope rule; give its kind of token a rule`,
      });
    } else if (scopes !== 'fixed' && listed(scopes) !== listed(token.figma.scopes)) {
      violations.push({
        rule: 'scopes',
        id: `scopes ${id}`,
        message: `${id} is offered in ${listed(token.figma.scopes)}; its scope rule gives it ${listed(scopes)}`,
      });
    }
    const codeSyntax = webCodeSyntax(token);
    const shown = token.figma.codeSyntax['WEB'];
    if (shown !== codeSyntax) {
      violations.push({
        rule: 'code-syntax',
        id: `code-syntax ${id}`,
        message: `${id} shows ${shown ?? 'no code syntax'} in Dev Mode instead of ${codeSyntax}`,
      });
    }
  }
  return violations.sort((a, b) => compare(a.id, b.id));
}

/**
 * Two collections that claim one CSS name across the primitive boundary. Nothing merely
 * suboptimal can come of it: the semantic token either loses the name and silently resolves to
 * the primitive, or wins it and turns the primitive into a cycle. Semantic collections share
 * names on purpose, so later scopes override earlier ones; that is not a collision.
 */
export function findNameCollisions(
  tokens: readonly Token[],
): { name: string; claimants: string[] }[] {
  const byName = new Map<string, Token[]>();
  for (const token of tokens) {
    const name = cssVarName(token.collection, token.path);
    const claimants = byName.get(name) ?? [];
    if (!claimants.some((claimant) => claimant.collection === token.collection)) {
      byName.set(name, [...claimants, token]);
    }
  }
  return [...byName]
    .filter(([, claimants]) => {
      return claimants.length > 1 && claimants.some((t) => isPrimitiveCollection(t.collection));
    })
    .map(([name, claimants]) => ({
      name,
      claimants: claimants.map((t) => tokenId(t.collection, t.path)),
    }));
}

/**
 * Problems that stop every build, in a fork too: an alias to a variable that does not exist,
 * a cycle and a name collision all produce CSS that looks complete and is not.
 */
export function findErrors(tokens: readonly Token[], registry: Registry): string[] {
  const errors = new Set<string>();
  for (const token of tokens) {
    for (const { raw } of valuesByMode(token)) {
      if (!isAlias(raw)) {
        continue;
      }
      const target = parseAlias(raw);
      if (
        target === null ||
        !registry.has(tokenKey(target.collection, normalizedPath(target.path)))
      ) {
        errors.add(`${tokenId(token.collection, token.path)} aliases ${raw}, which does not exist`);
      }
    }
  }
  for (const cycle of findCycles(tokens, registry)) {
    errors.add(`Alias cycle: ${cycle}`);
  }
  for (const { name, claimants } of findNameCollisions(tokens)) {
    errors.add(
      `${name} is claimed by ${claimants.join(' and ')}: a primitive and a semantic token cannot share a CSS name; rename the variable in Figma`,
    );
  }
  return [...errors];
}

/** Errors in the layout constants themselves: each names an existing component token. */
export function checkLayoutConstants(
  layoutConstants: readonly LayoutConstant[],
  tokens: readonly Token[],
): string[] {
  const components = new Set(
    tokens.filter((t) => t.collection === 'Components').map((t) => tokenId(t.collection, t.path)),
  );
  return layoutConstants
    .filter((constant) => !components.has(constant.token) || constant.reason.trim() === '')
    .map((constant) => {
      return `Layout constant "${constant.token}" must name an existing Components token and give a reason`;
    });
}

/** Reject stale or overly broad exceptions before they can authorize a build. */
export function checkPrimitiveAliases(
  entries: readonly PrimitiveAlias[],
  tokens: readonly Token[],
  layoutConstants: readonly LayoutConstant[] = [],
): string[] {
  const byId = new Map(tokens.map((t) => [tokenId(t.collection, normalizedPath(t.path)), t]));
  const seen = new Set<string>();
  const errors: string[] = [];
  for (const entry of entries) {
    const source = byId.get(entry.token);
    const target = byId.get(entry.target);
    const prefix = `Primitive alias "${entry.token}"`;
    if (
      seen.has(entry.token) ||
      layoutConstants.some((constant) => constant.token === entry.token)
    ) {
      errors.push(`${prefix} must be listed once and not also be a layout constant`);
    }
    seen.add(entry.token);
    if (
      source?.collection !== 'Components' ||
      source.type !== 'number' ||
      entry.reason.trim() === ''
    ) {
      errors.push(`${prefix} must name an existing numeric Components token and give a reason`);
    }
    if (
      target?.collection !== 'Primitives Sizes' ||
      target.type !== 'number' ||
      !['size', 'spacing', 'border-width'].includes(target.path[0] ?? '')
    ) {
      errors.push(
        `${prefix} must target an existing numeric size, spacing or border-width primitive`,
      );
    }
    if (
      source !== undefined &&
      valuesByMode(source).some(({ raw }) => {
        const alias = isAlias(raw) ? parseAlias(raw) : null;
        return (
          alias === null || tokenId(alias.collection, normalizedPath(alias.path)) !== entry.target
        );
      })
    ) {
      errors.push(`${prefix} must alias "${entry.target}" in every mode`);
    }
  }
  return errors;
}

export interface Verdict {
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  /** Violations accepted because they are listed as known. */
  readonly known: number;
}

/**
 * What the violations mean for the build. In a fork they are warnings. In strict mode each one
 * is an error unless listed as known, and a listed violation that no longer occurs is an error
 * too, so the list can only shrink.
 */
export function judge(
  violations: readonly Violation[],
  options: { readonly strict: boolean; readonly knownViolations: readonly string[] },
): Verdict {
  if (!options.strict) {
    return { errors: [], warnings: violations.map((v) => v.message), known: 0 };
  }
  const listed = new Set(options.knownViolations);
  const occurring = new Set(violations.map((v) => v.id));
  const unlisted = violations.filter((v) => !listed.has(v.id));
  const stale = [...listed].filter((id) => !occurring.has(id));
  return {
    errors: [
      ...unlisted.map((v) => v.message),
      ...stale.map((id) => `"${id}" no longer occurs; remove it from the known violations`),
    ],
    warnings: [],
    known: violations.length - unlisted.length,
  };
}
