'use client';

import { iconChevronDown, iconClose } from '@mszczygiel-projects/ui-core-icons';
import {
  EMPTY_TYPEAHEAD,
  firstEnabled,
  flattenOptions,
  indexOfValue,
  lastEnabled,
  moveHighlight,
  typeahead,
} from '@mszczygiel-projects/ui-core-shared/listbox-navigation';
import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import type {
  SelectFieldOpenChangeDetails as SharedOpenChangeDetails,
  SelectFieldProps as SharedSelectFieldProps,
} from '@mszczygiel-projects/ui-core-shared/select-field';
import { textField } from '@mszczygiel-projects/ui-core-shared/text-field';
import {
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { Field, fieldDescription, fieldPart, splitFieldAttributes } from '../internal/field.tsx';
import {
  ListboxView,
  NativeSelect,
  optionId,
  type ReactListboxItems,
} from '../internal/listbox.tsx';
import { setRef } from '../internal/set-ref.ts';
import { useFormState } from '../internal/use-form-state.ts';
import { usePopup } from '../internal/use-popup.ts';
import { useUiCoreConfig } from '../internal/use-ui-core-config.ts';
import type { ListboxValueChangeDetails } from '../listbox/Listbox.tsx';

/** The native event that opened or closed the list, before React wraps it. */
export type SelectFieldOpenChangeDetails = SharedOpenChangeDetails<Event>;

/** SelectField props. Appearance attributes reach the root; native attributes and ref reach the trigger. */
export interface SelectFieldProps
  extends
    SharedSelectFieldProps<ReactNode>,
    Omit<
      ComponentPropsWithRef<'button'>,
      keyof SharedSelectFieldProps | 'defaultValue' | 'children' | 'type' | 'role' | 'onChange'
    > {
  /** The options, alone or in groups, each with an optional decorative icon. */
  options?: ReactListboxItems;
  /** The controlled value. Pair it with onValueChange to accept choices. */
  value?: string;
  /** The initial uncontrolled value, restored by native form reset. @default '' */
  defaultValue?: string;
  /** The controlled open state. Pair it with onOpenChange. */
  open?: boolean;
  /** Whether the uncontrolled list starts open. @default false */
  defaultOpen?: boolean;
  /** The native form ID attribute of the hidden select that submits the value. */
  form?: string;
  /** A decorative icon before the value, in reading order. */
  leadingIcon?: ReactNode;
  /** Called once per choice or clearing, with the new value and the native event. */
  onValueChange?: (value: string, details: ListboxValueChangeDetails) => void;
  /** Called when the user opens or closes the list. */
  onOpenChange?: (open: boolean, details: SelectFieldOpenChangeDetails) => void;
}

const { size: sizes } = textField.options;

/**
 * A field that opens a list of options from which a user chooses one value.
 *
 * The trigger is a button with the role combobox, which keeps the focus while its list is open
 * and names the highlighted option with `aria-activedescendant`. The arrow keys, Enter, Space, Home
 * and End open the list; in an open list they move the highlight, Enter and Space choose, Escape
 * and Tab close without a change, and typed letters move to the option they start, also while it
 * is closed. The list opens in the top layer, below the field or above it when the window has no
 * room below. A hidden native select submits the chosen value, or an empty string, and validates
 * `required`.
 */
export function SelectField({
  variant = 'outline',
  size = 'medium',
  labelPlacement = 'top',
  state = 'default',
  label,
  hint,
  placeholder,
  disabled = false,
  required = false,
  name,
  form,
  options = [],
  value,
  defaultValue = '',
  open,
  defaultOpen = false,
  clearable = false,
  clearLabel,
  emptyLabel,
  leadingIcon,
  onValueChange,
  onOpenChange,
  onKeyDown,
  onClick,
  id,
  className,
  style,
  dir,
  ref,
  'aria-describedby': describedBy,
  ...rest
}: SelectFieldProps) {
  const { labels } = useUiCoreConfig();
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const search = useRef(EMPTY_TYPEAHEAD);
  const current = value ?? uncontrolledValue;
  const attributes = splitFieldAttributes(rest);
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const hintId = `${generatedId}-hint`;
  const listId = `${generatedId}-listbox`;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const controlRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const selectRef = useRef<HTMLSelectElement | null>(null);
  const flat = flattenOptions(options);
  const chosenIndex = indexOfValue(flat, current);
  const chosen = flat[chosenIndex];
  const formDisabled = useFormState(selectRef, () => {
    setUncontrolledValue(defaultValue);
    setUncontrolledOpen(false);
  });
  const inactive = disabled || formDisabled;
  const isOpen = (open ?? uncontrolledOpen) && !inactive;
  const ariaLabel =
    typeof attributes.control['aria-label'] === 'string'
      ? attributes.control['aria-label']
      : undefined;

  const initialHighlight = () =>
    chosen !== undefined && chosen.disabled !== true ? chosenIndex : (firstEnabled(flat) ?? -1);

  const [highlighted, setHighlighted] = useState(() => (isOpen ? initialHighlight() : -1));
  const [wasOpen, setWasOpen] = useState(isOpen);
  // Props open and close the list too, by defaultOpen and controlled open, without setOpen.
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);
    if (!isOpen) {
      setHighlighted(-1);
    } else if (highlighted < 0) {
      setHighlighted(initialHighlight());
    }
  }

  const setOpen = (next: boolean, originalEvent: Event, highlight?: number) => {
    if (next && inactive) {
      return;
    }
    setHighlighted(next ? (highlight ?? initialHighlight()) : -1);
    if (next === isOpen) {
      return;
    }
    setUncontrolledOpen(next);
    onOpenChange?.(next, { originalEvent });
  };

  usePopup({
    open: isOpen,
    root: rootRef,
    anchor: controlRef,
    popup: popupRef,
    onDismiss: (event) => {
      setOpen(false, event);
    },
  });

  useEffect(() => {
    const root = rootRef.current;
    if (root === null) {
      return;
    }
    const events = new AbortController();
    root.addEventListener(
      'click',
      (event) => {
        // A click of the label only moves the focus, as the label of a native select does, and
        // never reaches the trigger, whose every activation toggles the list.
        const label = event.target instanceof Element ? event.target.closest('label') : null;
        if (label !== null && root.contains(label)) {
          event.preventDefault();
          triggerRef.current?.focus();
        }
      },
      { signal: events.signal },
    );
    return () => {
      events.abort();
    };
  }, []);

  useLayoutEffect(() => {
    if (isOpen) {
      popupRef.current
        ?.querySelector(`#${CSS.escape(optionId(listId, highlighted))}`)
        ?.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen, highlighted, listId]);

  const change = (next: string, originalEvent: Event) => {
    if (next === current) {
      return;
    }
    setUncontrolledValue(next);
    onValueChange?.(next, { originalEvent });
  };

  const choose = (index: number, originalEvent: Event) => {
    const option = flat[index];
    if (option === undefined || option.disabled === true) {
      return;
    }
    setOpen(false, originalEvent);
    triggerRef.current?.focus();
    change(option.value, originalEvent);
  };

  /** Moves the highlight to the option that typed letters start, and says whether it did. */
  const typeTo = (event: KeyboardEvent<HTMLButtonElement>, from: number): number | undefined => {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return undefined;
    }
    const typed = typeahead(search.current, event.key, event.timeStamp, flat, from);
    if (typed === undefined) {
      return undefined;
    }
    event.preventDefault();
    search.current = typed.state;
    return typed.index;
  };

  const handleClosedKey = (event: KeyboardEvent<HTMLButtonElement>, native: Event) => {
    const { key } = event;
    if (key === 'ArrowDown' || key === 'Enter' || key === ' ') {
      event.preventDefault();
      setOpen(true, native);
    } else if (key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true, native, chosenIndex >= 0 ? chosenIndex : (lastEnabled(flat) ?? -1));
    } else if (key === 'Home' || key === 'End') {
      event.preventDefault();
      setOpen(true, native, (key === 'Home' ? firstEnabled(flat) : lastEnabled(flat)) ?? -1);
    } else if ((key === 'Delete' || key === 'Backspace') && clearable) {
      event.preventDefault();
      change('', native);
    } else {
      const typed = typeTo(event, chosenIndex);
      if (typed !== undefined) {
        setOpen(true, native, typed);
      }
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(event);
    if (inactive || event.defaultPrevented || event.nativeEvent.isComposing) {
      return;
    }
    const native = event.nativeEvent;
    const { key } = event;
    if (!isOpen) {
      handleClosedKey(event, native);
      return;
    }
    if (key === 'Escape' || key === 'Tab') {
      if (key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
      }
      setOpen(false, native);
      return;
    }
    if (key === ' ') {
      const typed = typeTo(event, highlighted);
      if (typed !== undefined) {
        setHighlighted(typed);
        return;
      }
    }
    if (key === 'Enter' || key === ' ' || (key === 'ArrowUp' && event.altKey)) {
      event.preventDefault();
      if (highlighted >= 0) {
        choose(highlighted, native);
      } else {
        setOpen(false, native);
      }
      return;
    }
    const moved = moveHighlight(flat, highlighted, key);
    if (moved !== undefined) {
      event.preventDefault();
      setHighlighted(moved);
      return;
    }
    const typed = typeTo(event, highlighted);
    if (typed !== undefined) {
      setHighlighted(typed);
    }
  };

  const showClear = clearable && chosen !== undefined && !inactive;

  return (
    <Field
      block="select-field"
      controlId={triggerId}
      hintId={hintId}
      className={className}
      style={style}
      dir={dir}
      rootAttributes={attributes.root}
      modifiers={[isOpen && 'ui-select-field--open']}
      variant={variant}
      size={size}
      labelPlacement={labelPlacement}
      state={state}
      label={label}
      hint={hint}
      labelId={`${generatedId}-label`}
      rootRef={rootRef}
      controlRef={controlRef}
      popup={
        isOpen ? (
          <div
            ref={popupRef}
            className="ui-list__popup ui-select-field__popup"
            popover="manual"
            dir={dir}
          >
            <ListboxView
              block="select-field"
              id={listId}
              items={options}
              value={current}
              multiple={false}
              size={oneOf(size, sizes.options, sizes.default)}
              highlighted={highlighted}
              emptyLabel={emptyLabel ?? labels.listbox.empty}
              labelledBy={label ? `${generatedId}-label` : undefined}
              ariaLabel={label ? undefined : ariaLabel}
              focusable={false}
              onChoose={(index, event) => {
                choose(index, event.nativeEvent);
              }}
              onHighlight={setHighlighted}
            />
          </div>
        ) : null
      }
    >
      <div className={fieldPart('select-field', 'input-row')}>
        {leadingIcon === undefined || leadingIcon === null ? null : (
          <span className={fieldPart('select-field', 'leading-icon')} aria-hidden="true">
            {leadingIcon}
          </span>
        )}
        <button
          {...attributes.control}
          ref={(element) => {
            triggerRef.current = element;
            const release = setRef(ref, element);
            return () => {
              triggerRef.current = null;
              release();
            };
          }}
          id={triggerId}
          type="button"
          role="combobox"
          className={`${fieldPart('select-field', 'trigger')} ui-field__input${chosen === undefined ? ' ui-field__input--empty' : ''}`}
          disabled={inactive}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-activedescendant={
            isOpen && highlighted >= 0 ? optionId(listId, highlighted) : undefined
          }
          aria-invalid={state === 'error' || undefined}
          aria-required={required || undefined}
          aria-describedby={fieldDescription(describedBy, hint, hintId)}
          onClick={(event) => {
            onClick?.(event);
            // Any activation, by the pointer, a script or assistive technology, toggles the list.
            if (!event.defaultPrevented) {
              setOpen(!isOpen, event.nativeEvent);
            }
          }}
          onKeyDown={handleKeyDown}
        >
          <span
            className={`${fieldPart('select-field', 'value')}${chosen === undefined ? ' ui-select-field__value--placeholder' : ''}`}
          >
            {chosen?.label ?? placeholder ?? ''}
          </span>
        </button>
        <button
          type="button"
          className={`${fieldPart('select-field', 'clear')} ui-field__action`}
          hidden={!showClear}
          tabIndex={-1}
          aria-label={clearLabel ?? labels.selectField.clear}
          onClick={(event) => {
            triggerRef.current?.focus();
            change('', event.nativeEvent);
          }}
        >
          <span
            className="ui-field__action-icon"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: iconClose }}
          />
        </button>
        <span
          className={fieldPart('select-field', 'indicator')}
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: iconChevronDown }}
        />
      </div>
      <NativeSelect
        ref={selectRef}
        name={name}
        form={form}
        multiple={false}
        required={required}
        disabled={disabled}
        values={chosen === undefined ? [] : [chosen.value]}
        onInvalid={() => {
          triggerRef.current?.focus();
        }}
      />
    </Field>
  );
}
