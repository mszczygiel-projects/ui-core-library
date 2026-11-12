'use client';

import { iconChevronDown } from '@mszczygiel-projects/ui-core-icons';
import {
  firstEnabled,
  flattenOptions,
} from '@mszczygiel-projects/ui-core-shared/listbox-navigation';
import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import {
  splitButton,
  type SplitButtonActionDetails as SharedActionDetails,
  type SplitButtonOpenChangeDetails as SharedOpenChangeDetails,
  type SplitButtonProps as SharedSplitButtonProps,
} from '@mszczygiel-projects/ui-core-shared/split-button';
import {
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useRef,
  useState,
} from 'react';

import { Button } from '../button/Button.tsx';
import { useActionRef } from '../internal/action.ts';
import { classNames } from '../internal/class-names.ts';
import { useFormState } from '../internal/use-form-state.ts';
import { useUiCoreConfig } from '../internal/use-ui-core-config.ts';
import { Menu } from '../menu/Menu.tsx';

/** What accompanies the menu of a split button that opens or closes at the request of the user. */
export type SplitButtonOpenChangeDetails = SharedOpenChangeDetails<Event>;

/** What accompanies the pick of an action from the menu: the key or pointer event that picked it. */
export type SplitButtonActionDetails = SharedActionDetails<Event>;

/**
 * The props of SplitButton. `className`, `style` and `data-*` attributes go to its root; other
 * attributes and `ref` reach its native main button.
 */
export interface SplitButtonProps
  extends
    SharedSplitButtonProps<ReactNode>,
    Omit<ComponentPropsWithRef<'button'>, keyof SharedSplitButtonProps> {
  /** The visible name of the main action. Supply text or non-interactive content. */
  children?: ReactNode;
  /** A decorative icon before the action name, in reading order. */
  leadingIcon?: ReactNode;
  /** A decorative icon after the action name, in reading order. */
  trailingIcon?: ReactNode;
  /** Whether the uncontrolled menu starts open. @default false */
  defaultOpen?: boolean;
  /** Called when the user asks to open or close the menu, with the reason and the native event. */
  onOpenChange?: (open: boolean, details: SplitButtonOpenChangeDetails) => void;
  /** Called when the user picks an action of the menu, with its value and the native event. */
  onAction?: (value: string, details: SplitButtonActionDetails) => void;
}

const { options: specOptions } = splitButton;

/** The keys that open the menu from its button, which a loading button ignores. */
const OPENING_KEYS = new Set(['Enter', ' ', 'ArrowDown', 'ArrowUp']);

function ignoreReset(): void {
  // An action has no state for a form reset to restore.
}

/**
 * Triggers a main action, with a button beside it that opens a menu of related actions.
 *
 * The main action is a native button with the click and form behaviour of Button, and `onClick`
 * is the main action alone. The menu button carries `aria-haspopup="menu"` and `aria-expanded`,
 * and opens a Menu at its end edge, which reports a pick through `onAction`. Disabled and loading
 * states block both halves; without an enabled action, the menu button is disabled.
 */
export function SplitButton({
  variant = 'primary',
  size = 'medium',
  shape = 'square',
  disabled = false,
  loading = false,
  open,
  defaultOpen = false,
  options = [],
  menuLabel,
  loadingLabel,
  onOpenChange,
  onAction,
  className,
  style,
  ...rest
}: SplitButtonProps) {
  const { labels } = useUiCoreConfig();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const toggleAction = useActionRef<HTMLButtonElement>(undefined);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const toggleElement = useCallback(
    (element: HTMLButtonElement) => {
      toggleRef.current = element;
      const release = toggleAction(element);
      return () => {
        toggleRef.current = null;
        release();
      };
    },
    [toggleAction],
  );
  // A disabled fieldset disables the menu button with the main one, which the browser decides.
  const fieldsetDisabled = useFormState(toggleRef, ignoreReset);
  const surface = oneOf(variant, specOptions.variant.options, specOptions.variant.default);
  const buttonSize = oneOf(size, specOptions.size.options, specOptions.size.default);
  const buttonShape = oneOf(shape, specOptions.shape.options, specOptions.shape.default);
  const hasEnabledAction = firstEnabled(flattenOptions(options)) !== undefined;
  const available = !disabled && !fieldsetDisabled && !loading && hasEnabledAction;
  // A menu of an action that stops being available closes with it, as setting open does.
  const isOpen = (open ?? uncontrolledOpen) && available;
  const data = Object.fromEntries(Object.entries(rest).filter(([key]) => key.startsWith('data-')));
  const attributes = Object.fromEntries(
    Object.entries(rest).filter(([key]) => !key.startsWith('data-')),
  );

  return (
    <span
      className={classNames(
        'ui-split-button',
        'ui-split-button__base',
        `ui-split-button--${surface}`,
        disabled && 'ui-split-button--disabled',
        className,
      )}
      style={style}
      role="group"
      {...data}
    >
      <Button
        {...attributes}
        className="ui-split-button__action"
        variant={surface}
        size={buttonSize}
        shape={buttonShape}
        disabled={disabled}
        loading={loading}
        loadingLabel={loadingLabel ?? labels.splitButton.loading}
      />
      <span className="ui-split-button__divider" aria-hidden="true" />
      <Menu
        className="ui-split-button__menu"
        onClick={(event: MouseEvent<HTMLSpanElement>) => {
          // A press on the menu button or on an action of the menu stays inside, so that a click
          // reaching the page is the main action alone. Native listeners within the React root
          // still hear it before React does.
          event.stopPropagation();
        }}
        open={isOpen}
        options={options}
        size={buttonSize}
        placement="bottom"
        align="end"
        onOpenChange={(next, details) => {
          if (next && !available) {
            return;
          }
          setUncontrolledOpen(next);
          onOpenChange?.(next, details);
        }}
        onAction={onAction}
        trigger={
          <button
            ref={toggleElement}
            type="button"
            className={classNames(
              'ui-split-button__toggle',
              'ui-action',
              `ui-action--${surface}`,
              `ui-action--${buttonSize}`,
              `ui-action--${buttonShape}`,
              loading && 'ui-action--loading',
            )}
            disabled={disabled || !hasEnabledAction}
            aria-label={menuLabel ?? labels.splitButton.menu}
            aria-disabled={(loading && !disabled && hasEnabledAction) || undefined}
            onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
              // A loading menu button keeps its focus and its name, and its keys open nothing; Tab
              // still leaves it.
              if (!available && OPENING_KEYS.has(event.key)) {
                event.preventDefault();
              }
            }}
          >
            <span
              className="ui-split-button__toggle-icon"
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: iconChevronDown }}
            />
          </button>
        }
      />
    </span>
  );
}
