import type { CSSProperties, ReactNode } from 'react';
import './Badge.css';

export type BadgeVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'error' | 'info';
export type BadgeAppearance = 'solid' | 'subtle';
export type BadgeSize = 'small' | 'medium';
export type BadgeShape = 'rounded' | 'square';

export interface BadgeProps {
  variant?: BadgeVariant;
  /** Visual style — maps to the Figma `Style` property (renamed: `style` is the inline-style prop). */
  appearance?: BadgeAppearance;
  size?: BadgeSize;
  shape?: BadgeShape;
  /** Leading icon. Icon-only mode is derived automatically when no children are passed. */
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Accessible name; required in icon-only mode (renders role="img"). */
  'aria-label'?: string;
}

export function Badge({
  variant = 'neutral',
  appearance = 'solid',
  size = 'small',
  shape = 'rounded',
  icon,
  children,
  className,
  style,
  'aria-label': ariaLabel,
}: BadgeProps) {
  const iconOnly = Boolean(icon) && children == null;

  return (
    <span
      className={[
        'ui-badge',
        `ui-badge--${variant}`,
        `ui-badge--${appearance}`,
        size !== 'small' && `ui-badge--${size}`,
        shape !== 'rounded' && `ui-badge--${shape}`,
        iconOnly && 'ui-badge--icon-only',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
      role={iconOnly && ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
    >
      {icon && (
        <span className="ui-badge__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      {!iconOnly && <span className="ui-badge__label">{children}</span>}
    </span>
  );
}
