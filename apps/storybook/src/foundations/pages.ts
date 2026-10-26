import type { ManifestAxis, ManifestToken } from '@mszczygiel-projects/ui-core-foundations';

import map from './pages.json' with { type: 'json' };

export type Collection = ManifestToken['collection'];

/** The documentation that shows a page or a specimen, when only one of them does. */
export type Doc = 'storybook' | 'figma';

/**
 * What a specimen shows: its tokens, a block that reads the manifest or the Figma file itself,
 * or, on a Figma page alone, prose and the tables and previews written for Figma.
 */
export type Shows =
  | 'tokens'
  | 'text-styles'
  | 'composite-shadows'
  | 'surface-matrix'
  | 'icon-gallery'
  | 'prose'
  | 'collections'
  | 'modes'
  | 'brand-preview'
  | 'bold-words';

/** How a row draws its token; each documentation draws it its own way. */
export type Preview =
  | 'none'
  | 'value'
  | 'swatch'
  | 'ramp'
  | 'font'
  | 'link'
  | 'length'
  | 'radius'
  | 'stroke'
  | 'shadow'
  | 'icon'
  | 'brand';

/** The tokens of some collections whose custom property starts with a prefix. */
export interface TokenGroup {
  readonly caption?: string;
  readonly collections: readonly Collection[];
  readonly prefix: string;
  /** Prefixes of the custom properties the group leaves out. */
  readonly exclude: readonly string[];
}

export interface Specimen {
  /** The export of the story in the stories file of the page; a Figma specimen has none. */
  readonly story?: string;
  /** The heading of the specimen on the Figma page. */
  readonly title: string;
  readonly shows: Shows;
  readonly preview: Preview;
  /** The axis whose modes the specimen compares side by side. */
  readonly axis?: ManifestAxis;
  readonly groups: readonly TokenGroup[];
  /** The text under the heading of the specimen on the Figma page. */
  readonly note?: string;
  /** The rows of a table written for the Figma page. */
  readonly rows: readonly (readonly string[])[];
  readonly only?: Doc;
  /** Why only one documentation shows the specimen. */
  readonly reason?: string;
}

export interface Page {
  /** The title in Storybook, under Foundations. */
  readonly title: string;
  /** The name of the page in Figma. */
  readonly figma: string;
  /** The name of the MDX file and of its stories file, without the extension. */
  readonly file?: string;
  /** The first paragraph of the Figma page. */
  readonly lead?: string;
  readonly specimens: readonly Specimen[];
  readonly only?: Doc;
  readonly reason?: string;
}

/** Tokens that no page has to show, each with the reason. */
export interface Exemption {
  readonly collections: readonly Collection[];
  readonly prefix: string;
  readonly reason: string;
}

export interface PagesMap {
  /** The pages, in the order of the Storybook sidebar. */
  readonly pages: readonly Page[];
  /** The names of the Figma pages, in the order of the file. */
  readonly figmaOrder: readonly string[];
  /** Figma pages designed by hand, such as the cover: the builder leaves them alone. */
  readonly handMade: readonly string[];
  readonly exempt: readonly Exemption[];
}

// A record lists every collection once, so TypeScript reports a collection added or removed.
const COLLECTIONS: Readonly<Record<Collection, true>> = {
  'Primitives Colors': true,
  'Primitives Sizes': true,
  'Primitives Motions': true,
  'Primitives Shadows': true,
  Themes: true,
  Surfaces: true,
  Sizes: true,
  Components: true,
};
const AXES: Readonly<Record<ManifestAxis, true>> = {
  brand: true,
  theme: true,
  surface: true,
  density: true,
  size: true,
};
const SHOWS: Readonly<Record<Shows, true>> = {
  tokens: true,
  'text-styles': true,
  'composite-shadows': true,
  'surface-matrix': true,
  'icon-gallery': true,
  prose: true,
  collections: true,
  modes: true,
  'brand-preview': true,
  'bold-words': true,
};
const PREVIEWS: Readonly<Record<Preview, true>> = {
  none: true,
  value: true,
  swatch: true,
  ramp: true,
  font: true,
  link: true,
  length: true,
  radius: true,
  stroke: true,
  shadow: true,
  icon: true,
  brand: true,
};
const DOCS: Readonly<Record<Doc, true>> = { storybook: true, figma: true };

type Fields = Readonly<Record<string, unknown>>;

