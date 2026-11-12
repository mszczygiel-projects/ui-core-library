import {
  badge,
  type BadgeProps as SharedBadgeProps,
  type BadgeShape,
  type BadgeSize,
  type BadgeTone,
  type BadgeVariant,
} from '@mszczygiel-projects/ui-core-shared/badge';
import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import type { ComponentPropsWithRef, ReactNode } from 'react';

import { classNames } from '../internal/class-names.ts';
import { rendersContent } from '../internal/renders-content.ts';

export type { BadgeShape, BadgeSize, BadgeTone, BadgeVariant };

const { options } = badge;

/** The props of Badge. Other attributes of a `span` go to its root element. */
export interface BadgeProps
  extends SharedBadgeProps, Omit<ComponentPropsWithRef<'span'>, keyof SharedBadgeProps> {
  /**
   * Decorative content before the text, such as an icon or a status dot, which the author styles.
   * An icon takes the icon size of the badge.
   */
  leading?: ReactNode;
  /** Decorative content after the text, like `leading`. */
  trailing?: ReactNode;
}

/**
 * Marks a status, a category or a count with a short label and any content before or after it.
 *
 * The badge is not interactive. Its text names it; a badge without text becomes an image named by
 * `label`, or by an `aria-label` of the author.
 */
export function Badge({
  tone = 'neutral',
  variant = 'solid',
  size = 'medium',
  shape = 'rounded',
  label,
  leading,
  trailing,
  className,
  children,
  'aria-label': ariaLabel,
  ...rest
}: BadgeProps) {
  const hasLeading = rendersContent(leading);
  const hasTrailing = rendersContent(trailing);
  const iconOnly = (hasLeading || hasTrailing) && !rendersContent(children);
  const name = ariaLabel ?? label;
  const named = iconOnly && name !== undefined && name !== '';
  return (
    <span
      {...rest}
      className={classNames(
        'ui-badge',
        'ui-badge__base',
        `ui-badge--${oneOf(tone, options.tone.options, options.tone.default)}`,
        `ui-badge--${oneOf(variant, options.variant.options, options.variant.default)}`,
        `ui-badge--${oneOf(size, options.size.options, options.size.default)}`,
        `ui-badge--${oneOf(shape, options.shape.options, options.shape.default)}`,
        iconOnly && 'ui-badge--icon-only',
        className,
      )}
      // An explicit role of the author, such as status, stays; the image role is the fallback.
      role={rest.role ?? (named ? 'img' : undefined)}
      aria-label={named ? name : iconOnly ? undefined : ariaLabel}
    >
      {hasLeading && (
        <span className="ui-badge__leading" aria-hidden="true">
          {leading}
        </span>
      )}
      {!iconOnly && <span className="ui-badge__label">{children}</span>}
      {hasTrailing && (
        <span className="ui-badge__trailing" aria-hidden="true">
          {trailing}
        </span>
      )}
    </span>
  );
}
