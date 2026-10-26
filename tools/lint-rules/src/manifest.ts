import type { ManifestToken, TokenManifest } from '@mszczygiel-projects/ui-core-foundations';
import manifestJson from '@mszczygiel-projects/ui-core-foundations/tokens.json' with { type: 'json' };

/** The manifest of the tokens, from the build of the foundations package. */
export const manifest: TokenManifest = manifestJson;

/** Every custom property of `tokens.css`, by its name. */
export const tokensByName: ReadonlyMap<string, ManifestToken> = new Map(
  manifest.tokens.map((token) => [token.name, token]),
);

/**
 * Whether a component may read a token: the Components layer, the roles of the focus ring and
 * the motion primitives. Every other role and primitive reaches a component through a
 * token of its own, so that a client changes the component through its tokens alone.
 */
export function isReadableByComponents(token: ManifestToken): boolean {
  if (token.collection === 'Components' || token.collection === 'Primitives Motions') {
    return true;
  }
  return /^(?:color\/ring\/|ring\/|stroke\/ring$)/.test(token.path);
}