function isFields(value: unknown): value is Fields {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOneOf<T extends string>(allowed: Readonly<Record<T, true>>, value: unknown): value is T {
  return typeof value === 'string' && Object.hasOwn(allowed, value);
}

function oneOf<T extends string>(
  allowed: Readonly<Record<T, true>>,
  value: unknown,
  where: string,
): T {
  if (isOneOf(allowed, value)) {
    return value;
  }
  throw new TypeError(
    `${where}: ${JSON.stringify(value)} is not one of ${Object.keys(allowed).join(', ')}`,
  );
}

function text(value: unknown, where: string): string {
  if (typeof value !== 'string' || value === '') {
    throw new TypeError(`${where}: expected text, got ${JSON.stringify(value)}`);
  }
  return value;
}

function optionalText(value: unknown, where: string): string | undefined {
  return value === undefined ? undefined : text(value, where);
}

function list(value: unknown, where: string): readonly unknown[] {
  if (!Array.isArray(value)) {
    throw new TypeError(`${where}: expected a list`);
  }
  return value;
}

function fields(value: unknown, where: string): Fields {
  if (!isFields(value)) {
    throw new TypeError(`${where}: expected an object`);
  }
  return value;
}

function parseGroup(value: unknown, where: string): TokenGroup {
  const group = fields(value, where);
  const caption = optionalText(group['caption'], `${where}.caption`);
  return {
    ...(caption === undefined ? {} : { caption }),
    collections: list(group['collections'], `${where}.collections`).map((collection) =>
      oneOf(COLLECTIONS, collection, `${where}.collections`),
    ),
    prefix: text(group['prefix'], `${where}.prefix`),
    exclude: list(group['exclude'] ?? [], `${where}.exclude`).map((prefix) =>
      text(prefix, `${where}.exclude`),
    ),
  };
}

/** Fields that only one documentation shows: `only`, and the reason, which is then required. */
function onlyIn(value: Fields, where: string): { readonly only?: Doc; readonly reason?: string } {
  if (value['only'] === undefined) {
    return {};
  }
  return {
    only: oneOf(DOCS, value['only'], `${where}.only`),
    reason: text(value['reason'], `${where}.reason`),
  };
}

function parseSpecimen(value: unknown, where: string): Specimen {
  const specimen = fields(value, where);
  const only = onlyIn(specimen, where);
  // Storybook renders a specimen as a story, so only a specimen of Figma alone may lack one.
  const story =
    only.only === 'figma'
      ? optionalText(specimen['story'], `${where}.story`)
      : text(specimen['story'], `${where}.story`);
  const axis =
    specimen['axis'] === undefined ? undefined : oneOf(AXES, specimen['axis'], `${where}.axis`);
  const note = optionalText(specimen['note'], `${where}.note`);
  return {
    ...(story === undefined ? {} : { story }),
    title: text(specimen['title'], `${where}.title`),
    shows: oneOf(SHOWS, specimen['shows'] ?? 'tokens', `${where}.shows`),
    preview: oneOf(PREVIEWS, specimen['preview'] ?? 'none', `${where}.preview`),
    ...(axis === undefined ? {} : { axis }),
    groups: list(specimen['groups'], `${where}.groups`).map((group, index) =>
      parseGroup(group, `${where}.groups[${String(index)}]`),
    ),
    ...(note === undefined ? {} : { note }),
    rows: list(specimen['rows'] ?? [], `${where}.rows`).map((row, index) =>
      list(row, `${where}.rows[${String(index)}]`).map((cell) =>
        text(cell, `${where}.rows[${String(index)}]`),
      ),
    ),
    ...only,
  };
}

function parsePage(value: unknown, where: string): Page {
  const page = fields(value, where);
  const title = text(page['title'], `${where}.title`);
  const file = optionalText(page['file'], `${where}.file`);
  const lead = optionalText(page['lead'], `${where}.lead`);
  return {
    title,
    figma: optionalText(page['figma'], `${where}.figma`) ?? title,
    ...(file === undefined ? {} : { file }),
    ...(lead === undefined ? {} : { lead }),
    specimens: list(page['specimens'], `${where}.specimens`).map((specimen, index) =>
      parseSpecimen(specimen, `${where}.specimens[${String(index)}]`),
    ),
    ...onlyIn(page, where),
  };
}

/** Reads the map of the pages, and throws on anything it does not expect. */
export function parsePagesMap(value: unknown): PagesMap {
  const root = fields(value, 'pages.json');
  return {
    pages: list(root['pages'], 'pages').map((page, index) =>
      parsePage(page, `pages[${String(index)}]`),
    ),
    figmaOrder: list(root['figmaOrder'] ?? [], 'figmaOrder').map((name) =>
      text(name, 'figmaOrder'),
    ),
    handMade: list(root['handMade'] ?? [], 'handMade').map((name) => text(name, 'handMade')),
    exempt: list(root['exempt'], 'exempt').map((value, index) => {
      const where = `exempt[${String(index)}]`;
      const exemption = fields(value, where);
      return {
        collections: list(exemption['collections'], `${where}.collections`).map((collection) =>
          oneOf(COLLECTIONS, collection, `${where}.collections`),
        ),
        prefix: text(exemption['prefix'], `${where}.prefix`),
        reason: text(exemption['reason'], `${where}.reason`),
      };
    }),
  };
}

const raw: unknown = map;

/** The pages of both documentations, in the order of the Storybook sidebar. */
export const pagesMap: PagesMap = parsePagesMap(raw);

/** The specimen behind a story of a page. */
export function specimen(title: string, story: string): Specimen {
  const found = pagesMap.pages
    .find((page) => page.title === title)
    ?.specimens.find((candidate) => candidate.story === story);
  if (found === undefined) {
    throw new Error(`pages.json has no specimen ${story} on the page ${title}`);
  }
  return found;
}
