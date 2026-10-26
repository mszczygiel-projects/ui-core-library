import { join } from 'node:path';

import type { Collection, Token, TokenType, TokenValue } from './model.ts';

/** The committed exports of the library's own Figma file. */
export const EXPORTS_DIR = join(import.meta.dirname, '../../figma');

/** A token for tests; the path is written as in Figma, segments separated by `/`. */
export function token(
  collection: Collection,
  path: string,
  value: TokenValue,
  type: TokenType = 'color',
): Token {
  return { collection, path: path.split('/'), type, value };
}
