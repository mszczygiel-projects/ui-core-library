import type { ComponentSpec } from '@mszczygiel-projects/ui-core-shared/component';
import { specs } from '@mszczygiel-projects/ui-core-shared/components';

import { code, file, table } from './markdown.ts';
import { sectionsOf } from './mdx.ts';

/**
 * The sections of a component page that the guidelines carry, in this order: those about
 * choosing and configuring a component. The others describe code.
 */
export const GUIDELINE_SECTIONS = [
  'Usage',
  'Variants & tone',
  'Sizes & density',
  'States',
] as const;

/** A component with the MDX of its documentation page. */
export interface DocumentedComponent {
  readonly spec: ComponentSpec;
  readonly page: string;
}

const kebab = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

/** The rows of the properties of the component set of a component. */
function propertiesOf(spec: ComponentSpec): string[][] {
  const { design } = spec;
  const nested = specs.find((candidate) => candidate.name === design.nested);
  return [
    ...Object.entries(spec.options)
      .filter(([name]) => !design.codeOnly.includes(name))
      .map(([name, { options, default: fallback }]) => [
        code(name),
        options.map(code).join(', '),
        code(fallback),
        nested === undefined || !(name in nested.options)
          ? ''
          : `On the nested ${code(nested.name)}.`,
      ]),
    ...design.flags.map((name) => [code(name), '`false`, `true`', '`false`', '']),
    ...design.booleans.map((name) => [
      code(name),
      '`false`, `true`',
      '`false`',
      'A boolean property, not a variant.',
    ]),
    ...Object.entries(design.previews).map(([name, { options, default: fallback, note }]) => [
      code(name),
      options.map(code).join(', '),
      code(fallback),
      `Design only. ${note}`,
    ]),
  ];
}

const propertiesTable = (properties: readonly (readonly string[])[]) =>
  properties.length === 0
    ? undefined
    : table(['Property', 'Values', 'Default', 'Notes'], properties);

/** The guidelines of a part, which the file of the component it belongs to holds. */
function partGuideline(part: ComponentSpec, parent: ComponentSpec): string {
  const properties = propertiesTable(propertiesOf(part));
  return file(
    `## Part: ${code(part.name)}`,
    part.summary,
    `Use the component set ${code(part.name)} only inside ${code(parent.name)}, as its component set holds it. Its variant properties have the names and values below and no others.`,
    properties === undefined ? undefined : `### Properties of ${code(part.name)}\n\n${properties}`,
  ).trimEnd();
}

/**
 * The file of guidelines for one component, for [Core] UI Library, with the guidelines of its
 * parts at the end.
 */
export function componentGuideline({ spec, page }: DocumentedComponent): string {
  const sections = sectionsOf(page);
  const missing = GUIDELINE_SECTIONS.filter((section) => !sections.has(section));
  if (missing.length > 0) {
    throw new Error(`The page of ${spec.name} lacks the sections ${missing.join(', ')}`);
  }
  const { design } = spec;
  const properties = propertiesTable(propertiesOf(spec));
  return file(
    `# ${spec.name}`,
    spec.summary,
    `Use the component set ${code(spec.name)} of [Core] UI Library. Its variant properties have the names and values below and no others: never invent a property, a value or a variant, and never detach an instance to restyle it.`,
    properties === undefined ? undefined : `## Properties\n\n${properties}`,
    design.nested === undefined
      ? 'Its text properties hold the text the component shows, its `show…` booleans show or hide an optional part, and its icon properties swap in an instance of [Core] Icons.'
      : `The component holds an exposed instance of ${code(design.nested)}, the layer \`field\`. Set the shared properties, the texts and the hint on that instance. Leave its icon properties as supplied by the component.`,
    ...GUIDELINE_SECTIONS.map((section) => `## ${section}\n\n${sections.get(section) ?? ''}`),
    ...specs.filter((part) => part.partOf === spec.name).map((part) => partGuideline(part, spec)),
  );
}

/** The file name of the guidelines of a component, which for a part is that of its component. */
export function componentFile(spec: Pick<ComponentSpec, 'name' | 'partOf'>): string {
  return `components/${kebab(spec.partOf ?? spec.name)}.md`;
}

/** The overview of [Core] UI Library: what it holds and the rules for every component. */
export function libraryOverview(components: readonly DocumentedComponent[]): string {
  const done = components.filter(({ spec }) => spec.status === 'done');
  return file(
    '# [Core] UI Library',
    'IMPORTANT: Build every interface from the component sets of this library, with the variables and styles of [Core] Foundations. Do not draw a control from frames, rectangles and text when a component exists for it.',
    `## Components\n\n${table(
      ['Component', 'Category', 'Use it for', 'Guidelines'],
      done.map(({ spec }) => [code(spec.name), spec.category, spec.summary, componentFile(spec)]),
    )}`,
    `## Rules for every component

- Choose the property values the guidelines of the component list. A value that is not listed does not exist.
- Put a component on a frame whose surface mode matches its background: Default, Subtle, Inverse or Primary. The component takes its colours from that mode; do not recolour it.
- Set the screen and the density with the Sizes mode of the frame (Mobile, Desktop, Mobile Compact or Desktop Compact), not by changing the size of a component.
- Write the text of a component in its text properties. Use sentence case; a style that shows capitals adds them itself.
- Put icons only in the icon slots of a component, as instances of [Core] Icons.
- WRONG: a detached instance, a fill or a stroke that overrides a component, a hex colour, a hand-drawn spinner.
- CORRECT: an instance with the listed property values on a frame with the right surface and density modes.`,
  );
}
