import * as svgMap from '@mszczygiel-projects/ui-core-icons';

/** The name an icon is imported by, such as `iconCheck`. */
export type IconName = keyof typeof svgMap;

/** Every icon of the icons package, for the select of a story that takes an icon. */
export const iconOptions = Object.keys(svgMap) as IconName[];

export { svgMap };
