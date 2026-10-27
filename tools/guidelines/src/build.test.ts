import { specs } from '@mszczygiel-projects/ui-core-shared/components';
import { describe, expect, it } from 'vitest';

import { buildGuidelines, LIBRARY_LIMIT, pageOf, sizeOf } from './build.ts';
import { componentFile, componentGuideline } from './ui-library.ts';

const guidelines = buildGuidelines();

describe('the guidelines of the Figma libraries', () => {
  it.each(Object.entries(guidelines))('fit Figma’s limit in %s', (_library, files) => {
    expect(sizeOf(files)).toBeLessThanOrEqual(LIBRARY_LIMIT);
  });

  it.each(specs.filter((spec) => spec.status === 'done').map((spec) => [spec.name, spec] as const))(
    'list exactly the properties of the component set of %s, with their values',
    (_name, spec) => {
      const text = guidelines['ui-library'][componentFile(spec)] ?? '';
      const rows = [...text.matchAll(/^\| `(\w+)` \| (.+?) \| `(\w+)` \|/gm)].map(
        ([, name, values, fallback]) => [name, values, fallback],
      );
      const listed = (options: readonly string[]) =>
        options.map((option) => `\`${option}\``).join(', ');
      expect(rows).toEqual([
        ...Object.entries(spec.options)
          .filter(([name]) => !spec.design.codeOnly.includes(name))
          .map(([name, { options, default: fallback }]) => [name, listed(options), fallback]),
        ...spec.design.flags.map((name) => [name, '`false`, `true`', 'false']),
        ...spec.design.booleans.map((name) => [name, '`false`, `true`', 'false']),
        ...Object.entries(spec.design.previews).map(([name, { options, default: fallback }]) => [
          name,
          listed(options),
          fallback,
        ]),
      ]);
      for (const name of spec.design.codeOnly) {
        expect(text).not.toMatch(new RegExp(`^\\| \`${name}\``, 'm'));
      }
      expect(guidelines['ui-library']['overview.md']).toContain(componentFile(spec));
    },
  );

  it('name the roles of the foundations and the components of the icons', () => {
    expect(guidelines.foundations['colors.md']).toContain('`color/text/primary`');
    expect(guidelines.foundations['typography.md']).toContain('`Heading/H1`');
    expect(guidelines.icons['overview.md']).toContain('`icon/chevron-down`');
  });

  it('send the shared properties of a component with a nested field to that field', () => {
    const spec = specs.find((candidate) => candidate.design.nested !== undefined);
    if (spec === undefined) {
      throw new Error('No specification with a nested component set');
    }
    const text = componentGuideline({ spec, page: pageOf(spec) });
    expect(text).toContain(
      '| `variant` | `outline`, `filled`, `underlined` | `outline` | On the nested `TextField`. |',
    );
    expect(text).toContain('the layer `field`');
  });

  it('stop when a component page lacks a section they carry', () => {
    const spec = specs[0];
    if (spec === undefined) {
      throw new Error('No specification');
    }
    const page = pageOf(spec).replace('## Usage', '## How to use it');
    expect(() => componentGuideline({ spec, page })).toThrow(/lacks the sections Usage/);
  });
});
