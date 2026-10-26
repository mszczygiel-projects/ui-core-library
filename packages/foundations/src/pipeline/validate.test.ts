import { describe, expect, it } from 'vitest';

import type { Token } from './model.ts';
import { parseExports, readExports } from './parse.ts';
import { buildRegistry } from './resolve.ts';
import { EXPORTS_DIR, token } from './tokens.fixture.ts';
import {
  checkLayoutConstants,
  checkPrimitiveAliases,
  findErrors,
  findMetadataViolations,
  findNameCollisions,
  findViolations,
  judge,
  parseExceptions,
  type Violation,
} from './validate.ts';

const spacing = token('Primitives Sizes', 'spacing/4', 16, 'number');
const gray = token('Primitives Colors', 'gray/900', '#151419');

function ids(violations: readonly Violation[]): string[] {
  return violations.map((v) => v.id);
}

describe('findViolations — layers', () => {
  it('lets each layer alias its own layer and the layers before it', () => {
    const role = token('Themes', 'color/text', { Light: '{Primitives Colors.gray.900}' });
    const surface = token('Surfaces', 'color/text', { Default: '{Themes.color.text}' });
    const ramp = token('Sizes', 'gap', { Mobile: '{Primitives Sizes.spacing.4}' }, 'number');
    const chip = token('Components', 'chip/color', '{Surfaces.color.text}');
    const chipGap = token('Components', 'chip/gap', '{Sizes.gap}', 'number');
    const label = token('Components', 'chip/label/gap', '{Components.chip.gap}', 'number');
    expect(findViolations([gray, spacing, role, surface, ramp, chip, chipGap, label])).toEqual([]);
  });

  it('keeps Themes and Sizes apart, since each holds its own axes', () => {
    const ramp = token('Sizes', 'gap', { Mobile: '{Primitives Sizes.spacing.4}' }, 'number');
    const radius = token('Themes', 'radius/sm', { Light: '{Sizes.gap}' }, 'number');
    const width = token('Themes', 'stroke/border', { Light: 1 }, 'number');
    const border = token('Sizes', 'control/border', { Mobile: '{Themes.stroke.border}' }, 'number');
    expect(ids(findViolations([spacing, ramp, radius, width, border]))).toEqual([
      'layers Sizes/control/border -> Themes/stroke/border',
      'layers Themes/radius/sm -> Sizes/gap',
      'raw-value Themes/stroke/border',
    ]);
  });

  it('reports a component token aliasing a primitive', () => {
    const radius = token('Components', 'popover/radius', '{Primitives Sizes.spacing.4}', 'number');
    expect(ids(findViolations([spacing, radius]))).toEqual([
      'layers Components/popover/radius -> Primitives Sizes/spacing/4',
    ]);
  });

  it('lets the colour roles alias the brand ramps among the primitives', () => {
    const ramp = token('Primitives Colors', 'brand/primary/800', '#173f8f');
    const role = token('Themes', 'color/brand/primary/default', {
      Light: '{Primitives Colors.brand.primary.800}',
      Dark: '{Primitives Colors.brand.primary.800}',
    });
    expect(findViolations([ramp, role])).toEqual([]);
  });

  it('lets a component token alias any role of Themes, flags included', () => {
    const uppercase = token('Themes', 'text-uppercase/button', { Light: true }, 'boolean');
    const font = token('Themes', 'font/body', { Light: 'Inter' }, 'string');
    const style = token(
      'Components',
      'button/text-uppercase',
      '{Themes.text-uppercase.button}',
      'boolean',
    );
    const family = token('Components', 'button/font-family', '{Themes.font.body}', 'string');
    expect(findViolations([uppercase, font, style, family])).toEqual([]);
  });

  it('reports an alias against the direction of the layers', () => {
    const backwards = token('Themes', 'color/text', { Light: '{Surfaces.color.text}' });
    const primitive = token('Primitives Colors', 'gray/100', '{Themes.color.text}');
    expect(ids(findViolations([backwards, primitive]))).toEqual([
      'layers Primitives Colors/gray/100 -> Themes/color/text',
      'layers Themes/color/text -> Surfaces/color/text',
    ]);
  });

  it('lets a layout constant alias a primitive', () => {
    const width = token('Components', 'dialog/max-width', '{Primitives Sizes.spacing.4}', 'number');
    expect(findViolations([spacing, width], new Set(['Components/dialog/max-width']))).toEqual([]);
  });
});

