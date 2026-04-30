import type { CSSProperties, ReactNode } from 'react';
import { Loader } from '../loader/Loader.js';
import './button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'small' | 'default' | 'large';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  children?: ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
  style?: CSSProperties;
  'aria-label'?: string;
}

export function Button({
  variant = 'primary',
  size = 'default',
  loading = false,
  disabled = false,
  type = 'button',
  iconLeft,
  iconRight,
  children,
  onClick,
  className,
  style,
  'aria-label': ariaLabel,
}: ButtonProps) {
  const loaderSize = size === 'large' ? 'default' : 'small';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading ? 'true' : undefined}
      aria-label={ariaLabel}
      onClick={onClick}
      className={[
        'ui-button',
        `ui-button--${variant}`,
        size !== 'default' && `ui-button--${size}`,
        loading && 'ui-button--loading',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      {loading ? (
        <Loader size={loaderSize} label="Loading" />
      ) : (
        iconLeft && <span className="ui-button__icon">{iconLeft}</span>
      )}
      <span className="ui-button__label">{children}</span>
      {!loading && iconRight && <span className="ui-button__icon">{iconRight}</span>}
    </button>
  );
}
