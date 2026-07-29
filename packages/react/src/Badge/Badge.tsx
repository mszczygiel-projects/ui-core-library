import type { CSSProperties, ReactNode } from 'react';
import './Badge.css';

export type BadgeVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'error' | 'info';
export type BadgeAppearance = 'solid' | 'subtle';
export type BadgeSize = 'small' | 'medium';
export type BadgeShape = 'rounded' | 'square';

/**
 * Compact status label for counts, categories, and state indicators.
 *
 * @example
 * <Badge variant="success" appearance="subtle">Active</Badge>
 */
export interface BadgeProps {
  /**
   * Semantic color scheme.
   * @default 'neutral'
   */
  variant?: BadgeVariant;
  /**
   * Visual style — maps to the Figma `Style` property (renamed: `style` is the inline-style prop).
   * @default 'solid'
   */
  appearance?: BadgeAppearance;
  /**
   * Overall badge height and typography scale.
   * @default 'small'
   */
  size?: BadgeSize;
  /**
   * Corner rounding: fully rounded pill or square with small radius.
   * @default 'rounded'
   */
  shape?: BadgeShape;
  /** Leading icon. Icon-only mode is derived automatically when no children are passed. */
  icon?: ReactNode;
  /** Badge label content. */
  children?: ReactNode;
  /** Extra class names appended to the root element. */
  className?: string;
  /** Inline styles forwarded to the root element (positioning only — never visual styles). */
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