describe('findViolations — raw values and names', () => {
  it('reports a raw value outside Primitives and the brand values, unless it is a layout constant', () => {
    const brandFont = token('Themes', 'font/body', { Light: 'Inter' }, 'string');
    const flag = token('Themes', 'typography/link/text-underline', { Light: true }, 'boolean');
    const ring = token('Themes', 'ring/width', { Light: 2 }, 'number');
    const font = token('Themes', 'typography/body/font-family', { Light: 'Inter' }, 'string');
    const arrow = token('Components', 'popover/arrow', 8, 'number');
    expect(
      ids(
        findViolations(
          [gray, brandFont, flag, ring, font, arrow],
          new Set(['Components/popover/arrow']),
        ),
      ),
    ).toEqual(['raw-value Themes/typography/body/font-family']);
  });

  it('reports a variable whose name the export changes, once for all its aliases', () => {
    const lineHeight = token('Primitives Sizes', 'text/sm-line-height', 20, 'number');
    const body = token(
      'Sizes',
      'typography/body/line-height',
      {
        Mobile: '{Primitives Sizes.text.sm--line-height}',
        Desktop: '{Primitives Sizes.text.sm--line-height}',
      },
      'number',
    );
    const caption = token(
      'Sizes',
      'typography/caption/line-height',
      { Mobile: '{Primitives Sizes.text.sm--line-height}' },
      'number',
    );
    expect(ids(findViolations([lineHeight, body, caption]))).toEqual([
      'alias-name Primitives Sizes/text/sm--line-height',
    ]);
  });
});

describe('findMetadataViolations', () => {
  function described(t: Token, description = 'A role.'): Token {
    return { ...t, description };
  }

  function exported(t: Token, scopes: string[], web?: string): Token {
    return {
      ...t,
      figma: {
        scopes,
        codeSyntax: web === undefined ? {} : { WEB: web },
        hiddenFromPublishing: false,
      },
    };
  }

  const role = token('Themes', 'color/text/primary', { Light: '#111111', Dark: '#eeeeee' });
  const copy = token('Themes', 'color/on-subtle/text/primary', { Light: '#000000' });
  const surface = token('Surfaces', 'color/text/primary', {
    Default: '{Themes.color.text.primary}',
    Subtle: '{Themes.color.on-subtle.text.primary}',
  });

  it('accepts variables whose metadata follows the rules', () => {
    expect(
      findMetadataViolations([
        exported(described(role), [], 'var(--color-text-primary)'),
        exported(copy, [], 'var(--color-on-subtle-text-primary)'),
        exported(
          described(surface),
          ['STROKE_COLOR', 'TEXT_FILL', 'SHAPE_FILL'],
          'var(--color-text-primary)',
        ),
        exported(spacing, ['GAP', 'WIDTH_HEIGHT'], 'var(--spacing-4)'),
      ]),
    ).toEqual([]);
  });

  it('reports a role without a description, but not a copy per surface', () => {
    expect(ids(findMetadataViolations([role, copy, described(surface)]))).toEqual([
      'description Themes/color/text/primary',
      'metadata',
    ]);
  });

  it('reports exports made without the Figma metadata once', () => {
    expect(findMetadataViolations([spacing])).toEqual([
      expect.objectContaining({ rule: 'metadata', id: 'metadata' }),
    ]);
  });

  it('reports scopes, code syntax and missing metadata variable by variable', () => {
    const gap = token('Sizes', 'layout/gap/stack/md', { Mobile: '{Primitives Sizes.spacing.4}' });
    const mystery = token('Components', 'button/mystery', '{Sizes.layout.gap.stack.md}', 'number');
    const uppercase = token('Themes', 'text-uppercase/button', { Light: true }, 'boolean');
    const violations = findMetadataViolations([
      exported(spacing, ['ALL_SCOPES'], 'var(--spacing-4)'),
      exported({ ...described(gap), type: 'number' }, ['GAP'], 'var(--duration-0)'),
      exported(mystery, [], 'var(--button-mystery)'),
      exported(described(uppercase), ['ALL_SCOPES'], 'var(--text-uppercase-button)'),
      gray,
    ]);
    expect(violations.map((v) => v.message)).toEqual([
      'Sizes/layout/gap/stack/md shows var(--duration-0) in Dev Mode instead of var(--layout-gap-stack-md)',
      'Primitives Colors/gray/900 has no Figma metadata in the export',
      'Components/button/mystery matches no scope rule; give its kind of token a rule',
      'Primitives Sizes/spacing/4 is offered in ALL_SCOPES; its scope rule gives it GAP, WIDTH_HEIGHT',
    ]);
  });
});

