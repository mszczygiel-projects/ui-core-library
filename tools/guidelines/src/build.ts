import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { TokenManifest } from '@mszczygiel-projects/ui-core-foundations';
import manifestJson from '@mszczygiel-projects/ui-core-foundations/tokens.json' with { type: 'json' };
import type { ComponentSpec } from '@mszczygiel-projects/ui-core-shared/component';
import { specs } from '@mszczygiel-projects/ui-core-shared/components';

import { foundationsGuidelines } from './foundations.ts';
import { iconGuidelines } from './icons.ts';
import { componentFile, componentGuideline, libraryOverview } from './ui-library.ts';

/** The libraries of Figma, each with the files of its guidelines. */
export type Guidelines = Record<'ui-library' | 'foundations' | 'icons', Record<string, string>>;

/** Figma accepts at most this many bytes of guidelines per library. */
export const LIBRARY_LIMIT = 200 * 1024;

const root = join(import.meta.dirname, '..', '..', '..');

/** The MDX page of a component in the documentation site. */
export function pageOf(spec: ComponentSpec): string {
  return readFileSync(
    join(root, 'apps/storybook/src/components', spec.category.toLowerCase(), `${spec.name}.mdx`),
    'utf8',
  );
}

/** The export names of the icons, from the snapshot of the icons package. */
export function iconNames(): string[] {
  return readFileSync(join(root, 'packages/icons/icon-names.txt'), 'utf8')
    .split('\n')
    .filter(Boolean);
}

/** Every file of guidelines, by library. */
export function buildGuidelines(
  components = specs.map((spec) => ({ spec, page: pageOf(spec) })),
  manifest: TokenManifest = manifestJson,
  icons = iconNames(),
): Guidelines {
  return {
    'ui-library': {
      'overview.md': libraryOverview(components),
      ...Object.fromEntries(
        components
          .filter(({ spec }) => spec.status === 'done')
          .map((component) => [componentFile(component.spec), componentGuideline(component)]),
      ),
    },
    foundations: foundationsGuidelines(manifest),
    icons: { 'overview.md': iconGuidelines(icons) },
  };
}

/** The size of the guidelines of a library, in bytes as Figma counts them. */
export function sizeOf(files: Readonly<Record<string, string>>): number {
  return Object.values(files).reduce((sum, text) => sum + Buffer.byteLength(text, 'utf8'), 0);
}
