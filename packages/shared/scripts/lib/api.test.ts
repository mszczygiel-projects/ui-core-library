import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { diffDeclarations, publicDeclarations, reachableDeclarations } from './api.ts';

const root = join(import.meta.dirname, '../..');

describe('publicDeclarations', () => {
  it('declares every subpath the package exports, without comments', () => {
    const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
      exports: Record<string, { types: string } | string>;
    };
    const files = Object.values(manifest.exports).flatMap((target) =>
      typeof target === 'string' ? [] : [target.types.replace(/^\.\/dist\//, '')],
    );
    const declarations = publicDeclarations(root);
    expect([...declarations.keys()]).toEqual(expect.arrayContaining(files));
    for (const text of declarations.values()) {
      expect(text).toMatch(/^export /m);
      expect(text).not.toMatch(/\/\*|\/\//);
    }
  });
});

describe('reachableDeclarations', () => {
  const emitted = new Map([
    [
      'text.d.ts',
      "export { weight } from './internal.ts';\nexport declare function foldText(text: string): string;\n",
    ],
    [
      'internal.d.ts',
      "import type { Weight } from './weights/types.ts';\nexport declare function weight(text: string): Weight;\n",
    ],
    ['weights/types.d.ts', 'export type Weight = number;\n'],
    [
      'date.d.ts',
      "export * as calendar from './calendar.js';\nexport declare function at(day: import('./day.ts').Day): string;\n",
    ],
    ['calendar.d.ts', "export { at } from './date.ts';\n"],
    ['day.d.ts', 'export type Day = string;\n'],
    ['private.d.ts', 'export declare function hidden(): void;\n'],
  ]);

  it('follows the imports and re-exports of a subpath to the files it reaches', () => {
    expect([...reachableDeclarations(['text.d.ts'], emitted).keys()]).toEqual([
      'text.d.ts',
      'internal.d.ts',
      'weights/types.d.ts',
    ]);
  });

  it('follows a namespace re-export and a type imported inline, each file once', () => {
    expect([...reachableDeclarations(['date.d.ts'], emitted).keys()]).toEqual([
      'date.d.ts',
      'calendar.d.ts',
      'day.d.ts',
    ]);
  });

  it('fails on a file that the sources do not emit', () => {
    expect(() => reachableDeclarations(['missing.d.ts'], emitted)).toThrow(/missing\.d\.ts/);
  });
});

describe('diffDeclarations', () => {
  const addDays = 'export declare function addDays(date: string, days: number): string;';

  it('finds no change in the same declarations', () => {
    const declarations = new Map([['date.d.ts', `${addDays}\n`]]);
    expect(diffDeclarations(declarations, new Map(declarations))).toEqual([]);
  });

  it('names the lines removed and added in a changed file', () => {
    const changed = addDays.replace('days: number', 'days: number, weekdays: boolean');
    expect(
      diffDeclarations(
        new Map([['date.d.ts', `${addDays}\n`]]),
        new Map([['date.d.ts', `${changed}\n`]]),
      ),
    ).toEqual([{ file: 'date.d.ts', removed: [addDays], added: [changed] }]);
  });

  it('names a declaration that moved, as removed in one place and added in another', () => {
    const clamp = 'export declare function clamp(value: number, min: number, max: number): number;';
    const declarations = [
      clamp,
      'export declare function roundTo(value: number, decimals: number): number;',
      'export declare function stepValue(value: number | null, direction: 1 | -1): number;',
    ];
    const moved = [...declarations.slice(1), clamp];
    expect(
      diffDeclarations(
        new Map([['numeric.d.ts', `${declarations.join('\n')}\n`]]),
        new Map([['numeric.d.ts', `${moved.join('\n')}\n`]]),
      ),
    ).toEqual([{ file: 'numeric.d.ts', removed: [clamp], added: [clamp] }]);
  });

  it('reports a subpath that was added or removed', () => {
    const declarations = new Map([['text.d.ts', 'export type MatchMode = "contains";\n']]);
    expect(diffDeclarations(new Map(), declarations)).toEqual([
      { file: 'text.d.ts', removed: [], added: ['export type MatchMode = "contains";'] },
    ]);
    expect(diffDeclarations(declarations, new Map())).toEqual([
      { file: 'text.d.ts', removed: ['export type MatchMode = "contains";'], added: [] },
    ]);
  });
});