describe('findErrors', () => {
  it('reports an alias to a variable that does not exist', () => {
    const broken = token('Themes', 'color/text', {
      Default: '{Primitives Colors.gray.950}',
      Dark: '{Unknown.x}',
    });
    expect(findErrors([broken], buildRegistry([broken]))).toEqual([
      'Themes/color/text aliases {Primitives Colors.gray.950}, which does not exist',
      'Themes/color/text aliases {Unknown.x}, which does not exist',
    ]);
  });

  it('reports a cycle', () => {
    const loop = token('Themes', 'color/loop', { Default: '{Themes.color.loop}' });
    expect(findErrors([loop], buildRegistry([loop]))).toEqual([
      'Alias cycle: Themes/color/loop → Themes/color/loop',
    ]);
  });

  it('reports a semantic token that would take the name of a primitive', () => {
    const shadowing = token('Sizes', 'spacing/4', { Mobile: 16 }, 'number');
    expect(findNameCollisions([spacing, shadowing])).toEqual([
      { name: '--spacing-4', claimants: ['Primitives Sizes/spacing/4', 'Sizes/spacing/4'] },
    ]);
    expect(findErrors([spacing, shadowing], buildRegistry([spacing, shadowing]))).toHaveLength(1);
  });

  it('lets semantic collections share a name, which is how scopes override each other', () => {
    expect(
      findNameCollisions([
        token('Themes', 'color/text', { Default: '#111' }),
        token('Surfaces', 'color/text', { Default: '#111', Inverse: '#fff' }),
        token('Components', 'color/text', '{Surfaces.color.text}'),
      ]),
    ).toEqual([]);
  });

  it('finds nothing in the library exports', () => {
    const tokens = parseExports(readExports(EXPORTS_DIR));
    expect(findErrors(tokens, buildRegistry(tokens))).toEqual([]);
  });
});

describe('checkLayoutConstants', () => {
  const width = token('Components', 'dialog/max-width', 640, 'number');

  it('accepts an existing component token with a reason', () => {
    expect(
      checkLayoutConstants(
        [{ token: 'Components/dialog/max-width', reason: 'Readable width' }],
        [width],
      ),
    ).toEqual([]);
  });

  it('rejects a missing token or an empty reason', () => {
    expect(
      checkLayoutConstants(
        [
          { token: 'Components/dialog/min-width', reason: 'Gone' },
          { token: 'Components/dialog/max-width', reason: ' ' },
        ],
        [width],
      ),
    ).toHaveLength(2);
  });
});

describe('judge', () => {
  const violations: Violation[] = [
    { rule: 'raw-value', id: 'raw-value Themes/ring/offset', message: 'ring offset' },
    {
      rule: 'layers',
      id: 'layers Components/gap -> Primitives Sizes/spacing/4',
      message: 'density gap',
    },
  ];

  it('turns violations into warnings in a fork', () => {
    expect(judge(violations, { strict: false, knownViolations: [] })).toEqual({
      errors: [],
      warnings: ['ring offset', 'density gap'],
      known: 0,
    });
  });

  it('fails on a violation that is not listed as known', () => {
    expect(
      judge(violations, { strict: true, knownViolations: ['raw-value Themes/ring/offset'] }),
    ).toEqual({ errors: ['density gap'], warnings: [], known: 1 });
  });

  it('fails on a listed violation that no longer occurs, so the list only shrinks', () => {
    expect(
      judge([], { strict: true, knownViolations: ['raw-value Themes/ring/offset'] }).errors,
    ).toEqual([
      '"raw-value Themes/ring/offset" no longer occurs; remove it from the known violations',
    ]);
  });
});

describe('parseExceptions', () => {
  it('reads exact aliases and rejects malformed or unexplained entries', () => {
    const entry = {
      token: 'Components/loader/stroke/width',
      target: 'Primitives Sizes/border-width/2',
      reason: 'Independent spinner geometry.',
    };
    const base = { layoutConstants: [], knownViolations: [] };
    expect(parseExceptions({ ...base, primitiveAliases: [entry] }).primitiveAliases).toEqual([
      entry,
    ]);
    for (const primitiveAliases of [
      null,
      {},
      [null],
      [{ ...entry, target: 2 }],
      [{ ...entry, token: '' }],
      [{ ...entry, reason: ' ' }],
    ]) {
      expect(() => parseExceptions({ ...base, primitiveAliases })).toThrow('primitive');
    }
  });
  it('reads the layout constants and the known violations', () => {
    expect(
      parseExceptions({
        layoutConstants: [{ token: 'Components/dialog/max-width', reason: 'Readable width' }],
        knownViolations: ['raw-value Themes/ring/offset'],
      }),
    ).toEqual({
      primitiveAliases: [],
      layoutConstants: [{ token: 'Components/dialog/max-width', reason: 'Readable width' }],
      knownViolations: ['raw-value Themes/ring/offset'],
    });
  });

  it('rejects a malformed file instead of reading it as empty', () => {
    expect(() => parseExceptions({ knownViolations: [] })).toThrow('expected the arrays');
    expect(() =>
      parseExceptions({ layoutConstants: [{ token: 'x' }], knownViolations: [] }),
    ).toThrow('a layout constant needs a "token" and a "reason"');
    expect(() => parseExceptions({ layoutConstants: [], knownViolations: [1] })).toThrow(
      'a known violation is the id of a violation',
    );
  });
});

