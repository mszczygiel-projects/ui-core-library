import { join } from 'node:path';

import { expect, it } from 'vitest';

import { buildTokens } from '../src/pipeline/build.ts';
import { parseExports, readExports } from '../src/pipeline/parse.ts';
import { tokenNames } from '../src/pipeline/snapshot.ts';

// Token names are public API, so every rename, addition and removal has to show in review as a
// change of token-names.txt. After an intended change, `pnpm tokens:snapshot` rewrites it.
it('emits the names listed in token-names.txt', async () => {
  const tokens = parseExports(readExports(join(import.meta.dirname, '..', 'figma')));
  const { files, errors } = buildTokens(tokens, { strict: false, autoDarkMode: true });
  expect(errors).toEqual([]);
  if (files === null) {
    return;
  }
  await expect(`${tokenNames(files, tokens).join('\n')}\n`).toMatchFileSnapshot(
    '../token-names.txt',
  );
});
