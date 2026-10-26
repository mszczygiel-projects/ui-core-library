import type { ManifestToken, TokenManifest } from '@mszczygiel-projects/ui-core-foundations';

import { code, file, table } from './markdown.ts';

const titleCase = (path: string) =>
  path
    .split('/')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('/');

/** The roles a designer binds: the variables of Surfaces and Sizes, with their descriptions. */
function roles(manifest: TokenManifest, collection: string, prefix: string): ManifestToken[] {
  return manifest.tokens.filter(
    (token) =>
      token.collection === collection &&
      token.path.startsWith(prefix) &&
      token.description !== undefined &&
      token.description !== '',
  );
}

const rows = (tokens: readonly ManifestToken[]) =>
  tokens.map((token) => [code(token.path), token.description ?? '']);

/** The files of guidelines for [Core] Foundations. */
export function foundationsGuidelines(manifest: TokenManifest): Record<string, string> {
  const colours = roles(manifest, 'Surfaces', 'color/');
  const groups = [...new Set(colours.map((token) => token.path.split('/')[1] ?? ''))];
  return {
    'overview.md': file(
      '# [Core] Foundations',
      'IMPORTANT: Every colour, size, radius, gap, padding and text style in a design comes from a variable or a style of this library. Never type a hex colour or a raw number where a variable applies.',
      `## Which variable to use

- Bind roles: the colour variables of Surfaces, the sizes of Sizes and the text styles. They follow the theme, the surface, the screen and the density.
- Primitives, such as ${code('gray/500')} or ${code('spacing/4')}, are fixed values. Use one only for a value that must not change with the theme or the density.
- Never bind a variable of the Components collection outside its component.`,
      `## Modes

Set these on a frame, and everything inside follows:

${table(
  ['Collection', 'Modes', 'Chooses'],
  [
    ['Themes', manifest.modes.theme.join(', '), 'light or dark colours'],
    ['Surfaces', manifest.modes.surface.join(', '), 'the background a frame stands on'],
    ['Sizes', 'Mobile, Desktop, Mobile Compact, Desktop Compact', 'the screen and the density'],
  ],
)}`,
      'Read colors.md, typography.md and spacing.md for the variables of each kind.',
    ),
    'colors.md': file(
      '# Colours',
      `Bind the colour roles below. Each one describes what it is for; choose by purpose, not by the colour it shows now. On a frame with another surface mode, the same role takes the colour that keeps contrast there.

## Which text colour?

- Body copy and headings: ${code('color/text/primary')}.
- Labels and supporting copy: ${code('color/text/secondary')}.
- Helper text and hints: ${code('color/text/muted')}.
- Placeholders in an empty field: ${code('color/text/placeholder')}.
- Text of a disabled control: ${code('color/disabled/text')}.
- Text on a coloured background: set the surface mode of its frame, such as Inverse or Primary, and keep the same roles; never white or black.`,
      ...groups.map(
        (group) =>
          `## ${titleCase(group)}\n\n${table(
            ['Variable', 'Use it for'],
            rows(colours.filter((token) => token.path.split('/')[1] === group)),
          )}`,
      ),
    ),
    'typography.md': file(
      '# Typography',
      'Set every text in one of these text styles. Do not set a font, a size, a weight or a line height by hand: the styles follow the brand and switch sizes on desktop. Bold words inside a style take its strong weight.',
      table(
        ['Text style', 'Code class'],
        manifest.textStyles.map((style) => [code(titleCase(style.name)), code(style.className)]),
      ),
    ),
    'spacing.md': file(
      '# Spacing, sizes and shapes',
      'Bind gaps, paddings, radii and sizes to these variables. They change with the screen and the density, so a design stays consistent in every mode.',
      table(['Variable', 'Use it for'], rows(roles(manifest, 'Sizes', ''))),
      table(
        ['Variable', 'Use it for'],
        rows(
          manifest.tokens.filter(
            (token) =>
              token.collection === 'Themes' &&
              /^(radius|stroke|ring)\//.test(token.path) &&
              token.description !== undefined &&
              token.description !== '',
          ),
        ),
      ),
    ),
  };
}
