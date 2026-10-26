/**
 * One name in three places: the component `icon/<name>` in Figma, the file
 * `figma/<name>.svg` and the export `icon<Name>` in code.
 */

const ICON_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Whether a name is in kebab case, like `chevron-down`. */
export function isIconName(name: string): boolean {
  return ICON_NAME.test(name);
}

/**
 * The export of an icon in code: `chevron-down` becomes `iconChevronDown`. The prefix keeps every
 * name a valid identifier, `delete` included, and tells a reader what the constant holds.
 */
export function exportName(name: string): string {
  return `icon${name
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('')}`;
}
