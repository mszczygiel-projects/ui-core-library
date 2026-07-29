import type { AriaAttributes, CSSProperties, ReactNode } from 'react';
import { type ButtonVariant, type ButtonSize } from '../Button/Button.js';
import { Loader } from '../Loader/Loader.js';
import { pickAriaProps } from '../aria.js';
import './LinkButton.css';

export type { ButtonVariant as LinkButtonVariant, ButtonSize as LinkButtonSize };

/**
 * Anchor element styled as a button, for navigation that should look like an action.
 *
 * @example
 * <LinkButton href="/pricing" variant="outline" iconRight={<IconArrowRight />}>See pricing</LinkButton>
 */
export interface LinkButtonProps extends AriaAttributes {
  /** Destination URL. */
  href: string;
  /** Native anchor target; `_blank` automatically adds `rel="noopener noreferrer"`. */
  target?: '_self' | '_blank' | '_parent' | '_top';
  /** Native anchor rel; overrides the automatic `_blank` fallback. */
  rel?: string;
  /**
   * Visual emphasis of the button.
   * @default 'primary'
   */
  variant?: ButtonVariant;
  /**
   * Overall height and typography scale.
   * @default 'default'
   */
  size?: ButtonSize;
  /** Replaces content with a spinner and blocks navigation. */
  loading?: boolean;
  /** Blocks navigation and applies disabled styling (`aria-disabled`). */
  disabled?: boolean;
  /** Icon rendered inside the content area, before the label. */
  iconLeft?: ReactNode;
  /** Icon rendered inside the content area, after the label. */
  iconRight?: ReactNode;
  /** Icon in a separated box at the leading edge (before the separator). */
  leadingIcon?: ReactNode;
  /** Icon in a separated box at the trailing edge (after the separator). */
  trailingIcon?: ReactNode;
  /** Link label content. */
  children?: ReactNode;
  /** Click handler; not called while disabled or loading. */
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  /** Extra class names appended to the root element. */
  className?: string;
  /** Inline styles forwarded to the root element (positioning only — never visual styles). */
  style?: CSSProperties;
  /** Accessible name; use when the visible label is missing or insufficient. */
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
  ...aria
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
      {...pickAriaProps(aria)}
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
