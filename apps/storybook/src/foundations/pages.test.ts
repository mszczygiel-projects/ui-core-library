import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { ManifestToken } from '@mszczygiel-projects/ui-core-foundations';
import { describe, expect, it } from 'vitest';

import { manifest } from '../manifest.ts';
import { type Collection, pagesMap, parsePagesMap, specimen } from './pages.ts';
import { tokensOfGroup } from './specimens.ts';

const dir = import.meta.dirname;

/** The collections whose every token a page has to show. */
const REQUIRED: readonly Collection[] = ['Themes', 'Surfaces', 'Sizes'];

/**
 * The primitives a page may show: motion has no roles, so components use its primitives, and the
 * brand ramps are what a client replaces to brand the library.
 */
const SHOWN_PRIMITIVES: readonly (readonly [Collection, string])[] = [
  ['Primitives Motions', '--'],
  ['Primitives Colors', '--color-brand-'],
];

const storybookPages = pagesMap.pages.filter((page) => page.only !== 'figma');

/** The custom properties the specimens show, through their groups or the blocks they render. */
function shownNames(): Set<string> {
  const names = new Set<string>();
  for (const { groups, shows } of pagesMap.pages.flatMap((page) => page.specimens)) {
    for (const token of groups.flatMap((group) => tokensOfGroup(group))) {
      names.add(token.name);
    }
    if (shows === 'text-styles') {
      for (const style of manifest.textStyles) {
        for (const name of [...Object.values(style.properties), style.strongWeight]) {
          if (name !== undefined) {
            names.add(name);
          }
        }
      }
    }
    if (shows === 'composite-shadows') {
      for (const shadow of manifest.shadows) {
        names.add(shadow.shape);
        names.add(shadow.color);
      }
    }
  }
  return names;
}

function isExempt(token: ManifestToken): boolean {
  return pagesMap.exempt.some(
    (exemption) =>
      exemption.collections.includes(token.collection) && token.name.startsWith(exemption.prefix),
  );
}

/** The stories of a page, read from the text of its file as Storybook indexes them. */
function storiesOf(file: string): string[] {
  const path = join(dir, `${file}.stories.tsx`);
  if (!existsSync(path)) {
    return [];
  }
  return [...readFileSync(path, 'utf8').matchAll(/^export const (\w+)/gm)].flatMap((match) =>
    match[1] === undefined ? [] : [match[1]],
  );
}

/** The title of every Foundations page under src/foundations, from its Meta block. */
function mdxTitles(): (string | undefined)[] {
  return readdirSync(dir)
    .filter((file) => file.endsWith('.mdx'))
    .map(
      (file) =>
        /<Meta title="Foundations\/([^"]+)"/.exec(readFileSync(join(dir, file), 'utf8'))?.[1],
    );
}

