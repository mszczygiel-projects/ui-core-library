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
  /** A decorative icon before the text, or the only content of the badge. */
  icon?: ReactNode;
}

/**
 * Marks a status, a category or a count with a short label, an icon or both.
 *
 * The badge is not interactive. Its text names it; a badge with only an icon becomes an image
 * named by `label`, or by an `aria-label` of the author.
 */
export function Badge({
  tone = 'neutral',
  variant = 'solid',
  size = 'medium',
  shape = 'rounded',
  label,
  icon,
  className,
  children,
  'aria-label': ariaLabel,
  ...rest
}: BadgeProps) {
  const hasIcon = rendersContent(icon);
  const iconOnly = hasIcon && !rendersContent(children);
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
      role={named ? 'img' : rest.role}
      aria-label={named ? name : iconOnly ? undefined : ariaLabel}
    >
      {hasIcon && (
        <span className="ui-badge__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      {!iconOnly && <span className="ui-badge__label">{children}</span>}
    </span>
  );
}
