import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getStorySortParameter } from 'storybook/internal/csf-tools';
import { describe, expect, it } from 'vitest';

import { pagesMap } from './foundations/pages.ts';

const root = join(import.meta.dirname, '..');

/** The order of the pages, as Storybook reads it from the text of .storybook/preview.tsx. */
function storySort(): unknown {
  const code = readFileSync(join(root, '.storybook', 'preview.tsx'), 'utf8');
  const sort: unknown = getStorySortParameter(code);
  return sort;
}

function isStrings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/** The order of the pages under a section of the sidebar, such as Foundations. */
function orderUnder(section: string): unknown {
  const sort = storySort();
  if (typeof sort !== 'object' || sort === null || !('order' in sort)) {
    return undefined;
  }
  const order: unknown = sort.order;
  if (!Array.isArray(order)) {
    return undefined;
  }
  const index = order.indexOf(section);
  return index === -1 ? undefined : (order[index + 1] as unknown);
}

/** The pages listed under Foundations in the order. */
function orderedPages(): string[] | undefined {
  const pages = orderUnder('Foundations');
  return isStrings(pages) ? pages : undefined;
}

describe('the order of the pages', () => {
  it('is written where Storybook reads it', () => {
    expect(storySort()).toEqual({
      order: ['Guides', expect.any(Array), 'Foundations', expect.any(Array)],
    });
  });

  // pages.test.ts checks that the map names every MDX page, and nothing else.
  it('follows the map of the pages', () => {
    expect(orderedPages()).toEqual(
      pagesMap.pages.filter((page) => page.only !== 'figma').map((page) => page.title),
    );
  });
});
