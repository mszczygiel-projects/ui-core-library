import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  type Collection,
  type FigmaMetadata,
  isModeValues,
  isTokenType,
  type Primitive,
  PRIMITIVE_COLLECTIONS,
  type Token,
  type TokenType,
  type TokenValue,
} from './model.ts';
import { normalizedPath } from './names.ts';
import { isAlias, parseAlias, tokenKey } from './resolve.ts';

/**
 * A problem with an export that stops the build: nothing trustworthy can be generated from a
 * missing file, invalid JSON or a variable whose value the pipeline cannot read.
 */
export class ExportError extends Error {
  override name = 'ExportError';
}

/**
 * The exports of one Figma file, one per collection, as the Luckino plugin writes them. The
 * four primitive collections share `primitives.json`. A file without the Components collection
 * still builds; it just emits no component tokens.
 */
export interface Exports {
  readonly primitives: unknown;
  readonly themes: unknown;
  readonly surfaces: unknown;
  readonly sizes: unknown;
  readonly components?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPrimitive(value: unknown): value is Primitive {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function parseValue(raw: unknown, where: string): TokenValue {
  if (isPrimitive(raw)) {
    return raw;
  }
  if (isRecord(raw)) {
    const modes: Record<string, Primitive> = {};
    for (const [mode, value] of Object.entries(raw)) {
      if (!isPrimitive(value)) {
        throw new ExportError(
          `${where}: the value of mode "${mode}" is not a string, number or boolean`,
        );
      }
      modes[mode] = value;
    }
    return modes;
  }
  throw new ExportError(`${where}: $value is neither a value nor one value per mode`);
}

/**
 * The Figma metadata of a variable, which the export writes under `$extensions["com.figma"]`
 * when it is made with that option. Other vendors' extensions are ignored.
 */
function parseFigmaMetadata(extensions: unknown, where: string): FigmaMetadata | undefined {
  if (!isRecord(extensions) || !('com.figma' in extensions)) {
    return undefined;
  }
  const figma = extensions['com.figma'];
  const malformed = (detail: string) =>
    new ExportError(`${where}: $extensions["com.figma"] ${detail}`);
  if (!isRecord(figma)) {
    throw malformed('is not an object');
  }
  const { scopes, codeSyntax, hiddenFromPublishing } = figma;
  if (!isStringList(scopes)) {
    throw malformed('has no list of scopes');
  }
  if (!isStringRecord(codeSyntax)) {
    throw malformed('has no code syntax object');
  }
  if (typeof hiddenFromPublishing !== 'boolean') {
    throw malformed('does not say whether the variable is hidden from publishing');
  }
  return { scopes, codeSyntax, hiddenFromPublishing };
}

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item: unknown) => typeof item === 'string');
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((item) => typeof item === 'string');
}

/** A token whose kind may still have to come from the variable its alias points at. */
type Draft = Omit<Token, 'type'> & { readonly type: TokenType | null };

/**
 * The kind of a token. The export names the type of a number after the variable's scopes
 * (`spacing`, `borderRadius`), so a type it does not know is read from a raw value instead, and
 * a token that only aliases waits for the token it points at.
 */
function kindOf(declared: string, value: TokenValue): TokenType | null {
  if (isTokenType(declared)) {
    return declared;
  }
  for (const raw of isModeValues(value) ? Object.values(value) : [value]) {
    if (typeof raw === 'number') {
      return 'number';
    }
    if (typeof raw === 'boolean') {
      return 'boolean';
    }
    if (!isAlias(raw)) {
      return 'string';
    }
  }
  return null;
}

