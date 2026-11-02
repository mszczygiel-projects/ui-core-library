'use client';

import { iconChevronDown, iconClose } from '@mszczygiel-projects/ui-core-icons';
import {
  combobox,
  type ComboboxProps as SharedComboboxProps,
  type ComboboxQueryDetails as SharedQueryDetails,
} from '@mszczygiel-projects/ui-core-shared/combobox';
import type { ListboxOption, ListboxValue } from '@mszczygiel-projects/ui-core-shared/listbox';
import {
  filterItems,
  firstEnabled,
  flattenOptions,
  hasExactLabel,
  indexOfValue,
  isChosen,
  lastEnabled,
  moveHighlight,
  normalizeValue,
  toggleValue,
  valuesOf,
} from '@mszczygiel-projects/ui-core-shared/listbox-navigation';
import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import { textField } from '@mszczygiel-projects/ui-core-shared/text-field';
import {
  type ChangeEvent,
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { Chip } from '../chip/Chip.tsx';
import {
  Field,
  fieldDescription,
  fieldPart,
  fieldPlaceholder,
  splitFieldAttributes,
} from '../internal/field.tsx';
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
import { Loader } from '../loader/Loader.tsx';
import type { SelectFieldOpenChangeDetails } from '../select-field/SelectField.tsx';

export type { ComboboxFilterMode } from '@mszczygiel-projects/ui-core-shared/combobox';

/** The native event that changed the query or asked to create an option, before React wraps it. */
export type ComboboxQueryDetails = SharedQueryDetails<Event>;

/** Combobox props. Appearance attributes reach the root; native attributes and ref reach the input. */
export interface ComboboxProps
  extends
    SharedComboboxProps<ReactNode>,
    Omit<
      ComponentPropsWithRef<'input'>,
      | keyof SharedComboboxProps
      | 'defaultValue'
      | 'children'
      | 'type'
      | 'role'
      | 'onChange'
      | 'size'
      | 'multiple'
    > {
  /** The options, alone or in groups, each with an optional decorative icon. */
  options?: ReactListboxItems;
  /** The controlled value: a string, or a list of strings with `multiple`. Pair it with onValueChange. */
  value?: ListboxValue;
  /** The initial uncontrolled value, restored by native form reset. */
  defaultValue?: ListboxValue;
  /** The controlled open state. Pair it with onOpenChange. */
  open?: boolean;
  /** Whether the uncontrolled list starts open. @default false */
  defaultOpen?: boolean;
  /** The native form ID attribute of the hidden select that submits the value. */
  form?: string;
  /** A decorative icon before the chips and the query, in reading order. */
  leadingIcon?: ReactNode;
  /** Called once per choice, removal or clearing, with the new value and the native event. */
  onValueChange?: (value: ListboxValue, details: ListboxValueChangeDetails) => void;
  /** Called when the user opens or closes the list. */
  onOpenChange?: (open: boolean, details: SelectFieldOpenChangeDetails) => void;
  /** Called when the user changes the query, by typing or by a choice that empties it. */
  onQueryChange?: (query: string, details: ComboboxQueryDetails) => void;
  /** Called when the user chooses to create an option from the query; add it and choose it. */
  onCreate?: (query: string, details: ComboboxQueryDetails) => void;
}

const { size: sizes } = textField.options;
const { filterMode: filterModes } = combobox.options;

/** The keys that move the highlight of an open list; Home and End stay with the text. */
const MOVING_KEYS = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp']);

/** The chosen options seen so far, whose labels outlast them in remote filtering. */
function rememberChosen(
  known: ReadonlyMap<string, ListboxOption<ReactNode>>,
  options: readonly ListboxOption<ReactNode>[],
  value: ListboxValue,
): ReadonlyMap<string, ListboxOption<ReactNode>> {
  const next = new Map<string, ListboxOption<ReactNode>>();
  for (const [key, option] of known) {
    if (isChosen(value, key)) {
      next.set(key, option);
    }
  }
  for (const option of options) {
    if (isChosen(value, option.value)) {
      next.set(option.value, option);
    }
  }
  return next;
}

/**
 * A text field that filters a list of options from which a user chooses one value or several.
 *
 * The input has the role combobox and list autocomplete: typing opens the list, filters it and
 * highlights the first match, which Enter chooses. The arrow keys and Page Up and Page Down move
 * the highlight; Home, End and the left and right arrows move the cursor in the text. Escape,
 * Tab and a press outside close the list, and the query, which is never a value, gives way to the
 * label of the chosen option. A multiple choice shows its options as chips before the query, keeps
 * the list open while a user chooses, and removes the last chip with Backspace in an empty query.
 * With `filterMode="remote"`, the author filters the options from `onQueryChange`; a chosen
 * option keeps its label after it leaves the options. `allowCreate` offers to create an option
 * from a query that no label equals, with `onCreate`. A hidden native select submits one entry
 * for each chosen value and validates `required`.
 */
export function Combobox({
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
  defaultValue,
  multiple = false,
  open,
  defaultOpen = false,
  clearable = false,
  filterMode = 'local',
  loading = false,
  allowCreate = false,
  clearLabel,
  emptyLabel,
  loadingLabel,
  getCreateLabel,
  leadingIcon,
  onValueChange,
  onOpenChange,
  onQueryChange,
  onCreate,
  onKeyDown,
  onClick,
  id,
  className,
  style,
  dir,
  ref,
  'aria-describedby': describedBy,
  ...rest
}: ComboboxProps) {
  const { labels } = useUiCoreConfig();
  const [uncontrolledValue, setUncontrolledValue] = useState(() =>
    normalizeValue(defaultValue, multiple),
  );
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const [query, setQueryState] = useState('');
  /** The text of the input while a composition, such as a Japanese one, is not finished. */
  const [draft, setDraft] = useState<string | undefined>(undefined);
  /** Whether the input of a single choice shows the query instead of the chosen label. */
  const [editing, setEditing] = useState(false);
  const [highlightState, setHighlighted] = useState(-1);
  const current = normalizeValue(value ?? uncontrolledValue, multiple);
  const flatOptions = flattenOptions(options);
  const [seen, setSeen] = useState(() => ({
    options,
    known: rememberChosen(new Map(), flatOptions, current),
  }));
  // New options or a new value: remember the chosen options they hold, while rendering.
  if (seen.options !== options) {
    setSeen({ options, known: rememberChosen(seen.known, flatOptions, current) });
  }
  const attributes = splitFieldAttributes(rest);
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${generatedId}-hint`;
  const listId = `${generatedId}-listbox`;
  const labelId = `${generatedId}-label`;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const controlRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const selectRef = useRef<HTMLSelectElement | null>(null);
  const formDisabled = useFormState(selectRef, () => {
    setUncontrolledValue(normalizeValue(defaultValue, multiple));
    setUncontrolledOpen(false);
    setQueryState('');
    setEditing(false);
  });
  const inactive = disabled || formDisabled;
  const isOpen = (open ?? uncontrolledOpen) && !inactive;
  const remote = oneOf(filterMode, filterModes.options, filterModes.default) === 'remote';
  const fieldSize = oneOf(size, sizes.options, sizes.default);
  const ariaLabel =
    typeof attributes.control['aria-label'] === 'string'
      ? attributes.control['aria-label']
      : undefined;

  const known = [
    ...flatOptions,
    ...[...seen.known.values()].filter(
      (option) => !flatOptions.some((candidate) => candidate.value === option.value),
    ),
  ];
  const chosen = valuesOf(current).flatMap((item) => {
    const option = known.find((candidate) => candidate.value === item);
    return option === undefined ? [] : [option];
  });
  const visibleOf = (text: string) => (remote ? options : filterItems(options, text));
  const createOf = (text: string) => {
    const trimmed = text.trim();
    return !allowCreate || loading || trimmed === '' || hasExactLabel(options, trimmed)
      ? undefined
      : (getCreateLabel ?? labels.combobox.create)(trimmed);
  };
  const rowsOf = (text: string): readonly ListboxOption<unknown>[] => {
    if (loading) {
      return [];
    }
    const visible = flattenOptions(visibleOf(text));
    const create = createOf(text);
    return create === undefined ? visible : [...visible, { value: '', label: create }];
  };
  const visible = visibleOf(query);
  const visibleOptions = flattenOptions(visible);
  const createLabel = createOf(query);
  const rows = rowsOf(query);
  const initialHighlight = () => {
    const index = rows.findIndex((row) => row.disabled !== true && isChosen(current, row.value));
    return index >= 0 ? index : (firstEnabled(rows) ?? -1);
  };
  // Props open the list too, without a key or a press: the highlight then starts where it would.
  const highlighted = !isOpen
    ? -1
    : highlightState >= 0 && highlightState < rows.length
      ? highlightState
      : initialHighlight();

  const setQuery = (next: string, originalEvent: Event) => {
    setDraft(undefined);
    if (next === query) {
      return;
    }
    setQueryState(next);
    onQueryChange?.(next, { originalEvent });
  };

  const setOpen = (next: boolean, originalEvent: Event, highlight?: number) => {
    if (next && inactive) {
      return;
    }
    setHighlighted(next ? (highlight ?? -1) : -1);
    if (!next) {
      // The query is never a value: closing gives way to the chosen label again.
      setEditing(false);
      setQuery('', originalEvent);
    }
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

  useLayoutEffect(() => {
    if (isOpen) {
      popupRef.current
        ?.querySelector(`#${CSS.escape(optionId(listId, highlighted))}`)
        ?.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen, highlighted, listId]);

  const change = (next: ListboxValue, originalEvent: Event) => {
    const shaped = normalizeValue(next, multiple);
    setUncontrolledValue(shaped);
    setSeen((previous) => ({
      options: previous.options,
      known: rememberChosen(previous.known, known, shaped),
    }));
    onValueChange?.(shaped, { originalEvent });
  };

  const choose = (index: number, originalEvent: Event) => {
    inputRef.current?.focus();
    if (index === visibleOptions.length && createLabel !== undefined) {
      onCreate?.(query.trim(), { originalEvent });
      if (multiple) {
        setQuery('', originalEvent);
      } else {
        setOpen(false, originalEvent);
      }
      return;
    }
    const option = visibleOptions[index];
    if (option === undefined || option.disabled === true) {
      return;
    }
    if (!multiple) {
      setOpen(false, originalEvent);
      if (option.value !== current) {
        change(option.value, originalEvent);
      }
      return;
    }
    change(toggleValue(valuesOf(current), option.value), originalEvent);
    if (query !== '') {
      setQuery('', originalEvent);
      // The list shows every option again, with the highlight on the one just chosen.
      setHighlighted(indexOfValue(flattenOptions(visibleOf('')), option.value));
    }
  };

  const remove = (item: string, originalEvent: Event) => {
    change(
      valuesOf(current).filter((candidate) => candidate !== item),
      originalEvent,
    );
    inputRef.current?.focus();
  };

  const clear = (originalEvent: Event) => {
    inputRef.current?.focus();
    setEditing(false);
    setQuery('', originalEvent);
    if (valuesOf(current).length > 0) {
      change(multiple ? [] : '', originalEvent);
    }
  };

  const commitQuery = (text: string, originalEvent: Event) => {
    setEditing(true);
    setQuery(text, originalEvent);
    setOpen(true, originalEvent, text.trim() === '' ? -1 : (firstEnabled(rowsOf(text)) ?? -1));
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value;
    // A composition, such as a Japanese one, filters once it ends.
    if (event.nativeEvent instanceof InputEvent && event.nativeEvent.isComposing) {
      setDraft(text);
      return;
    }
    commitQuery(text, event.nativeEvent);
  };

  const removeLast = (event: KeyboardEvent<HTMLInputElement>) => {
    const last = valuesOf(current).at(-1);
    if (multiple && query === '' && last !== undefined) {
      event.preventDefault();
      remove(last, event.nativeEvent);
    }
  };

  const lastHighlight = () => {
    const index = rows.findLastIndex(
      (row) => row.disabled !== true && isChosen(current, row.value),
    );
    return index >= 0 ? index : (lastEnabled(rows) ?? -1);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (inactive || event.defaultPrevented || event.nativeEvent.isComposing) {
      return;
    }
    const native = event.nativeEvent;
    const { key } = event;
    if (!isOpen) {
      if (key === 'ArrowDown' || key === 'ArrowUp') {
        event.preventDefault();
        setOpen(
          true,
          native,
          key === 'ArrowDown' || event.altKey ? initialHighlight() : lastHighlight(),
        );
      } else if (key === 'Backspace') {
        removeLast(event);
      }
      return;
    }
    if (key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false, native);
    } else if (key === 'Tab' || (key === 'ArrowUp' && event.altKey)) {
      setOpen(false, native);
    } else if (key === 'Enter') {
      if (highlighted >= 0) {
        event.preventDefault();
        choose(highlighted, native);
      }
    } else if (MOVING_KEYS.has(key)) {
      event.preventDefault();
      setHighlighted(moveHighlight(rows, highlighted, key) ?? highlighted);
    } else if (key === 'Backspace') {
      removeLast(event);
    }
  };

  const rootClick = useRef<(event: MouseEvent) => void>(() => undefined);
  useLayoutEffect(() => {
    rootClick.current = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const label = target.closest('label');
      if (label !== null && rootRef.current?.contains(label) === true) {
        // A click of the label only moves the focus, as on the other fields with a list.
        event.preventDefault();
        inputRef.current?.focus();
        return;
      }
      const row = target.closest('.ui-combobox__input-row');
      if (
        row === null ||
        inactive ||
        target.closest('.ui-chip, .ui-field__action, input') !== null
      ) {
        return;
      }
      // A press elsewhere in the row focuses the input; the arrow also opens and closes the list.
      inputRef.current?.focus();
      setOpen(target.closest('.ui-combobox__indicator') === null ? true : !isOpen, event);
    };
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
        rootClick.current(event);
      },
      { signal: events.signal },
    );
    return () => {
      events.abort();
    };
  }, []);

  const shown = draft ?? (multiple || editing ? query : (chosen[0]?.label ?? ''));
  const showClear = clearable && !inactive && (chosen.length > 0 || query !== '');
  const chips = multiple ? chosen : [];

  return (
    <Field
      block="combobox"
      controlId={inputId}
      hintId={hintId}
      className={className}
      style={style}
      dir={dir}
      rootAttributes={attributes.root}
      modifiers={[isOpen && 'ui-combobox--open']}
      variant={variant}
      size={size}
      labelPlacement={labelPlacement}
      state={state}
      label={label}
      hint={hint}
      labelId={labelId}
      rootRef={rootRef}
      controlRef={controlRef}
      popup={
        isOpen ? (
          <div
            ref={popupRef}
            className="ui-list__popup ui-combobox__popup"
            popover="manual"
            dir={dir}
          >
            <ListboxView
              block="combobox"
              id={listId}
              items={loading ? [] : visible}
              value={current}
              multiple={multiple}
              size={fieldSize}
              highlighted={highlighted}
              emptyLabel={emptyLabel ?? labels.listbox.empty}
              create={createLabel}
              loader={
                loading ? (
                  <span className="ui-combobox__message-loader" aria-hidden="true">
                    <Loader size="small" />
                  </span>
                ) : undefined
              }
              loadingLabel={loadingLabel ?? labels.listbox.loading}
              labelledBy={label ? labelId : undefined}
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
      <div className={fieldPart('combobox', 'input-row')}>
        {leadingIcon === undefined || leadingIcon === null ? null : (
          <span className={fieldPart('combobox', 'leading-icon')} aria-hidden="true">
            {leadingIcon}
          </span>
        )}
        <div className="ui-combobox__chips">
          {chips.map((option) => (
            <Chip
              key={option.value}
              className="ui-combobox__chip"
              size={fieldSize === 'large' ? 'medium' : 'small'}
              dismissible
              skipDismissInTabOrder
              disabled={inactive}
              onDismiss={({ originalEvent }) => {
                if (!inactive) {
                  remove(option.value, originalEvent);
                }
              }}
            >
              {option.label}
            </Chip>
          ))}
          <input
            {...attributes.control}
            ref={(element) => {
              inputRef.current = element;
              const release = setRef(ref, element);
              return () => {
                inputRef.current = null;
                release();
              };
            }}
            id={inputId}
            type="text"
            role="combobox"
            className={fieldPart('combobox', 'input')}
            autoComplete="off"
            spellCheck={false}
            value={shown}
            placeholder={chips.length > 0 ? undefined : fieldPlaceholder(placeholder)}
            disabled={inactive}
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-controls={listId}
            aria-activedescendant={
              isOpen && highlighted >= 0 ? optionId(listId, highlighted) : undefined
            }
            aria-invalid={state === 'error' || undefined}
            aria-required={required || undefined}
            aria-describedby={fieldDescription(describedBy, hint, hintId)}
            onChange={handleChange}
            onCompositionEnd={(event) => {
              commitQuery(event.currentTarget.value, event.nativeEvent);
            }}
            onClick={(event) => {
              onClick?.(event);
              if (!isOpen && !event.defaultPrevented) {
                setOpen(true, event.nativeEvent);
              }
            }}
            onKeyDown={handleKeyDown}
          />
        </div>
        <button
          type="button"
          className={`${fieldPart('combobox', 'clear')} ui-field__action`}
          hidden={!showClear}
          tabIndex={-1}
          aria-label={clearLabel ?? labels.combobox.clear}
          onClick={(event) => {
            clear(event.nativeEvent);
          }}
        >
          <span
            className="ui-field__action-icon"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: iconClose }}
          />
        </button>
        <span
          className={fieldPart('combobox', 'indicator')}
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: iconChevronDown }}
        />
      </div>
      <NativeSelect
        ref={selectRef}
        name={name}
        form={form}
        multiple={multiple}
        required={required}
        disabled={disabled}
        values={chosen.map((option) => option.value)}
        onInvalid={() => {
          inputRef.current?.focus();
        }}
      />
    </Field>
  );
}
