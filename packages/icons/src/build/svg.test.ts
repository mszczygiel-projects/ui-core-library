import { describe, expect, it } from 'vitest';

import { checkIcon, normalizeIcon } from './svg.ts';

/** An icon as Figma exports it: a 24 by 24 frame, one stroked path, the colour of its variable. */
function exported(path: string, root = 'width="24" height="24" viewBox="0 0 24 24"'): string {
  return `<svg ${root} fill="none" xmlns="http://www.w3.org/2000/svg">\n${path}\n</svg>\n`;
}

const close = exported(
  '<path d="M6 6L18 18M6 18L9.75 14.25M18 6L14.25 9.75" stroke="#174BA0" stroke-width="1.5" stroke-linecap="round"/>',
);

describe('checkIcon', () => {
  it('accepts an icon drawn by the rules', () => {
    expect(checkIcon('close', close)).toEqual({ errors: [], violations: [] });
  });

  it('accepts an icon whose stroke Figma outlined into a fill', () => {
    const outlined = exported('<path d="M3 3H21V4.5H3Z" fill="#174BA0"/>');
    expect(checkIcon('menu', outlined)).toEqual({ errors: [], violations: [] });
  });

  it('accepts the geometry and paint of every plain shape', () => {
    const shapes = exported(
      [
        '<g transform="translate(1 1)" stroke="#174BA0" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">',
        '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="2"/>',
        '<line x1="3" y1="3" x2="21" y2="21"/><polyline points="3 9 12 15 21 9"/>',
        '<polygon points="3 3 21 3 12 21"/><rect x="3" y="3" width="18" height="18" rx="2"/>',
        '</g>',
        '<path d="M3 3H21V4.5H3Z" fill="#174BA0" fill-rule="evenodd" clip-rule="evenodd"/>',
      ].join(''),
    );
    expect(checkIcon('shapes', shapes)).toEqual({ errors: [], violations: [] });
  });

  it('stops on an SVG that cannot be read', () => {
    expect(checkIcon('broken', '<svg viewBox="0 0 24 24"><path></svg>').errors).toEqual([
      'broken.svg cannot be read: <input>:1:37: Unexpected close tag',
    ]);
    expect(checkIcon('text', 'hello').errors).toEqual([
      'text.svg cannot be read: <input>:1:1: Non-whitespace before first tag.',
    ]);
  });

  it('stops on a file that is not an SVG', () => {
    expect(checkIcon('group', '<g><path d="M0 0"/></g>')).toEqual({
      errors: ['group.svg does not start with an <svg> element'],
      violations: [],
    });
  });

  it('stops on anything but plain shapes, whatever the case of its name', () => {
    const unsafe = exported(
      [
        '<FOREIGNOBJECT/><img src="https://example.com/x.png"/><PATH d="M0 0"/>',
        '<path d="M0 0" HREF="#a" xmlns:x="http://www.w3.org/1999/xlink" x:href="https://example.com/" onclick="steal()"/>',
        '<script>steal()</script>',
      ].join(''),
    );
    expect(checkIcon('unsafe', unsafe).errors).toEqual([
      'unsafe.svg contains <FOREIGNOBJECT>, <img>, the attribute src, <PATH>, the attribute HREF, the attribute xmlns:x, the attribute x:href, the attribute onclick, <script>; an icon holds only plain shapes painted in colours',
    ]);
  });

  it('stops on a paint that is not a colour, which could load content', () => {
    const painted = exported(
      [
        '<path d="M0 0" fill="url(#gradient)"/>',
        '<path d="M1 1" stroke="url(javascript:steal())" stroke-width="1.5"/>',
        '<path d="M2 2" fill="var(--paint)"/>',
        '<path d="M3 3" fill="u\\72l(https://example.com/x.svg)"/>',
      ].join(''),
    );
    expect(checkIcon('painted', painted).errors).toEqual([
      'painted.svg contains the fill url(#gradient), the stroke url(javascript:steal()), the fill var(--paint), the fill u\\72l(https://example.com/x.svg); an icon holds only plain shapes painted in colours',
    ]);
  });

  it('stops on titles, definitions, ids, styles and text, which plain shapes never need', () => {
    const structured = exported(
      '<title>Close</title><defs><clipPath id="clip"><rect width="24" height="24"/></clipPath></defs><g clip-path="url(#clip)" class="icon" style="opacity:.5"><text>A</text></g>',
    );
    expect(checkIcon('structured', structured).errors).toEqual([
      'structured.svg contains <title>, <defs>, <clipPath>, the attribute id, the attribute clip-path, the attribute class, the attribute style, <text>; an icon holds only plain shapes painted in colours',
    ]);
  });

  it('reports an icon drawn on another grid', () => {
    const misplaced = exported(
      '<path d="M116 16.7L125 20.75Z" fill="#174BA0"/>',
      'width="136" height="189" viewBox="0 0 136 189"',
    );
    expect(checkIcon('check', misplaced).violations).toEqual([
      {
        rule: 'view-box',
        message: 'check.svg has the viewBox "0 0 136 189"; icons are drawn on "0 0 24 24"',
      },
    ]);
    expect(checkIcon('bare', '<svg><path d="M0 0" fill="#000"/></svg>').violations).toEqual([
      {
        rule: 'view-box',
        message: 'bare.svg has no viewBox; icons are drawn on "0 0 24 24"',
      },
    ]);
  });

  it('reports an icon painted in more than one colour', () => {
    const twoTone = exported(
      '<path d="M0 0" stroke="#174BA0" stroke-width="1.5"/><path d="M1 1" fill="#FF0000"/>',
    );
    expect(checkIcon('two-tone', twoTone).violations).toEqual([
      {
        rule: 'colour',
        message:
          'two-tone.svg paints in #174ba0, #f00; an icon has one colour, which becomes currentColor',
      },
    ]);
  });

  it('compares colours, not the way they are written', () => {
    const blue = exported(
      '<path d="M0 0" stroke="#174BA0" stroke-width="1.5"/><path d="M1 1" fill="rgb(23, 75, 160)"/>',
    );
    expect(checkIcon('blue', blue)).toEqual({ errors: [], violations: [] });
    const red = exported(
      '<path d="M0 0" fill="red"/><path d="M1 1" fill="#F00"/><path d="M2 2" fill="rgb(255,0,0)"/>',
    );
    expect(checkIcon('red', red)).toEqual({ errors: [], violations: [] });
  });

  it('reports transparency, which paints a second tone', () => {
    const faded = exported(
      [
        '<path d="M0 0" stroke="#174BA0" stroke-width="1.5" stroke-opacity="1"/>',
        '<path d="M1 1" fill="#174BA0" fill-opacity="40%"/>',
        '<g opacity="0.5"><path d="M2 2" fill="#174BA0"/></g>',
      ].join(''),
    );
    expect(checkIcon('faded', faded).violations).toEqual([
      {
        rule: 'colour',
        message:
          'faded.svg paints with fill-opacity 40%, opacity 0.5; an icon has one solid colour, which becomes currentColor',
      },
    ]);
  });

  it('reports strokes of another width, including the width SVG gives a stroke by default', () => {
    const thick = exported('<path d="M0 0" stroke="#174BA0" stroke-width="2"/>');
    expect(checkIcon('thick', thick).violations).toEqual([
      {
        rule: 'stroke-width',
        message: 'thick.svg draws strokes 2 wide; icons draw them 1.5 wide',
      },
    ]);
    const unset = exported('<path d="M0 0" stroke="#174BA0"/>');
    expect(checkIcon('unset', unset).violations).toEqual([
      {
        rule: 'stroke-width',
        message: 'unset.svg draws strokes 1 wide; icons draw them 1.5 wide',
      },
    ]);
  });

  it('compares stroke widths as numbers', () => {
    const written = exported(
      '<path d="M0 0" stroke="#174BA0" stroke-width="1.50"/><path d="M1 1" stroke="#174BA0" stroke-width="1.5px"/>',
    );
    expect(checkIcon('written', written)).toEqual({ errors: [], violations: [] });
  });

  it('reads a stroke and its width inherited from a group', () => {
    const grouped = exported('<g stroke="#174BA0" stroke-width="1.5"><path d="M0 0"/></g>');
    expect(checkIcon('grouped', grouped)).toEqual({ errors: [], violations: [] });
  });

  it('reports a transform that scales a stroke, on the shape or its group', () => {
    const scaled = exported(
      [
        '<g transform="scale(2)"><path d="M0 0" stroke="#174BA0" stroke-width="1.5"/></g>',
        '<path d="M1 1" stroke="#174BA0" stroke-width="1.5" transform="skewX(10)"/>',
        '<g transform="scale(3)"><path d="M2 2" fill="#174BA0"/></g>',
      ].join(''),
    );
    expect(checkIcon('scaled', scaled).violations).toEqual([
      {
        rule: 'stroke-width',
        message:
          'scaled.svg scales strokes with transform="scale(2)", transform="skewX(10)", which changes their drawn width; icons draw them 1.5 wide',
      },
    ]);
  });

  it('accepts a transform that moves, rotates or mirrors a stroke', () => {
    const turned = exported(
      [
        '<g transform="translate(2, 1) rotate(45 12 12)"><path d="M0 0" stroke="#174BA0" stroke-width="1.5"/></g>',
        '<path d="M1 1" stroke="#174BA0" stroke-width="1.5" transform="matrix(-1 0 0 1 24 0)"/>',
        '<path d="M2 2" stroke="#174BA0" stroke-width="1.5" transform="matrix(0.707107 0.707107 -0.707107 0.707107 0 0)"/>',
      ].join(''),
    );
    expect(checkIcon('turned', turned)).toEqual({ errors: [], violations: [] });
  });
});

describe('normalizeIcon', () => {
  it('sizes the icon by the text around it and paints it in currentColor', () => {
    expect(normalizeIcon(close)).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-width="1.5" d="m6 6 12 12M6 18l3.75-3.75M18 6l-3.75 3.75"/></svg>',
    );
  });

  it('paints fills in currentColor and keeps the fill of none on the root', () => {
    const outlined = normalizeIcon(exported('<path d="M3 3H21V4.5H3Z" fill="#174BA0"/>'));
    expect(outlined).toContain('fill="none"');
    expect(outlined).toContain('<path fill="currentColor"');
    expect(outlined).not.toContain('#174BA0');
  });
});
