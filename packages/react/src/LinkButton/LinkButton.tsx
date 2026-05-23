import type { CSSProperties, ReactNode } from 'react';
import { type ButtonVariant, type ButtonSize } from '../Button/Button.js';
import { Loader } from '../Loader/Loader.js';
import './LinkButton.css';

export type { ButtonVariant as LinkButtonVariant, ButtonSize as LinkButtonSize };

export interface LinkButtonProps {
  href: string;
  target?: '_self' | '_blank' | '_parent' | '_top';
  rel?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  children?: ReactNode;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  className?: string;
  style?: CSSProperties;
  'aria-label'?: string;
}

export function LinkButton({
  href,
  target,
  rel,
  variant = 'primary',
  size = 'default',
  loading = false,
  disabled = false,
  iconLeft,
  iconRight,
  leadingIcon,
  trailingIcon,
  children,
  onClick,
  className,
  style,
  'aria-label': ariaLabel,
}: LinkButtonProps) {
  const isInactive = disabled || loading;
  const loaderSize = size === 'large' ? 'default' : 'small';
  const computedRel = rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (isInactive) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  }

  return (
    <a
      href={href}
      target={target}
      rel={computedRel}
      aria-disabled={isInactive ? 'true' : undefined}
      aria-busy={loading ? 'true' : undefined}
      aria-label={ariaLabel}
      tabIndex={isInactive ? -1 : undefined}
      onClick={handleClick}
      className={[
        'ui-button',
        `ui-button--${variant}`,
        size !== 'default' && `ui-button--${size}`,
        loading && 'ui-button--loading',
        isInactive && 'ui-link-button--disabled',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      {leadingIcon && (
        <>
          <span className="ui-button__icon-box ui-button__icon-box--leading">{leadingIcon}</span>
          <span className="ui-button__separator" aria-hidden="true" />
        </>
      )}

      <span className="ui-button__content">
        {loading ? (
          <Loader size={loaderSize} label="Loading" />
        ) : (
          iconLeft && <span className="ui-button__icon">{iconLeft}</span>
        )}
        <span className="ui-button__label">{children}</span>
        {!loading && iconRight && <span className="ui-button__icon">{iconRight}</span>}
      </span>

      {trailingIcon && (
        <>
          <span className="ui-button__separator" aria-hidden="true" />
          <span className="ui-button__icon-box ui-button__icon-box--trailing">{trailingIcon}</span>
        </>
      )}
    </a>
  );
}
