import { code, file } from './markdown.ts';

/** The export name of an icon, `iconChevronDown`, back to its component, `icon/chevron-down`. */
export function componentOf(exportName: string): string {
  return `icon/${exportName
    .replace(/^icon/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()}`;
}

/** The file of guidelines for [Core] Icons. */
export function iconGuidelines(exportNames: readonly string[]): string {
  return file(
    '# [Core] Icons',
    'IMPORTANT: Use only these icons, as instances. Do not draw an icon, import one from elsewhere, or detach and edit an instance.',
    `## Using an icon

- Put an icon into the icon slot of a component, such as the leading or trailing icon of a Button or a TextField. The component sets its size and colour.
- Outside a component, an icon is 24 by 24 and takes the colour role ${code('color/icon/default')}, or the text colour beside it.
- Choose an icon by its meaning. An icon that points a direction may need its mirrored counterpart in a right-to-left layout.

## Drawing a new icon

A new icon is a component ${code('icon/<name>')} in kebab case, drawn on a 24 by 24 grid in one colour, with fills and no strokes.`,
    `## Icons\n\n${exportNames.map((name) => `- ${code(componentOf(name))}`).join('\n')}`,
  );
}
