import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ExportError, parseCollection, parseExports, readExports } from './parse.ts';
import { EXPORTS_DIR } from './tokens.fixture.ts';

const primitives = {
  'Primitives Colors': { gray: { 500: { $value: '#6b7280', $type: 'color' } } },
  'Primitives Sizes': { spacing: { 4: { $value: 16, $type: 'number' } } },
  'Primitives Motions': {},
  'Primitives Shadows': {},
};

describe('parseCollection', () => {
  it('collects every leaf of a nested tree with its path', () => {
    const tokens = parseCollection(
      {
        brand: {
          primary: { $value: '#256ce1', $type: 'color' },
          secondary: { $value: '#1e5ac8', $type: 'color' },
        },
      },
      'Primitives Colors',
      'primitives.json',
    );
    expect(tokens).toEqual([
      {
        collection: 'Primitives Colors',
        path: ['brand', 'primary'],
        type: 'color',
        value: '#256ce1',
      },
      {
        collection: 'Primitives Colors',
        path: ['brand', 'secondary'],
        type: 'color',
        value: '#1e5ac8',
      },
    ]);
  });

  it('keeps one value per mode and the description', () => {
    const [themed] = parseCollection(
      {
        color: {
          text: {
            $value: { Default: '#111', Dark: '#eee' },
            $type: 'color',
            $description: 'Body text.',
          },
        },
      },
      'Themes',
      'themes.json',
    );
    expect(themed?.value).toEqual({ Default: '#111', Dark: '#eee' });
    expect(themed?.description).toBe('Body text.');
  });

  it('reads the kind of a token from its value when the $type names its scopes', () => {
    const tokens = parseCollection(
      {
        gap: { $value: { Mobile: 8, Desktop: 12 }, $type: 'spacing' },
        font: { $value: 'Inter', $type: 'fontFamilies' },
        uppercase: { $value: true, $type: 'textCase' },
      },
      'Sizes',
      'sizes.json',
    );
    expect(tokens.map((t) => t.type)).toEqual(['number', 'string', 'boolean']);
  });

  it('gives an alias-only token the kind of the token it points at', () => {
    const tokens = parseExports({
      primitives: {
        ...primitives,
        'Primitives Sizes': { radius: { sm: { $value: 4, $type: 'borderRadius' } } },
      },
      themes: {},
      surfaces: {},
      sizes: {
        radius: {
          sm: { $value: { Mobile: '{Primitives Sizes.radius.sm}' }, $type: 'borderRadius' },
        },
      },
    });
    expect(tokens.find((t) => t.collection === 'Sizes')?.type).toBe('number');
  });

  it('reads the Figma metadata that the export writes under $extensions', () => {
    const [heading] = parseCollection(
      {
        font: {
          heading: {
            $value: 'Inter',
            $type: 'fontFamily',
            $extensions: {
              'com.figma': {
                variableId: 'VariableID:779:3',
                collectionId: 'VariableCollectionId:779:2',
                scopes: ['FONT_FAMILY'],
                codeSyntax: { WEB: 'var(--font-heading)' },
                hiddenFromPublishing: false,
              },
            },
          },
        },
      },
      'Themes',
      'themes.json',
    );
    expect(heading?.figma).toEqual({
      scopes: ['FONT_FAMILY'],
      codeSyntax: { WEB: 'var(--font-heading)' },
      hiddenFromPublishing: false,
    });
  });

  it('has no Figma metadata for an export made without it', () => {
    const tokens = parseCollection(
      {
        plain: { $value: 4, $type: 'number' },
        other: { $value: 4, $type: 'number', $extensions: { 'org.example': { note: 'x' } } },
      },
      'Sizes',
      'sizes.json',
    );
    expect(tokens.map((t) => t.figma)).toEqual([undefined, undefined]);
  });

  it('rejects Figma metadata it cannot read', () => {
    const withFigma = (figma: unknown) => ({
      gap: { $value: 4, $type: 'number', $extensions: { 'com.figma': figma } },
    });
    const metadata = { scopes: ['GAP'], codeSyntax: {}, hiddenFromPublishing: false };
    expect(() =>
      parseCollection(withFigma({ ...metadata, scopes: 'GAP' }), 'Sizes', 'sizes.json'),
    ).toThrow('Sizes/gap: $extensions["com.figma"] has no list of scopes');
    expect(() =>
      parseCollection(withFigma({ ...metadata, codeSyntax: { WEB: 4 } }), 'Sizes', 'sizes.json'),
    ).toThrow('Sizes/gap: $extensions["com.figma"] has no code syntax object');
    expect(() =>
      parseCollection(
        withFigma({ ...metadata, hiddenFromPublishing: 'no' }),
        'Sizes',
        'sizes.json',
      ),
    ).toThrow('Sizes/gap: $extensions["com.figma"] does not say whether');
  });

  it('rejects a $type that is not a string', () => {
    expect(() => parseCollection({ size: { $value: 4, $type: 4 } }, 'Sizes', 'sizes.json')).toThrow(
      new ExportError('Sizes/size: $type 4 is not a string'),
    );
  });

  it('rejects a mode whose value is not a string, number or boolean', () => {
    expect(() =>
      parseCollection(
        { gap: { $value: { Mobile: { nested: 1 } }, $type: 'number' } },
        'Sizes',
        'sizes.json',
      ),
    ).toThrow('Sizes/gap: the value of mode "Mobile" is not a string, number or boolean');
  });

  it('rejects a collection that is not an object', () => {
    expect(() => parseCollection(undefined, 'Primitives Shadows', 'primitives.json')).toThrow(
      'primitives.json: the Primitives Shadows collection is not an object',
    );
  });
});

