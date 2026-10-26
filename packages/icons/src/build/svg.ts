/**
 * What the build checks and changes in the SVG of an icon. svgo parses every source; a
 * plugin of our own reads it before anything changes, and the normalization then rewrites it for
 * inline use: sized by the text around it and painted in its colour.
 */
import { type Config, type CustomPlugin, optimize, type XastElement } from 'svgo';

/** The rules of an icon's design. The library's build treats every violation as an error. */
export type Rule = 'view-box' | 'colour' | 'stroke-width';

export interface Violation {
  readonly rule: Rule;
  readonly message: string;
}

export interface Findings {
  /** What stops every build: an SVG that cannot be read, or anything but plain shapes. */
  readonly errors: readonly string[];
  readonly violations: readonly Violation[];
}

export const VIEW_BOX = '0 0 24 24';
export const STROKE_WIDTH = 1.5;

const SHAPES = new Set(['path', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'rect']);

/**
 * All an icon may contain: plain shapes, with their geometry and paint. The icon is inserted as
 * markup, so anything else could run code or load content where it is rendered. A list of what is
 * forbidden would always miss something: the HTML parser that inserts the icon reads names in any
 * case and lifts some elements, such as img, out of the SVG. Names are compared exactly, so a name
 * in another case is another name.
 */
const ELEMENTS = new Set(['svg', 'g', ...SHAPES]);
const ATTRIBUTES = new Set([
  ...['xmlns', 'viewBox', 'width', 'height', 'transform'],
  ...['d', 'x', 'y', 'cx', 'cy', 'r', 'rx', 'ry', 'x1', 'y1', 'x2', 'y2', 'points'],
  ...['fill', 'fill-rule', 'clip-rule', 'fill-opacity', 'opacity'],
  ...['stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit'],
  ...['stroke-dasharray', 'stroke-dashoffset', 'stroke-opacity'],
]);

/** A colour, or a keyword such as none; a url() or any other function could load content. */
const PAINT = /^\s*(?:#[\da-f]{3,8}|(?:rgba?|hsla?)\([^()\\'"]*\)|[a-z]+)\s*$/i;
const PAINT_ATTRIBUTES = new Set(['fill', 'stroke']);
const NO_PAINT = new Set(['none', 'currentcolor', 'transparent', 'inherit']);
const OPACITY_ATTRIBUTES = new Set(['opacity', 'fill-opacity', 'stroke-opacity']);

const NUMBER = String.raw`[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?`;
const LENGTH = new RegExp(String.raw`^\s*(${NUMBER})(?:px)?\s*$`, 'i');
const OPACITY = new RegExp(String.raw`^\s*(${NUMBER})(%?)\s*$`, 'i');

/** A length in user units, such as 1.5 or 1.5px; undefined for any other unit. */
function userUnits(value: string): number | undefined {
  const number = LENGTH.exec(value)?.[1];
  return number === undefined ? undefined : Number(number);
}

/** An opacity from 0 to 1, such as 0.4 for 0.4 or 40%; undefined when it cannot be read. */
function opacity(value: string): number | undefined {
  const [, number, percent] = OPACITY.exec(value) ?? [];
  return number === undefined ? undefined : Number(number) / (percent === '%' ? 100 : 1);
}

/** The linear part [a, b, c, d] of a transform: what it does to lengths, without moving. */
type Linear = readonly [number, number, number, number];

const TRANSFORM_LIST =
  /^[\s,]*(?:(?:matrix|translate|scale|rotate|skewX|skewY)\s*\([^()]*\)[\s,]*)*$/;
const TRANSFORM = /(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^()]*)\)/g;

