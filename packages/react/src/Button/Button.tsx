import type {
  AriaAttributes,
  CSSProperties,
  KeyboardEvent,
  MouseEvent,
  MouseEventHandler,
  ReactNode,
} from 'react';
import { Loader } from '../Loader/Loader.js';
import { pickAriaProps } from '../aria.js';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'small' | 'default' | 'large';

/**
 * Primary interactive control for triggering actions, with variant, size, icon, and loading support.
 *
 * Any `aria-*` attribute is forwarded to the root `<button>` (e.g. `aria-expanded`
 * injected by Popover when the button is its anchor). Component-managed attributes
 * (`aria-busy` while loading) take precedence.
 *
 * @example
 * <Button variant="secondary" size="large" onClick={save}>Save changes</Button>
 */
export interface ButtonProps extends AriaAttributes {
  /**
   * Visual emphasis of the button.
   * @default 'primary'
   */
  variant?: ButtonVariant;
  /**
   * Overall button height and typography scale.
   * @default 'default'
   */
  size?: ButtonSize;
  /** Replaces content with a spinner and disables interaction. */
  loading?: boolean;
  /** Disables the button. */
  disabled?: boolean;
  /**
   * Native button type.
   * @default 'button'
   */
  type?: 'button' | 'submit' | 'reset';
  /** Icon rendered inside the content area, before the label. */
  iconLeft?: ReactNode;
  /** Icon rendered inside the content area, after the label. */
  iconRight?: ReactNode;
  /** Icon in a separated box at the leading edge (before the separator). */
  leadingIcon?: ReactNode;
  /** Icon in a separated box at the trailing edge (after the separator). */
  trailingIcon?: ReactNode;
  /** When provided, leading icon box becomes an independent interactive zone (split mode). */
  onLeadingIconClick?: MouseEventHandler<HTMLSpanElement>;
  /** When provided, trailing icon box becomes an independent interactive zone (split mode). */
  onTrailingIconClick?: MouseEventHandler<HTMLSpanElement>;
  /** Button label content. */
  children?: ReactNode;
  /** Click handler for the main button area. */
  onClick?: MouseEventHandler<HTMLButtonElement>;
  /** Extra class names appended to the root element. */
  className?: string;
  /** Inline styles forwarded to the root element (positioning only — never visual styles). */
  style?: CSSProperties;
  /** Accessible name; use when the visible label is missing or insufficient. */
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
  ...aria
}: ButtonProps) {
  const loaderSize = size === 'large' ? 'default' : 'small';
  const isDisabled = disabled || loading;

  return (
    <button
      {...pickAriaProps(aria)}
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
