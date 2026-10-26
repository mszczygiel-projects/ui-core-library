import { join } from 'node:path';

import { expect, it } from 'vitest';

import { publicDeclarations } from './lib/api.ts';

// The declarations of every subpath are public API, so every change of a name or a signature has
// to show in review as a change of api/. After an intended change, `pnpm shared:snapshot`
// rewrites it.
it('declares the public API recorded in api/', async () => {
  const declarations = publicDeclarations(join(import.meta.dirname, '..'));
  for (const [file, text] of declarations) {
    await expect(text).toMatchFileSnapshot(join('..', 'api', file));
  }
});
