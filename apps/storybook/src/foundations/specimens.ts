import type { ManifestAxis, ManifestToken } from '@mszczygiel-projects/ui-core-foundations';

import { manifest } from '../manifest.ts';
import type { Context } from '../tokens.ts';
import type { Specimen, TokenGroup } from './pages.ts';

/** The tokens of some collections whose custom property starts with a prefix, hidden ones aside. */
export function tokensOf(
  collections: readonly ManifestToken['collection'][],
  prefix: string,
): readonly ManifestToken[] {
  return manifest.tokens.filter(
    (token) =>
      collections.includes(token.collection) &&
      token.name.startsWith(prefix) &&
      token.hidden !== true,
  );
}

/** The tokens of a group of the map of the pages, without the prefixes it leaves out. */
export function tokensOfGroup(group: TokenGroup): readonly ManifestToken[] {
  return tokensOf(group.collections, group.prefix).filter(
    (token) => !group.exclude.some((prefix) => token.name.startsWith(prefix)),
  );
}

/** The tokens of every group of a specimen, in the order of its groups. */
export function tokensOfSpecimen(specimen: Specimen): readonly ManifestToken[] {
  return specimen.groups.flatMap((group) => tokensOfGroup(group));
}

/** One context per mode of an axis, such as the light and the dark theme; none without one. */
export function contextsOf(axis: ManifestAxis | undefined): Context[] | undefined {
  return axis === undefined ? undefined : manifest.modes[axis].map((mode) => ({ [axis]: mode }));
}
