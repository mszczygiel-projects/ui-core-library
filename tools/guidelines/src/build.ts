import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { TokenManifest } from '@mszczygiel-projects/ui-core-foundations';
import manifestJson from '@mszczygiel-projects/ui-core-foundations/tokens.json' with { type: 'json' };
import type { ComponentSpec } from '@mszczygiel-projects/ui-core-shared/component';
import { specs } from '@mszczygiel-projects/ui-core-shared/components';

import { foundationsGuidelines } from './foundations.ts';
import { iconGuidelines } from './icons.ts';
import type { DocumentedComponent } from './ui-library.ts';
import { componentFile, componentGuideline, libraryOverview } from './ui-library.ts';

/** The libraries of Figma, each with the files of its guidelines. */
export type Guidelines = Record<'ui-library' | 'foundations' | 'icons', Record<string, string>>;

/** Figma accepts at most this many bytes of guidelines per library. */
export const LIBRARY_LIMIT = 200 * 1024;

/** The name of the guide in the guidelines of the libraries that need it. */
export const DESIGN_SYSTEM_FILE = 'your-design-system.md';

const root = join(import.meta.dirname, '..', '..', '..');

/** The MDX page of a component in the documentation site; a part has the page of its component. */
export function pageOf(spec: ComponentSpec): string {
  const name = spec.partOf ?? spec.name;
  return readFileSync(
    join(root, 'apps/storybook/src/components', spec.category.toLowerCase(), `${name}.mdx`),
    'utf8',
  );
}

/** The export names of the icons, from the snapshot of the icons package. */
export function iconNames(): string[] {
  return readFileSync(join(root, 'packages/icons/icon-names.txt'), 'utf8')
    .split('\n')
    .filter(Boolean);
}

/** The guide to building a design system on the library, shared with the documentation site. */
export function designSystemGuide(): string {
  return readFileSync(
    join(root, 'apps/storybook/src/guides/your-design-system-in-figma.md'),
    'utf8',
  );
}

/** Every component with the MDX of its documentation page. */
export function documentedComponents(): DocumentedComponent[] {
  return specs.map((spec) => ({ spec, page: pageOf(spec) }));
}

/** Every file of guidelines, by library. */
export function buildGuidelines(
  components = documentedComponents(),
  manifest: TokenManifest = manifestJson,
  icons = iconNames(),
  guide = designSystemGuide(),
): Guidelines {
  return {
    'ui-library': {
      'overview.md': libraryOverview(components),
      [DESIGN_SYSTEM_FILE]: guide,
      ...Object.fromEntries(
        components
          .filter(({ spec }) => spec.status === 'done' && spec.partOf === undefined)
          .map((component) => [componentFile(component.spec), componentGuideline(component)]),
      ),
    },
    foundations: { ...foundationsGuidelines(manifest), [DESIGN_SYSTEM_FILE]: guide },
    icons: { 'overview.md': iconGuidelines(icons) },
  };
}

/** The size of the guidelines of a library, in bytes as Figma counts them. */
export function sizeOf(files: Readonly<Record<string, string>>): number {
  return Object.values(files).reduce((sum, text) => sum + Buffer.byteLength(text, 'utf8'), 0);
}
