'use client';

import {
  iconButton,
  type IconButtonProps as SharedIconButtonProps,
  type IconButtonSize,
  type IconButtonType,
  type IconButtonVariant,
} from '@mszczygiel-projects/ui-core-shared/icon-button';
import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import { type ComponentPropsWithRef, type ReactNode, useId } from 'react';

import { useActionRef } from '../internal/action.ts';
import { classNames } from '../internal/class-names.ts';
import { useUiCoreConfig } from '../internal/use-ui-core-config.ts';
import { Loader } from '../loader/Loader.tsx';

export type { IconButtonSize, IconButtonType, IconButtonVariant };

const { options } = iconButton;

/** The props of IconButton. Remaining attributes and ref reach its native button. */
export interface IconButtonProps
  extends
    SharedIconButtonProps,
    Omit<ComponentPropsWithRef<'button'>, keyof SharedIconButtonProps | 'children'> {
  /** The icon of the action. It is decorative; `label` names the action. */
  icon?: ReactNode;
}

/**
 * Triggers an action named only by an icon, as a square of the height of a button.
 *
 * It uses native click and form behaviour, as Button does. Loading retains the native button and
 * its accessible name, adding a description from the configuration while blocking activation.
 */
export function IconButton({
  label,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  type = 'button',
  name,
  value,
  loadingLabel,
  icon,
  className,
  ref,
  'aria-describedby': describedBy,
  ...rest
}: IconButtonProps) {
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
      aria-label={label === '' ? undefined : label}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      className={classNames(
        'ui-icon-button',
        'ui-icon-button__base',
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
      <span className="ui-icon-button__icon" aria-hidden="true">
        {icon}
      </span>
      {loading && (
        <span className="ui-icon-button__loader" aria-hidden="true">
          <Loader size={buttonSize === 'large' ? 'medium' : 'small'} />
        </span>
      )}
      {loading && (
        <span id={descriptionId} hidden>
          {loadingLabel ?? labels.iconButton.loading}
        </span>
      )}
    </button>
  );
}
