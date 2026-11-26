import type { ComponentPropsWithRef } from 'react';

import { classNames } from '../internal/class-names.ts';

/** A step of the icon size roles: `sm` is `--icon-sm`. */
export type IconSize = '2xs' | 'xs' | 'sm' | 'md' | 'lg';

/** The props of Icon. Remaining attributes and ref reach its span. */
export interface IconProps extends Omit<
  ComponentPropsWithRef<'span'>,
  'aria-hidden' | 'children' | 'dangerouslySetInnerHTML'
> {
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
  return (
    <span
      {...rest}
      className={classNames('ui-icon', size !== undefined && `ui-icon--${size}`, className)}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
