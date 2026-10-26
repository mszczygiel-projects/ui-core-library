import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { specs } from '@mszczygiel-projects/ui-core-shared/components';
import { describe, expect, it } from 'vitest';

import { namesOf } from './names.ts';
import { componentFiles, TODO } from './templates.ts';

const root = join(import.meta.dirname, '..', '..', '..', '..');

/** The files a done component still marks as unfilled. */
function unfilled(): string[] {
  return specs
    .filter((spec) => spec.status === 'done')
    .flatMap((spec) => {
      const options = { name: spec.name, category: spec.category, figma: spec.figma ?? undefined };
      return Object.keys({
        ...componentFiles(namesOf(options)),
        ...componentFiles(namesOf({ ...options, form: true })),
      });
    })
    .filter((path) => existsSync(join(root, path)))
    .filter((path) => readFileSync(join(root, path), 'utf-8').includes(TODO));
}

describe('a done component', () => {
  it(`has no ${TODO} left in its files`, () => {
    expect(unfilled()).toEqual([]);
  });
});