describe('the map of the pages', () => {
  it('rejects a collection, an axis or a preview it does not know', () => {
    const page = (fields: Record<string, unknown>) => ({
      pages: [
        {
          title: 'Page',
          specimens: [
            {
              story: 'Story',
              title: 'Story',
              groups: [{ collections: ['Themes'], prefix: '--' }],
              ...fields,
            },
          ],
        },
      ],
      exempt: [],
    });
    expect(() => parsePagesMap(page({}))).not.toThrow();
    expect(() =>
      parsePagesMap(page({ groups: [{ collections: ['Colour'], prefix: '--' }] })),
    ).toThrow(/Colour/);
    expect(() => parsePagesMap(page({ axis: 'viewport' }))).toThrow(/viewport/);
    expect(() => parsePagesMap(page({ preview: 'chart' }))).toThrow(/chart/);
  });

  it('asks for the reason when only one documentation shows a specimen', () => {
    const map = {
      pages: [
        { title: 'Page', specimens: [{ story: 'S', title: 'S', groups: [], only: 'figma' }] },
      ],
      exempt: [],
    };
    expect(() => parsePagesMap(map)).toThrow(/reason/);
  });

  it('asks for the story of a specimen that Storybook shows', () => {
    const map = (only: Record<string, unknown>) => ({
      pages: [{ title: 'Page', specimens: [{ title: 'S', groups: [], ...only }] }],
      exempt: [],
    });
    expect(() => parsePagesMap(map({}))).toThrow(/story/);
    expect(() => parsePagesMap(map({ only: 'figma', reason: 'A note.' }))).not.toThrow();
  });

  it('orders every Figma page once, the hand-made ones included', () => {
    const figma = pagesMap.pages
      .filter((page) => page.only !== 'storybook')
      .map((page) => page.figma);
    expect(pagesMap.figmaOrder.toSorted()).toEqual([...figma, ...pagesMap.handMade].toSorted());
  });

  it('names the page in Figma after Storybook unless it says otherwise', () => {
    expect(pagesMap.pages.find((page) => page.title === 'Colors')?.figma).toBe('Colors');
    expect(pagesMap.pages.find((page) => page.title === 'Theming & branding')?.figma).toBe(
      'Start: branding',
    );
  });

  it('finds the specimen of a story, and fails loudly on a story it does not know', () => {
    expect(specimen('Colors', 'Roles').axis).toBe('theme');
    expect(() => specimen('Colors', 'Gradients')).toThrow(/Gradients/);
  });

  it('shows no primitive, apart from those of motion and the brand ramps', () => {
    const primitives = pagesMap.pages.flatMap((page) =>
      page.specimens.flatMap((specimen) =>
        specimen.groups.flatMap((group) =>
          group.collections
            .filter(
              (collection) =>
                collection.startsWith('Primitives') &&
                !SHOWN_PRIMITIVES.some(
                  ([shown, prefix]) => shown === collection && group.prefix.startsWith(prefix),
                ),
            )
            .map((collection) => `${page.title} / ${specimen.title}: ${collection}`),
        ),
      ),
    );
    expect(primitives).toEqual([]);
  });

  it('gives every page a name of its own in both documentations', () => {
    const titles = pagesMap.pages.map((page) => page.title);
    const figma = pagesMap.pages
      .filter((page) => page.only !== 'storybook')
      .map((page) => page.figma);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(figma).size).toBe(figma.length);
  });
});

describe('the pages against the manifest', () => {
  it('shows at least one token in every group', () => {
    const empty = pagesMap.pages.flatMap((page) =>
      page.specimens.flatMap((specimen) =>
        specimen.groups
          .filter((group) => tokensOfGroup(group).length === 0)
          .map((group) => `${page.title} / ${specimen.title}: ${group.prefix}`),
      ),
    );
    expect(empty).toEqual([]);
  });

  it('shows every token of Themes, Surfaces and Sizes, apart from the exemptions', () => {
    const shown = shownNames();
    const missing = manifest.tokens
      .filter((token) => REQUIRED.includes(token.collection) && token.hidden !== true)
      .filter((token) => !shown.has(token.name) && !isExempt(token))
      .map((token) => `${token.collection}: ${token.name}`);
    expect(missing).toEqual([]);
  });

  it('keeps no exemption that matches nothing', () => {
    const stale = pagesMap.exempt
      .filter(
        (exemption) =>
          !manifest.tokens.some(
            (token) =>
              exemption.collections.includes(token.collection) &&
              token.name.startsWith(exemption.prefix),
          ),
      )
      .map((exemption) => exemption.prefix);
    expect(stale).toEqual([]);
  });
});

describe('the pages against Storybook', () => {
  it('has one map entry for every MDX page, and no other Storybook page', () => {
    expect(storybookPages.map((page) => page.title).toSorted()).toEqual(mdxTitles().toSorted());
  });

  it('shows each specimen as a story of its page, in the same order', () => {
    for (const page of storybookPages) {
      const specimens = page.specimens.filter((specimen) => specimen.only !== 'figma');
      expect(page.file, page.title).toBeDefined();
      expect(storiesOf(page.file ?? ''), page.title).toEqual(
        specimens.map((specimen) => specimen.story),
      );
    }
  });
});
