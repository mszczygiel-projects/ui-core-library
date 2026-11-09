import { describe, expect, it } from 'vitest';

import { checkIcon, normalizeIcon } from './svg.ts';

/** An icon as Figma exports it: a 24 by 24 frame, one filled path, the colour of its variable. */
function exported(path: string, root = 'width="24" height="24" viewBox="0 0 24 24"'): string {
  return `<svg ${root} fill="none" xmlns="http://www.w3.org/2000/svg">\n${path}\n</svg>\n`;
}

const close = exported('<path d="M6 6L18 18L17 19L5 7Z" fill="#174BA0"/>');

describe('checkIcon', () => {
  it('accepts an icon drawn by the rules', () => {
    expect(checkIcon('close', close)).toEqual({ errors: [], violations: [] });
  });

  it('accepts the geometry and paint of every plain shape', () => {
    const shapes = exported(
      [
        '<g transform="translate(1 1)" fill="#174BA0">',
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
    const twoTone = exported('<path d="M0 0" fill="#174BA0"/><path d="M1 1" fill="#FF0000"/>');
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
      '<path d="M0 0" fill="#174BA0"/><path d="M1 1" fill="rgb(23, 75, 160)"/>',
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
        '<path d="M0 0" fill="#174BA0" fill-opacity="1"/>',
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

  it('reports a stroke, on the shape or inherited from a group', () => {
    const violations = [
      {
        rule: 'stroke',
        message:
          'lined.svg draws with strokes; icons are drawn with fills, which is where a component sets their colour',
      },
    ];
    const lined = exported('<path d="M0 0" stroke="#174BA0" stroke-width="1.5"/>');
    expect(checkIcon('lined', lined).violations).toEqual(violations);
    const grouped = exported('<g stroke="#174BA0"><path d="M0 0"/></g>');
    expect(checkIcon('lined', grouped).violations).toEqual(violations);
  });

  it('accepts a stroke of none', () => {
    const none = exported('<path d="M0 0" fill="#174BA0" stroke="none"/>');
    expect(checkIcon('none', none)).toEqual({ errors: [], violations: [] });
  });
});

describe('normalizeIcon', () => {
  it('sizes the icon by the text around it and paints it in currentColor', () => {
    expect(normalizeIcon(close)).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="m6 6 12 12-1 1L5 7Z"/></svg>',
    );
  });

  it('paints fills in currentColor and keeps the fill of none on the root', () => {
    const outlined = normalizeIcon(exported('<path d="M3 3H21V4.5H3Z" fill="#174BA0"/>'));
    expect(outlined).toContain('fill="none"');
    expect(outlined).toContain('<path fill="currentColor"');
    expect(outlined).not.toContain('#174BA0');
  });
});
