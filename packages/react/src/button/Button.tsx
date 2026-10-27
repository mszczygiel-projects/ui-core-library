'use client';

import {
  button,
  type ButtonProps as SharedButtonProps,
  type ButtonSize,
  type ButtonType,
  type ButtonVariant,
} from '@mszczygiel-projects/ui-core-shared/button';
import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import { type ComponentPropsWithRef, type ReactNode, useId } from 'react';

import { useActionRef } from '../internal/action.ts';
import { classNames } from '../internal/class-names.ts';
import { rendersContent } from '../internal/renders-content.ts';
import { useUiCoreConfig } from '../internal/use-ui-core-config.ts';
import { Loader } from '../loader/Loader.tsx';

export type { ButtonSize, ButtonType, ButtonVariant };

const { options } = button;

/** The props of Button. Remaining attributes and ref reach its native button. */
export interface ButtonProps
  extends SharedButtonProps, Omit<ComponentPropsWithRef<'button'>, keyof SharedButtonProps> {
  /** The visible action name. Supply text or non-interactive content. */
  children?: ReactNode;
  /** A decorative icon before the action name, in reading order. */
  leadingIcon?: ReactNode;
  /** A decorative icon after the action name, in reading order. */
  trailingIcon?: ReactNode;
}

/**
 * Triggers an action, with optional icons and a loading state.
 *
 * It uses native click and form behaviour. Loading retains the native button and its accessible
 * name, adding a description from the configuration while blocking activation.
 */
export function Button({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  type = 'button',
  name,
  value,
  label,
  loadingLabel,
  children,
  leadingIcon,
  trailingIcon,
  className,
  ref,
  'aria-describedby': describedBy,
  ...rest
}: ButtonProps) {
  const { labels } = useUiCoreConfig();
  const descriptionId = useId();
  const buttonRef = useActionRef(ref);
  const buttonSize = oneOf(size, options.size.options, options.size.default);
  return (
    <button
      ref={buttonRef}
      type={oneOf(type, options.type.options, options.type.default)}
      name={name}
      value={value}
      disabled={disabled}
      aria-label={label}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      className={classNames(
        'ui-button',
        'ui-button__base',
        'ui-action',
        `ui-action--${oneOf(variant, options.variant.options, options.variant.default)}`,
        `ui-action--${buttonSize}`,
        loading && 'ui-action--loading',
        className,
      )}
      {...rest}
      aria-describedby={
        [describedBy, loading ? descriptionId : undefined].filter(Boolean).join(' ') || undefined
      }
    >
      <span className="ui-button__wrapper">
        <span className="ui-button__content">
          {rendersContent(leadingIcon) && (
            <span className="ui-button__leading-icon" aria-hidden="true">
              {leadingIcon}
            </span>
          )}
          <span className="ui-button__label">{children}</span>
          {rendersContent(trailingIcon) && (
            <span className="ui-button__trailing-icon" aria-hidden="true">
              {trailingIcon}
            </span>
          )}
        </span>
        {loading && (
          <span className="ui-button__loader" aria-hidden="true">
            <Loader size={buttonSize === 'large' ? 'medium' : 'small'} />
          </span>
        )}
      </span>
      {/* Inside the button, so that Button stays one element. Hidden text adds nothing to its
          name, and aria-describedby still reads it. */}
      {loading && (
        <span id={descriptionId} hidden>
          {loadingLabel ?? labels.button.loading}
        </span>
      )}
    </button>
  );
}
