'use client';

import { iconClose } from '@mszczygiel-projects/ui-core-icons';
import {
  chip,
  type ChipDismissDetail,
  type ChipProps as SharedChipProps,
  type ChipSelectedChangeDetails,
  type ChipSize,
  type ChipVariant,
} from '@mszczygiel-projects/ui-core-shared/chip';
import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import {
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
  useId,
  useState,
} from 'react';

import { classNames } from '../internal/class-names.ts';
import { rendersContent } from '../internal/renders-content.ts';
import { useUiCoreConfig } from '../internal/use-ui-core-config.ts';

export type { ChipSize, ChipVariant };

const { options } = chip;

/**
 * The props of Chip. `className`, `style`, `data-*` attributes and the ref go to its root element;
 * other attributes and handlers, such as `id`, `aria-*` and `onClick`, go to its control.
 */
export interface ChipProps
  extends
    SharedChipProps,
    Omit<ComponentPropsWithoutRef<'button'>, keyof SharedChipProps | 'type' | 'value'> {
  /** The controlled state of a selectable chip. Pair it with onSelectedChange to accept toggles. */
  selected?: boolean;
  /**
   * The initial state of an uncontrolled selectable chip.
   * @default false
   */
  defaultSelected?: boolean;
  /** Called with the new state when a user toggles a selectable chip. */
  onSelectedChange?: (selected: boolean, details: ChipSelectedChangeDetails<Event>) => void;
  /** Called when a user asks to remove the chip; the page removes it. */
  onDismiss?: (details: ChipDismissDetail<Event>) => void;
  /** A decorative icon before the text. */
  icon?: ReactNode;
  /** The root element. */
  ref?: Ref<HTMLSpanElement>;
}

/**
 * A compact choice that a user turns on and off, or a chosen value that a user removes.
 *
 * A selectable chip is a native toggle button, controlled with `selected` or uncontrolled with
 * `defaultSelected`. A chip that is not selectable shows static text. A dismissible chip adds a
 * button named by the dismiss label and the text of the chip, or the `aria-label` of the author;
 * it, Delete and Backspace call `onDismiss`, and the page removes the chip.
 */
export function Chip({
  variant = 'outline',
  size = 'medium',
  selectable = false,
  selected,
  defaultSelected = false,
  disabled = false,
  dismissible = false,
  dismissLabel,
  skipDismissInTabOrder = false,
  onSelectedChange,
  onDismiss,
  icon,
  children,
  className,
  style,
  ref,
  onClick,
  onKeyDown,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ...rest
}: ChipProps) {
  const { labels } = useUiCoreConfig();
  const [uncontrolled, setUncontrolled] = useState(defaultSelected);
  const generatedId = useId();
  const controlId = id ?? `${generatedId}-control`;
  const labelId = `${generatedId}-label`;
  const dismissLabelId = `${generatedId}-dismiss`;
  // A name the author gives the chip wins over its text, and names its dismiss button too.
  const named = ariaLabel !== undefined && ariaLabel !== '';
  const nameIds =
    ariaLabelledBy !== undefined && ariaLabelledBy !== ''
      ? ariaLabelledBy
      : named
        ? controlId
        : labelId;
  const nameAttributes = {
    id: controlId,
    'aria-label': named ? ariaLabel : undefined,
    'aria-labelledby': named ? ariaLabelledBy : nameIds,
  };
  const rootAttributes: Record<string, unknown> = {};
  const controlAttributes: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(rest)) {
    (name.startsWith('data-') ? rootAttributes : controlAttributes)[name] = value;
  }
  const isSelected = selectable && (selected ?? uncontrolled);
  const canDismiss = dismissible && !disabled;
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    // A disabled fieldset disables the control without the disabled prop.
    const inactive = event.currentTarget.matches(':disabled');
    if ((event.key === 'Delete' || event.key === 'Backspace') && canDismiss && !inactive) {
      event.preventDefault();
      onDismiss?.({ originalEvent: event.nativeEvent });
    }
  };
  const content = (
    <>
      {rendersContent(icon) && (
        <span className="ui-chip__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span id={labelId} className="ui-chip__label">
        {children}
      </span>
    </>
  );
  return (
    <span
      {...rootAttributes}
      ref={ref}
      style={style}
      className={classNames(
        'ui-chip',
        'ui-chip__base',
        className,
        `ui-chip--${oneOf(variant, options.variant.options, options.variant.default)}`,
        `ui-chip--${oneOf(size, options.size.options, options.size.default)}`,
        // A disabled chip shows its disabled state over its selection.
        isSelected && !disabled && 'ui-chip--selected',
        disabled && 'ui-chip--disabled',
        canDismiss && 'ui-chip--dismissible',
      )}
    >
      {selectable ? (
        <button
          type="button"
          {...controlAttributes}
          {...nameAttributes}
          className="ui-chip__control"
          disabled={disabled}
          aria-pressed={isSelected}
          onClick={(event: MouseEvent<HTMLButtonElement>) => {
            onClick?.(event);
            const next = !isSelected;
            if (selected === undefined) {
              setUncontrolled(next);
            }
            onSelectedChange?.(next, { originalEvent: event.nativeEvent });
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            handleKeyDown(event);
          }}
        >
          {content}
        </button>
      ) : (
        <span {...controlAttributes} {...nameAttributes} className="ui-chip__control">
          {content}
        </span>
      )}
      {canDismiss && (
        <button
          type="button"
          className="ui-chip__dismiss"
          tabIndex={skipDismissInTabOrder ? -1 : undefined}
          aria-labelledby={`${dismissLabelId} ${nameIds}`}
          onClick={(event) => {
            // The dismiss button acts on its own, so a listener of clicks on the chip never sees it.
            event.stopPropagation();
            onDismiss?.({ originalEvent: event.nativeEvent });
          }}
          onKeyDown={handleKeyDown}
        >
          <span id={dismissLabelId} hidden>
            {dismissLabel ?? labels.chip.dismiss}
          </span>
          {/* The icons package holds trusted SVG strings, drawn in currentColor. */}
          <span
            className="ui-chip__dismiss-icon"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: iconClose }}
          />
        </button>
      )}
    </span>
  );
}
