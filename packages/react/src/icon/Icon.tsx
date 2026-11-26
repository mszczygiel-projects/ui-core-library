import type { ComponentPropsWithRef } from 'react';

import { classNames } from '../internal/class-names.ts';

const SIZES = ['2xs', 'xs', 'sm', 'md', 'lg'] as const;

/** A step of the icon size roles: `sm` is `--icon-sm`. */
export type IconSize = (typeof SIZES)[number];

/**
 * The props of Icon. Remaining attributes and ref reach its span, apart from those that would name
 * it or focus it, since it is hidden from assistive technology.
 */
export interface IconProps extends Omit<
  ComponentPropsWithRef<'span'>,
  | 'aria-describedby'
  | 'aria-hidden'
  | 'aria-label'
  | 'aria-labelledby'
  | 'children'
  | 'dangerouslySetInnerHTML'
  | 'role'
  | 'tabIndex'
> {
  // TypeScript accepts any hyphenated attribute that a type leaves out, so these are `never`.
  'aria-describedby'?: never;
  'aria-hidden'?: never;
  'aria-label'?: never;
  'aria-labelledby'?: never;
  /**
   * The SVG of the icon, such as `iconSearch` of the icons package. It is inserted as markup, so
   * pass only a string you trust, never text from a user or from a response of a server.
   */
  svg: string;
  /**
   * The size, from the icon tokens, which follow the density. Without it, the icon is as large as
   * the font size around it, which in a slot of a component is the icon size of that component.
   */
  size?: IconSize;
}

/**
 * Renders an icon given as a string of SVG.
 *
 * The icon is decorative and hidden from assistive technology: name the action or the content on
 * the element around it.
 */
export function Icon({ svg, size, className, ...rest }: IconProps) {
  // There is no default to fall back to: an unknown size leaves the icon to the font around it.
  const step = SIZES.find((candidate) => candidate === size);
  return (
    <span
      {...rest}
      className={classNames('ui-icon', step !== undefined && `ui-icon--${step}`, className)}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
