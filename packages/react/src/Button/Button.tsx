import type { CSSProperties, KeyboardEvent, MouseEvent, MouseEventHandler, ReactNode } from 'react';
import { Loader } from '../Loader/Loader.js';
import './Button.css';

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
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  /** When provided, leading icon box becomes an independent interactive zone (split mode). */
  onLeadingIconClick?: MouseEventHandler<HTMLSpanElement>;
  /** When provided, trailing icon box becomes an independent interactive zone (split mode). */
  onTrailingIconClick?: MouseEventHandler<HTMLSpanElement>;
  children?: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
  style?: CSSProperties;
  'aria-label'?: string;
}

function makeIconKeyDownHandler(
  handler: MouseEventHandler<HTMLSpanElement>,
): (e: KeyboardEvent<HTMLSpanElement>) => void {
  return (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handler(e as unknown as MouseEvent<HTMLSpanElement>);
    }
  };
}

export function Button({
  variant = 'primary',
  size = 'default',
  loading = false,
  disabled = false,
  type = 'button',
  iconLeft,
  iconRight,
  leadingIcon,
  trailingIcon,
  onLeadingIconClick,
  onTrailingIconClick,
  children,
  onClick,
  className,
  style,
  'aria-label': ariaLabel,
}: ButtonProps) {
  const loaderSize = size === 'large' ? 'default' : 'small';
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
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
      {leadingIcon && (
        <>
          <span
            className={[
              'ui-button__icon-box',
              'ui-button__icon-box--leading',
              onLeadingIconClick && !isDisabled && 'ui-button__icon-box--split',
            ]
              .filter(Boolean)
              .join(' ')}
            role={onLeadingIconClick && !isDisabled ? 'button' : undefined}
            tabIndex={onLeadingIconClick && !isDisabled ? 0 : undefined}
            aria-label={onLeadingIconClick && !isDisabled ? 'Leading action' : undefined}
            onClick={
              onLeadingIconClick && !isDisabled
                ? (e) => {
                    e.stopPropagation();
                    onLeadingIconClick(e);
                  }
                : undefined
            }
            onKeyDown={
              onLeadingIconClick && !isDisabled
                ? makeIconKeyDownHandler(onLeadingIconClick)
                : undefined
            }
          >
            {leadingIcon}
          </span>
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
          <span
            className={[
              'ui-button__icon-box',
              'ui-button__icon-box--trailing',
              onTrailingIconClick && !isDisabled && 'ui-button__icon-box--split',
            ]
              .filter(Boolean)
              .join(' ')}
            role={onTrailingIconClick && !isDisabled ? 'button' : undefined}
            tabIndex={onTrailingIconClick && !isDisabled ? 0 : undefined}
            aria-label={onTrailingIconClick && !isDisabled ? 'Trailing action' : undefined}
            onClick={
              onTrailingIconClick && !isDisabled
                ? (e) => {
                    e.stopPropagation();
                    onTrailingIconClick(e);
                  }
                : undefined
            }
            onKeyDown={
              onTrailingIconClick && !isDisabled
                ? makeIconKeyDownHandler(onTrailingIconClick)
                : undefined
            }
          >
            {trailingIcon}
          </span>
        </>
      )}
    </button>
  );
}
