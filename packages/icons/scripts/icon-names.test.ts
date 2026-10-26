import { join } from 'node:path';

import { expect, it } from 'vitest';

import { buildDirectory } from '../src/build/build.ts';

// The export names are public API, so every rename, addition and removal has to show in review as
// a change of icon-names.txt. After an intended change, `pnpm icons:snapshot` rewrites it.
it('exports the names listed in icon-names.txt', async () => {
  const { icons, errors } = buildDirectory(join(import.meta.dirname, '..', 'figma'), {
    strict: true,
  });
  expect(errors).toEqual([]);
  const names = icons.map((icon) => icon.exportName).sort();
  await expect(`${names.join('\n')}\n`).toMatchFileSnapshot('../icon-names.txt');
});