describe('exact primitive aliases', () => {
  const primitive = token('Primitives Sizes', 'border-width/2', 2, 'number');
  const loader = token(
    'Components',
    'loader/stroke/width',
    {
      Default: '{Primitives Sizes.border-width.2}',
      Alternate: '{Primitives Sizes.border-width.2}',
    },
    'number',
  );
  const entry = {
    token: 'Components/loader/stroke/width',
    target: 'Primitives Sizes/border-width/2',
    reason: 'Independent spinner geometry.',
  };

  it('permits only the declared connection, leaving raw values and other aliases forbidden', () => {
    expect(checkPrimitiveAliases([entry], [primitive, loader])).toEqual([]);
    expect(findViolations([primitive, loader], new Set(), [entry])).toEqual([]);
    const other = { ...loader, value: '{Primitives Sizes.spacing.4}' };
    expect(ids(findViolations([spacing, other], new Set(), [entry]))).toEqual([
      'layers Components/loader/stroke/width -> Primitives Sizes/spacing/4',
    ]);
    expect(ids(findViolations([{ ...loader, value: 2 }], new Set(), [entry]))).toEqual([
      'raw-value Components/loader/stroke/width',
    ]);
    const unlisted = { ...loader, path: ['other', 'stroke', 'width'] };
    expect(findViolations([primitive, unlisted], new Set(), [entry])).toHaveLength(1);
  });

  it.each(['size/1', 'spacing/4', 'border-width/2'])(
    'accepts the numeric geometry family %s',
    (path) => {
      const target = token('Primitives Sizes', path, 2, 'number');
      const source = { ...loader, value: `{Primitives Sizes.${path.replaceAll('/', '.')}}` };
      expect(
        checkPrimitiveAliases([{ ...entry, target: `Primitives Sizes/${path}` }], [target, source]),
      ).toEqual([]);
    },
  );

  it('rejects a missing endpoint, a wrong source layer, and non-geometry targets', () => {
    expect(checkPrimitiveAliases([entry], [loader])).toHaveLength(1);
    expect(checkPrimitiveAliases([entry], [primitive])).toHaveLength(1);
    expect(
      checkPrimitiveAliases([{ ...entry, token: 'Primitives Sizes/border-width/2' }], [primitive]),
    ).not.toEqual([]);
    for (const target of [
      gray,
      token('Primitives Sizes', 'radius/md', 8, 'number'),
      token('Primitives Sizes', 'text/sm', 14, 'number'),
      token('Primitives Sizes', 'size/bad', '2', 'string'),
    ]) {
      expect(
        checkPrimitiveAliases(
          [{ ...entry, target: `${target.collection}/${target.path.join('/')}` }],
          [target, loader],
        ),
      ).toContainEqual(expect.stringContaining('numeric size, spacing or border-width'));
    }
  });

  it('rejects stale entries, raw values and a different alias in any mode', () => {
    for (const value of [
      2,
      '{Themes.stroke.accent}',
      { Default: '{Primitives Sizes.border-width.2}', Alternate: '{Primitives Sizes.spacing.4}' },
    ]) {
      expect(checkPrimitiveAliases([entry], [primitive, { ...loader, value }])).toEqual([
        'Primitive alias "Components/loader/stroke/width" must alias "Primitives Sizes/border-width/2" in every mode',
      ]);
    }
  });

  it('rejects duplicate entries, overlap with layout constants, and an empty reason', () => {
    expect(checkPrimitiveAliases([entry, entry], [primitive, loader])).toHaveLength(1);
    expect(checkPrimitiveAliases([entry], [primitive, loader], [entry])).toHaveLength(1);
    expect(checkPrimitiveAliases([{ ...entry, reason: ' ' }], [primitive, loader])).toHaveLength(1);
  });
});
