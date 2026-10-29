'use client';

import {
  listbox,
  type ListboxProps as SharedListboxProps,
  type ListboxValue,
  type ListboxValueChangeDetails as SharedValueChangeDetails,
} from '@mszczygiel-projects/ui-core-shared/listbox';
import {
  EMPTY_TYPEAHEAD,
  flattenOptions,
  indexOfValue,
  isChosen,
  moveHighlight,
  normalizeValue,
  toggleValue,
  typeahead,
  valuesOf,
} from '@mszczygiel-projects/ui-core-shared/listbox-navigation';
import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import {
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type ReactNode,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { choiceDescription } from '../internal/choice.tsx';
import { classNames } from '../internal/class-names.ts';
import {
  ListboxView,
  NativeSelect,
  optionId,
  type ReactListboxItems,
} from '../internal/listbox.tsx';
import { setRef } from '../internal/set-ref.ts';
import { useFormState } from '../internal/use-form-state.ts';
import { useUiCoreConfig } from '../internal/use-ui-core-config.ts';

export type {
  ListboxGroup,
  ListboxOption,
  ListboxSize,
  ListboxValue,
} from '@mszczygiel-projects/ui-core-shared/listbox';

/** The native event of the key or the pointer that made a choice, before React wraps it. */
export type ListboxValueChangeDetails = SharedValueChangeDetails<Event>;

/** Listbox props. Native attributes and ref reach the element with the role listbox. */
export interface ListboxProps
  extends
    SharedListboxProps<ReactNode>,
    Omit<
      ComponentPropsWithRef<'div'>,
      keyof SharedListboxProps | 'defaultValue' | 'children' | 'role' | 'onChange'
    > {
  /** The options, alone or in groups, each with an optional decorative icon. */
  options?: ReactListboxItems;
  /** The controlled value: a string, or a list of strings with `multiple`. */
  value?: ListboxValue;
  /** The initial uncontrolled value, restored by native form reset. */
  defaultValue?: ListboxValue;
  /** The native form ID attribute of the hidden select that submits the value. */
  form?: string;
  /** Called once per choice, with the new value and the native event. */
  onValueChange?: (value: ListboxValue, details: ListboxValueChangeDetails) => void;
}

const { options: specOptions } = listbox;

/**
 * A visible list of options from which a user chooses one value or several.
 *
 * The list takes one stop in the order of the Tab key and names its highlighted option with
 * `aria-activedescendant`. The arrow keys, Home, End, Page Up and Page Down move the highlight,
 * and typed letters move it to the option they start; in a single choice the choice follows the
 * highlight, and in a multiple choice Space and a click turn an option on and off. A hidden native
 * select submits one entry for each chosen value and validates `required`.
 */
export function Listbox({
  label,
  hint,
  size = 'medium',
  state = 'default',
  multiple = false,
  disabled = false,
  required = false,
  name,
  form,
  options = [],
  value,
  defaultValue,
  emptyLabel,
  onValueChange,
  className,
  style,
  dir,
  id,
  ref,
  onKeyDown,
  onFocus,
  'aria-describedby': describedBy,
  ...rest
}: ListboxProps) {
  const { labels } = useUiCoreConfig();
  const [uncontrolled, setUncontrolled] = useState<ListboxValue>(() =>
    normalizeValue(defaultValue, multiple),
  );
  const current = normalizeValue(value ?? uncontrolled, multiple);
  const [highlighted, setHighlighted] = useState(-1);
  const search = useRef(EMPTY_TYPEAHEAD);
  const generatedId = useId();
  const listId = id ?? `${generatedId}-listbox`;
  const labelId = `${generatedId}-label`;
  const hintId = `${generatedId}-hint`;
  const listRef = useRef<HTMLDivElement | null>(null);
  const selectRef = useRef<HTMLSelectElement | null>(null);
  const flat = flattenOptions(options);
  const known = new Set(flat.map((option) => option.value));
  const formDisabled = useFormState(selectRef, () => {
    setUncontrolled(normalizeValue(defaultValue, multiple));
  });
  const inactive = disabled || formDisabled;
  const appearance = oneOf(state, specOptions.state.options, specOptions.state.default);
  const data = Object.fromEntries(Object.entries(rest).filter(([key]) => key.startsWith('data-')));
  const attributes = Object.fromEntries(
    Object.entries(rest).filter(([key]) => !key.startsWith('data-')),
  );

  useLayoutEffect(() => {
    listRef.current
      ?.querySelector(`#${CSS.escape(optionId(listId, highlighted))}`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [highlighted, listId]);

  const choose = (index: number, originalEvent: Event) => {
    const option = flat[index];
    if (option === undefined || option.disabled === true || inactive) {
      return;
    }
    setHighlighted(index);
    if (!multiple && isChosen(current, option.value)) {
      return;
    }
    const next = multiple ? toggleValue(valuesOf(current), option.value) : option.value;
    setUncontrolled(next);
    onValueChange?.(next, { originalEvent });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (inactive || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    const moved = moveHighlight(flat, highlighted, event.key);
    const typed =
      moved === undefined
        ? typeahead(search.current, event.key, event.timeStamp, flat, highlighted)
        : undefined;
    if (typed !== undefined) {
      search.current = typed.state;
    }
    const next = moved ?? typed?.index;
    if (next !== undefined) {
      event.preventDefault();
      setHighlighted(next);
      if (!multiple && next >= 0) {
        choose(next, event.nativeEvent);
      }
      return;
    }
    if ((event.key === ' ' || event.key === 'Enter') && highlighted >= 0) {
      event.preventDefault();
      choose(highlighted, event.nativeEvent);
    }
  };

  return (
    <div
      {...data}
      dir={dir}
      style={style}
      className={classNames(
        'ui-listbox',
        'ui-listbox__base',
        `ui-listbox--${appearance}`,
        inactive && 'ui-listbox--disabled',
        className,
      )}
    >
      {label ? (
        <span id={labelId} className="ui-listbox__label">
          <span className="ui-listbox__label-text">{label}</span>
        </span>
      ) : null}
      <ListboxView
        block="listbox"
        id={listId}
        items={options}
        value={current}
        multiple={multiple}
        size={oneOf(size, specOptions.size.options, specOptions.size.default)}
        highlighted={highlighted}
        emptyLabel={emptyLabel ?? labels.listbox.empty}
        labelledBy={label ? labelId : undefined}
        ariaLabel={
          typeof attributes['aria-label'] === 'string' ? attributes['aria-label'] : undefined
        }
        describedBy={choiceDescription(describedBy, hint, hintId)}
        invalid={appearance === 'error'}
        required={required}
        disabled={inactive}
        focusable
        attributes={attributes}
        ref={(element: HTMLDivElement | null) => {
          listRef.current = element;
          const release = setRef(ref, element);
          return () => {
            listRef.current = null;
            release();
          };
        }}
        onChoose={(index, event) => {
          listRef.current?.focus();
          choose(index, event.nativeEvent);
        }}
        onHighlight={setHighlighted}
        onKeyDown={handleKeyDown}
        onFocus={(event) => {
          onFocus?.(event);
          if (highlighted < 0) {
            const chosen = indexOfValue(flat, valuesOf(current)[0] ?? '');
            setHighlighted(chosen >= 0 ? chosen : (moveHighlight(flat, -1, 'ArrowDown') ?? -1));
          }
        }}
      />
      <NativeSelect
        ref={selectRef}
        name={name}
        form={form}
        multiple={multiple}
        required={required}
        disabled={disabled}
        values={valuesOf(current).filter((item) => known.has(item))}
        onInvalid={() => {
          listRef.current?.focus();
        }}
      />
      {hint ? (
        <span id={hintId} className="ui-listbox__hint">
          <span className="ui-listbox__hint-text">{hint}</span>
        </span>
      ) : null}
    </div>
  );
}
