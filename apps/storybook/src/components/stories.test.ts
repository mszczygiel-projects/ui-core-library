import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { pageOf, specs } from './catalog.ts';

const STORY = /^export const (\w+): Story\b/gm;

/** The stories a story file exports, read from its text: the file needs a browser to load. */
function storiesIn(file: string): string[] {
  return [...readFileSync(file, 'utf8').matchAll(STORY)].map((match) => match[1] ?? '');
}

describe('the stories of every component', () => {
  for (const spec of specs) {
    const folder = join(import.meta.dirname, spec.category.toLowerCase());
    it(`are the stories of the specification of ${spec.name}, in both frameworks`, () => {
      expect({
        react: storiesIn(join(folder, `${spec.name}.react.stories.tsx`)),
        webComponents: storiesIn(join(folder, `${spec.name}.wc.stories.tsx`)),
      }).toEqual({ react: spec.stories, webComponents: spec.stories });
    });

    it(`give ${spec.name} its documentation page`, () => {
      const page = readFileSync(join(folder, `${spec.name}.mdx`), 'utf8');
      expect(page).toContain(`<Meta title="Components/${spec.category}/${spec.name}/Docs" />`);
      expect(pageOf(spec)).toBe(
        `components-${spec.category.toLowerCase()}-${spec.name.toLowerCase()}-docs--docs`,
      );
    });
  }
});
