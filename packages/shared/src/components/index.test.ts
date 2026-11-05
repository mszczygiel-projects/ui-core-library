import { describe, expect, it } from 'vitest';

import { specs } from './index.ts';

describe('a part of another component', () => {
  for (const part of specs.filter((spec) => spec.partOf !== undefined)) {
    it(`${part.name} belongs to a component of its category and has no stories`, () => {
      const parent = specs.find((spec) => spec.name === part.partOf);
      expect({
        category: parent?.category,
        parentIsPart: parent?.partOf !== undefined,
        stories: part.stories,
      }).toEqual({ category: part.category, parentIsPart: false, stories: [] });
    });
  }
});