function walk(node: unknown, collection: Collection, path: string[], out: Draft[]): void {
  if (!isRecord(node)) {
    return;
  }
  if ('$value' in node && '$type' in node) {
    const where = `${collection}/${path.join('/')}`;
    const declared = node['$type'];
    if (typeof declared !== 'string') {
      throw new ExportError(`${where}: $type ${JSON.stringify(declared)} is not a string`);
    }
    const value = parseValue(node['$value'], where);
    const description = node['$description'];
    const figma = parseFigmaMetadata(node['$extensions'], where);
    out.push({
      collection,
      path,
      type: kindOf(declared, value),
      value,
      ...(typeof description === 'string' ? { description } : {}),
      ...(figma === undefined ? {} : { figma }),
    });
    return;
  }
  for (const [key, child] of Object.entries(node)) {
    walk(child, collection, [...path, key], out);
  }
}

/**
 * Gives every alias-only token the kind of the token its alias leads to. A chain that leads
 * nowhere keeps the kind `string`; the build reports the broken alias or the cycle itself.
 */
function settleKinds(drafts: readonly Draft[]): Token[] {
  const keyOf = (draft: Draft) => tokenKey(draft.collection, normalizedPath(draft.path));
  const kinds = new Map<string, TokenType>();
  for (const draft of drafts) {
    if (draft.type !== null) {
      kinds.set(keyOf(draft), draft.type);
    }
  }
  let settled = true;
  while (settled) {
    settled = false;
    for (const draft of drafts) {
      if (kinds.has(keyOf(draft))) {
        continue;
      }
      for (const raw of isModeValues(draft.value) ? Object.values(draft.value) : [draft.value]) {
        const target = isAlias(raw) ? parseAlias(raw) : null;
        const kind =
          target === null
            ? undefined
            : kinds.get(tokenKey(target.collection, normalizedPath(target.path)));
        if (kind !== undefined) {
          kinds.set(keyOf(draft), kind);
          settled = true;
          break;
        }
      }
    }
  }
  return drafts.map((draft) => ({ ...draft, type: kinds.get(keyOf(draft)) ?? 'string' }));
}

function walkCollection(tree: unknown, collection: Collection, file: string, out: Draft[]): void {
  if (!isRecord(tree)) {
    throw new ExportError(`${file}: the ${collection} collection is not an object`);
  }
  walk(tree, collection, [], out);
}

/** The tokens of one collection's exported tree, in document order. */
export function parseCollection(tree: unknown, collection: Collection, file: string): Token[] {
  const drafts: Draft[] = [];
  walkCollection(tree, collection, file, drafts);
  return settleKinds(drafts);
}

/**
 * Every token of a Figma file, collection by collection. The order matters: the emitters write
 * declarations in it, so it decides the order of the generated files.
 */
export function parseExports(exports: Exports): Token[] {
  if (!isRecord(exports.primitives)) {
    throw new ExportError('primitives.json is not an object');
  }
  const drafts: Draft[] = [];
  for (const collection of PRIMITIVE_COLLECTIONS) {
    walkCollection(exports.primitives[collection], collection, 'primitives.json', drafts);
  }
  walkCollection(exports.themes, 'Themes', 'themes.json', drafts);
  walkCollection(exports.surfaces, 'Surfaces', 'surfaces.json', drafts);
  if (exports.components !== undefined) {
    walkCollection(exports.components, 'Components', 'components.json', drafts);
  }
  walkCollection(exports.sizes, 'Sizes', 'sizes.json', drafts);
  return settleKinds(drafts);
}

function readExport(dir: string, file: string, required: boolean): unknown {
  const path = join(dir, file);
  let text: string;
  try {
    text = readFileSync(path, 'utf8');
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      if (!required) {
        return undefined;
      }
      throw new ExportError(
        `Missing export ${path}: export the collection from Figma with the Luckino plugin.`,
      );
    }
    throw error;
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new ExportError(`${path} is not valid JSON: ${reason}`);
  }
}

/** Reads the export files of a directory; `components.json` is optional. */
export function readExports(dir: string): Exports {
  const components = readExport(dir, 'components.json', false);
  return {
    primitives: readExport(dir, 'primitives.json', true),
    themes: readExport(dir, 'themes.json', true),
    surfaces: readExport(dir, 'surfaces.json', true),
    sizes: readExport(dir, 'sizes.json', true),
    ...(components === undefined ? {} : { components }),
  };
}
