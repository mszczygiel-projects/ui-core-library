import type { AriaAttributes, CSSProperties, ReactNode } from 'react';
import { Loader } from '../Loader/Loader.js';
import { pickAriaProps } from '../aria.js';
import './IconButton.css';

export type {
  ButtonVariant as IconButtonVariant,
  ButtonSize as IconButtonSize,
} from '../Button/Button.js';
import type { ButtonVariant, ButtonSize } from '../Button/Button.js';

/**
 * Square button holding a single icon, for actions with no visible text label.
 *
 * Any `aria-*` attribute is forwarded to the root `<button>` (e.g. `aria-expanded`
 * injected by Popover when the button is its anchor). Component-managed attributes
 * (`aria-busy` while loading) take precedence.
 *
 * @example
 * <IconButton variant="ghost" icon={<IconClose />} aria-label="Close dialog" onClick={close} />
 */
export interface IconButtonProps extends AriaAttributes {
  /**
   * Visual emphasis of the button.
   * @default 'primary'
   */
  variant?: ButtonVariant;
  /**
   * Overall button size.
   * @default 'default'
   */
  size?: ButtonSize;
  /** Replaces the icon with a spinner and disables interaction. */
  loading?: boolean;
  /** Disables the button. */
  disabled?: boolean;
  /**
   * Native button type.
   * @default 'button'
   */
  type?: 'button' | 'submit' | 'reset';
  /** The icon to display. */
  icon?: ReactNode;
  /** Accessible name — required because the button has no visible text. */
  'aria-label': string;
  /** Click handler. */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  /** Extra class names appended to the root element. */
  className?: string;
  /** Inline styles forwarded to the root element (positioning only — never visual styles). */
  style?: CSSProperties;
}

export function IconButton({
  variant = 'primary',
  size = 'default',
  loading = false,
  disabled = false,
  type = 'button',
  icon,
  'aria-label': ariaLabel,
  onClick,
  className,
  style,
  ...aria
}: IconButtonProps) {
  const loaderSize = size === 'large' ? 'default' : 'small';

  return (
    <button
      {...pickAriaProps(aria)}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading ? 'true' : undefined}
      aria-label={ariaLabel}
      onClick={onClick}
      className={[
        'ui-icon-button',
        `ui-icon-button--${variant}`,
        size !== 'default' && `ui-icon-button--${size}`,
        loading && 'ui-icon-button--loading',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      {loading ? (
        <Loader size={loaderSize} label="Loading" />
      ) : (
        icon && <span className="ui-icon-button__icon">{icon}</span>
      )}
    </button>
  );
}