function linearPart(kind: string, args: readonly number[]): Linear | undefined {
  const [first = 0, second = 0, third = 0, fourth = 0] = args;
  const angle = (first * Math.PI) / 180;
  switch (kind) {
    case 'matrix':
      return args.length === 6 ? [first, second, third, fourth] : undefined;
    case 'translate':
      return args.length === 1 || args.length === 2 ? [1, 0, 0, 1] : undefined;
    case 'scale':
      return args.length === 1 || args.length === 2
        ? [first, 0, 0, args.length === 2 ? second : first]
        : undefined;
    case 'rotate':
      return args.length === 1 || args.length === 3
        ? [Math.cos(angle), Math.sin(angle), -Math.sin(angle), Math.cos(angle)]
        : undefined;
    case 'skewX':
      return args.length === 1 ? [1, 0, Math.tan(angle), 1] : undefined;
    case 'skewY':
      return args.length === 1 ? [1, Math.tan(angle), 0, 1] : undefined;
    default:
      return undefined;
  }
}

/**
 * Whether a transform keeps lengths, as moving, rotating and mirroring do, and so leaves the drawn
 * width of a stroke alone. A transform that cannot be read counts as one that does not.
 */
function keepsLengths(transform: string): boolean {
  if (!TRANSFORM_LIST.test(transform)) {
    return false;
  }
  let [a, b, c, d] = [1, 0, 0, 1];
  for (const [, kind = '', list = ''] of transform.matchAll(TRANSFORM)) {
    const args = list
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    const step = args.some((arg) => Number.isNaN(arg)) ? undefined : linearPart(kind, args);
    if (step === undefined) {
      return false;
    }
    const [e, f, g, h] = step;
    [a, b, c, d] = [a * e + c * f, b * e + d * f, a * g + c * h, b * g + d * h];
  }
  // Exported matrices are rounded, so a rotation by 45 degrees is only nearly one.
  const near = (x: number, y: number): boolean => Math.abs(x - y) < 1e-3;
  return near(a * a + b * b, 1) && near(c * c + d * d, 1) && near(a * c + b * d, 0);
}

interface Facts {
  root: string | null;
  viewBox: string | undefined;
  /** What lies outside the allowlist, as written. */
  readonly disallowed: Set<string>;
  readonly colours: Set<string>;
  readonly transparency: Set<string>;
  /** The widths of strokes that are not drawn 1.5 wide, as written. */
  readonly strokeWidths: Set<string>;
  /** The transforms that scale a stroke. */
  readonly scaling: Set<string>;
}

interface Inherited {
  readonly stroke: string | undefined;
  readonly strokeWidth: string | undefined;
  readonly scaling: string | undefined;
}

/** Collects what the rules need, without changing the tree. */
function inspectionPlugin(facts: Facts): CustomPlugin {
  const inherited: Inherited[] = [];
  return {
    name: 'inspectIcon',
    fn: () => ({
      element: {
        enter: (node: XastElement, parentNode) => {
          if (parentNode.type === 'root' && facts.root === null) {
            facts.root = node.name;
            facts.viewBox = node.attributes['viewBox'];
          }
          if (!ELEMENTS.has(node.name)) {
            facts.disallowed.add(`<${node.name}>`);
          }
          for (const [name, value] of Object.entries(node.attributes)) {
            if (!ATTRIBUTES.has(name)) {
              facts.disallowed.add(`the attribute ${name}`);
            } else if (PAINT_ATTRIBUTES.has(name)) {
              const paint = value.trim().toLowerCase();
              if (!PAINT.test(value)) {
                facts.disallowed.add(`the ${name} ${value}`);
              } else if (!NO_PAINT.has(paint)) {
                facts.colours.add(paint);
              }
            } else if (OPACITY_ATTRIBUTES.has(name)) {
              const alpha = opacity(value);
              if (alpha === undefined || alpha < 1) {
                facts.transparency.add(`${name} ${value}`);
              }
            }
          }
          const parent = inherited.at(-1);
          const transform = node.attributes['transform'];
          const own: Inherited = {
            stroke: node.attributes['stroke'] ?? parent?.stroke,
            strokeWidth: node.attributes['stroke-width'] ?? parent?.strokeWidth,
            scaling:
              (transform !== undefined && !keepsLengths(transform) ? transform : undefined) ??
              parent?.scaling,
          };
          inherited.push(own);
          if (SHAPES.has(node.name) && own.stroke !== undefined && own.stroke !== 'none') {
            // An SVG stroke is 1 wide unless something says otherwise.
            const width = own.strokeWidth ?? '1';
            if (userUnits(width) !== STROKE_WIDTH) {
              facts.strokeWidths.add(width);
            }
            if (own.scaling !== undefined) {
              facts.scaling.add(own.scaling);
            }
          }
        },
        exit: () => {
          inherited.pop();
        },
      },
    }),
  };
}