describe('parseExports', () => {
  const themes = { color: { text: { $value: { Light: '#111' }, $type: 'color' } } };
  const surfaces = {
    color: { text: { $value: { Default: '{Themes.color.text}' }, $type: 'color' } },
  };
  const sizes = { gap: { $value: { Mobile: 8, Desktop: 12 }, $type: 'number' } };

  it('reads the collections in emission order, Components before Sizes', () => {
    const tokens = parseExports({
      primitives,
      themes,
      surfaces,
      sizes,
      components: { button: { gap: { $value: '{Sizes.gap}', $type: 'number' } } },
    });
    expect(tokens.map((t) => t.collection)).toEqual([
      'Primitives Colors',
      'Primitives Sizes',
      'Themes',
      'Surfaces',
      'Components',
      'Sizes',
    ]);
  });

  it('builds without the optional Components export', () => {
    const collections = parseExports({ primitives, themes, surfaces, sizes }).map(
      (t) => t.collection,
    );
    expect(collections).not.toContain('Components');
  });

  it('requires all four primitive collections', () => {
    const { 'Primitives Motions': _motions, ...withoutMotions } = primitives;
    expect(() => parseExports({ primitives: withoutMotions, themes, surfaces, sizes })).toThrow(
      'primitives.json: the Primitives Motions collection is not an object',
    );
  });
});

describe('readExports', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'ui-core-exports-'));
    for (const [file, content] of Object.entries({
      'primitives.json': primitives,
      'themes.json': {},
      'surfaces.json': {},
      'sizes.json': {},
    })) {
      writeFileSync(join(dir, file), JSON.stringify(content));
    }
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('leaves out the optional exports that are missing', () => {
    const exports = readExports(dir);
    expect(exports).not.toHaveProperty('components');
  });

  it('names a missing required export and how to produce it', () => {
    rmSync(join(dir, 'sizes.json'));
    expect(() => readExports(dir)).toThrow(/Missing export .*sizes\.json: export the collection/);
  });

  it('rejects an export that is not valid JSON', () => {
    writeFileSync(join(dir, 'themes.json'), '{ "color": ');
    expect(() => readExports(dir)).toThrow(/themes\.json is not valid JSON/);
  });
});

describe('the exports of the library', () => {
  const tokens = parseExports(readExports(EXPORTS_DIR));

  it('hold every collection', () => {
    const count = (collection: string) => tokens.filter((t) => t.collection === collection).length;
    expect(tokens).toHaveLength(1345);
    expect(count('Primitives Colors')).toBe(116);
    expect(count('Themes')).toBe(329);
    expect(count('Surfaces')).toBe(63);
    expect(count('Components')).toBe(633);
    expect(count('Sizes')).toBe(80);
  });
});
