import type { CSSProperties, ReactNode } from 'react';
import { Loader } from '../loader/Loader.js';
import './icon-button.css';

export type {
  ButtonVariant as IconButtonVariant,
  ButtonSize as IconButtonSize,
} from '../button/Button.js';
import type { ButtonVariant, ButtonSize } from '../button/Button.js';

export interface IconButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  icon?: ReactNode;
  'aria-label': string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
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
}: IconButtonProps) {
  const loaderSize = size === 'large' ? 'default' : 'small';

  return (
    <button
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