function reason(error: unknown): string {
  return error instanceof Error ? (error.message.split('\n')[0] ?? error.message) : String(error);
}

/** The errors and rule violations of one icon's SVG; `name` is its file name without `.svg`. */
export function checkIcon(name: string, svg: string): Findings {
  const facts: Facts = {
    root: null,
    viewBox: undefined,
    disallowed: new Set(),
    colours: new Set(),
    transparency: new Set(),
    strokeWidths: new Set(),
    scaling: new Set(),
  };
  try {
    // convertColors writes every colour one way first, so #174BA0 and rgb(23, 75, 160) are one.
    optimize(svg, {
      plugins: [{ name: 'convertColors', params: { shortname: false } }, inspectionPlugin(facts)],
    });
  } catch (error) {
    return { errors: [`${name}.svg cannot be read: ${reason(error)}`], violations: [] };
  }

  const errors: string[] = [];
  if (facts.root !== 'svg') {
    errors.push(`${name}.svg does not start with an <svg> element`);
  }
  if (facts.disallowed.size > 0) {
    errors.push(
      `${name}.svg contains ${[...facts.disallowed].join(', ')}; an icon holds only plain shapes painted in colours`,
    );
  }
  if (facts.root !== 'svg') {
    // The design rules say nothing useful about a file that is not an icon at all.
    return { errors, violations: [] };
  }

  const violations: Violation[] = [];
  if (facts.viewBox !== VIEW_BOX) {
    violations.push({
      rule: 'view-box',
      message: `${name}.svg has ${facts.viewBox === undefined ? 'no viewBox' : `the viewBox "${facts.viewBox}"`}; icons are drawn on "${VIEW_BOX}"`,
    });
  }
  if (facts.colours.size > 1) {
    violations.push({
      rule: 'colour',
      message: `${name}.svg paints in ${[...facts.colours].join(', ')}; an icon has one colour, which becomes currentColor`,
    });
  }
  if (facts.transparency.size > 0) {
    violations.push({
      rule: 'colour',
      message: `${name}.svg paints with ${[...facts.transparency].join(', ')}; an icon has one solid colour, which becomes currentColor`,
    });
  }
  if (facts.strokeWidths.size > 0) {
    violations.push({
      rule: 'stroke-width',
      message: `${name}.svg draws strokes ${[...facts.strokeWidths].join(', ')} wide; icons draw them ${String(STROKE_WIDTH)} wide`,
    });
  }
  if (facts.scaling.size > 0) {
    violations.push({
      rule: 'stroke-width',
      message: `${name}.svg scales strokes with ${[...facts.scaling].map((transform) => `transform="${transform}"`).join(', ')}, which changes their drawn width; icons draw them ${String(STROKE_WIDTH)} wide`,
    });
  }
  return { errors, violations };
}

/** Sizes the icon by the font size around it; a component or an application sets its own size. */
const sizeToText: CustomPlugin = {
  name: 'sizeToText',
  fn: () => ({
    element: {
      enter: (node: XastElement, parentNode) => {
        if (parentNode.type === 'root' && node.name === 'svg') {
          node.attributes['width'] = '1em';
          node.attributes['height'] = '1em';
        }
      },
    },
  }),
};

const NORMALIZATION: Config = {
  plugins: [
    {
      name: 'preset-default',
      params: { overrides: { convertColors: { currentColor: true } } },
    },
    sizeToText,
  ],
};

/** The SVG of an icon, ready to be inlined: 1em in size, painted in currentColor, minified. */
export function normalizeIcon(svg: string): string {
  return optimize(svg, NORMALIZATION).data;
}
