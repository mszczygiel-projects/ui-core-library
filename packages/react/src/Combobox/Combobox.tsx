import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import {
  IconChevronDown,
  IconChevronUp,
  IconClose,
} from '@mszczygiel-projects/ui-core-icons/react';
import { Popover } from '../Popover/Popover.js';
import type { PopoverPlacement } from '../Popover/Popover.js';
import { Chip } from '../Chip/Chip.js';
import { Listbox } from '../Listbox/Listbox.js';
import {
  buildRows,
  firstEnabledRow,
  flattenOptions,
  isGroupedItems,
  listboxOptionId,
  nextEnabledRow,
  scrollRowIntoView,
  toggleValue,
} from '../Listbox/listbox-navigation.js';
import type { ListboxItems, ListboxOption, ListboxRow } from '../Listbox/listbox-navigation.js';
import './Combobox.css';

export type ComboboxVariant = 'outline' | 'filled' | 'underlined';
export type ComboboxSize = 'small' | 'default' | 'large';
export type ComboboxState = 'default' | 'success' | 'error' | 'disabled';

/** Where the option list comes from: filtered here, or supplied pre-filtered. */
export type ComboboxFilterMode = 'local' | 'remote';

export type {
  ListboxOption as ComboboxOption,
  ListboxOptionGroup as ComboboxOptionGroup,
} from '../Listbox/listbox-navigation.js';

const DEFAULT_FILTER_DEBOUNCE_MS = 200;

/**
 * Text input that filters a large option list as you type.
 *
 * Implements the WAI-ARIA combobox pattern: the input itself carries
 * `role="combobox"` with `aria-expanded`, `aria-controls` and
 * `aria-activedescendant`, and focus never leaves it while navigating.
 *
 * @example
 * <Combobox
 *   label="Season"
 *   options={[{ value: '2025', label: '2025/26' }]}
 *   value={value}
 *   onChange={setValue}
 * />
 */
export interface ComboboxProps {
  /**
   * Container style: bordered, filled background, or bottom border only.
   * @default 'outline'
   */
  variant?: ComboboxVariant;
  /**
   * Field height and typography scale.
   * @default 'default'
   */
  size?: ComboboxSize;
  /**
   * Validation state; `disabled` also disables the input.
   * @default 'default'
   */
  state?: ComboboxState;
  /** Input element id; auto-generated when omitted. */
  id?: string;
  /** Label text rendered above the field. */
  label?: string;
  /** Helper text rendered below the field, linked via `aria-describedby`. */
  hint?: string;
  /**
   * Text shown in the empty input.
   * @default 'Search...'
   */
  placeholder?: string;
  /** Selected value in single mode. */
  value?: string;
  /** Selected values in `multiple` mode. */
  values?: string[];
  /**
   * Allows selecting more than one option, shown as chips inside the field.
   * @default false
   */
  multiple?: boolean;
  /**
   * Options to choose from — a flat array or an array of `{ label, options }` groups.
   * @default []
   */
  options?: ListboxItems;
  /**
   * `local` filters `options` by label; `remote` renders them as given and
   * calls `onFilter` so the consumer can fetch.
   * @default 'local'
   */
  filterMode?: ComboboxFilterMode;
  /** Shows the loading message in place of the list. */
  loading?: boolean;
  /** Offers a "create" row when the query matches no option. */
  allowCreate?: boolean;
  /**
   * Delay before `onFilter` fires, in ms.
   * @default 200
   */
  filterDebounce?: number;
  /**
   * Preferred dropdown position; flips automatically when there is no room.
   * @default 'bottom-start'
   */
  placement?: PopoverPlacement;
  /** Disables the combobox. */
  disabled?: boolean;
  /** Shows a clear affordance once there is a selection or a query. */
  clearable?: boolean;
  /** Icon rendered inside the field, at the start. */
  leadingIcon?: ReactNode;
  /**
   * Text shown when nothing matches.
   * @default 'No results found'
   */
  emptyLabel?: string;
  /**
   * Text shown while `loading`.
   * @default 'Loading...'
   */
  loadingLabel?: string;
  /**
   * Prefix of the create row; the query is appended in quotes.
   * @default 'Create'
   */
  createLabel?: string;
  /** Called with the selected value in single mode. */
  onChange?: (value: string) => void;
  /** Called with the full selection in `multiple` mode. */
  onValuesChange?: (values: string[]) => void;
  /** Called with the debounced query — drive remote fetching from here. */
  onFilter?: (query: string) => void;
  /** Called when the create affordance is chosen, with the raw query. */
  onCreate?: (label: string) => void;
  /** Extra class names appended to the root element. */
  className?: string;
  /** Inline styles forwarded to the root element (positioning only — never visual styles). */
  style?: CSSProperties;
}

export function Combobox({
  variant = 'outline',
  size = 'default',
  state = 'default',
  id,
  label,
  hint,
  placeholder = 'Search...',
  value = '',
  values = [],
  multiple = false,
  options = [],
  filterMode = 'local',
  loading = false,
  allowCreate = false,
  filterDebounce = DEFAULT_FILTER_DEBOUNCE_MS,
  placement = 'bottom-start',
  disabled,
  clearable = false,
  leadingIcon,
  emptyLabel = 'No results found',
  loadingLabel = 'Loading...',
  createLabel = 'Create',
  onChange,
  onValuesChange,
  onFilter,
  onCreate,
  className,
  style,
}: ComboboxProps) {
  const generatedId = useId();
  const inputId = id ?? `${generatedId}-input`;
  const labelId = `${inputId}-label`;
  const listboxId = `${inputId}-listbox`;
  const hintId = `${inputId}-hint`;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const filterTimer = useRef<ReturnType<typeof setTimeout>>();

  const isDisabled = disabled || state === 'disabled';

  /** Options after local filtering; remote mode trusts what it was given. */
  const visibleOptions = useMemo<ListboxItems>(() => {
    const needle = query.trim().toLowerCase();
    if (filterMode === 'remote' || !needle) return options;
    const matches = (option: ListboxOption) => option.label.toLowerCase().includes(needle);
    if (isGroupedItems(options)) {
      return options
        .map((group) => ({ ...group, options: (group.options ?? []).filter(matches) }))
        .filter((group) => group.options.length > 0);
    }
    return (options as ListboxOption[]).filter(matches);
  }, [options, query, filterMode]);

  /** Query offered by the create row, or undefined when it does not apply. */
  const createQuery = useMemo(() => {
    const trimmed = query.trim();
    if (!allowCreate || !trimmed) return undefined;
    const exists = flattenOptions(options).some(
      (option) => option.label.toLowerCase() === trimmed.toLowerCase(),
    );
    return exists ? undefined : trimmed;
  }, [allowCreate, query, options]);

  const rows = useMemo(() => buildRows(visibleOptions, createQuery), [visibleOptions, createQuery]);

  const selectedOptions = useMemo(() => {
    const all = flattenOptions(options);
    return values
      .map((v) => all.find((o) => o.value === v))
      .filter((o): o is ListboxOption => Boolean(o));
  }, [options, values]);

  const selectedOption = useMemo(
    () => flattenOptions(options).find((o) => o.value === value),
    [options, value],
  );

  /* Keeps the floating list as wide as the field. Observes the wrapper — a node
   * React never recreates — and reads the field fresh on each callback. */
  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    if (!open || !wrapper) return undefined;
    const sync = () => {
      const field = wrapper.querySelector<HTMLElement>('.ui-combobox__field');
      if (!field) return;
      wrapper.style.setProperty(
        '--ui-combobox-dropdown-width',
        `${field.getBoundingClientRect().width}px`,
      );
    };
    sync();
    if (typeof ResizeObserver !== 'function') return undefined;
    const observer = new ResizeObserver(sync);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    scrollRowIntoView(listboxId, activeIndex);
  }, [open, activeIndex, listboxId]);

  useEffect(() => () => clearTimeout(filterTimer.current), []);

  const openList = useCallback(() => {
    if (isDisabled) return;
    setOpen(true);
  }, [isDisabled]);

  const closeList = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  const handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    setQuery(next);
    openList();
    setActiveIndex(0);
    clearTimeout(filterTimer.current);
    filterTimer.current = setTimeout(() => onFilter?.(next), filterDebounce);
  };

  const handleSelect = (row: ListboxRow) => {
    if (row.kind === 'create') {
      onCreate?.(query.trim());
      setQuery('');
      closeList();
      inputRef.current?.focus();
      return;
    }
    if (row.option.disabled) return;

    if (multiple) {
      onValuesChange?.(toggleValue(values, row.option.value));
      setQuery('');
      // The list stays open so more options can be picked.
      setActiveIndex(0);
    } else {
      onChange?.(row.option.value);
      setQuery('');
      closeList();
    }
    inputRef.current?.focus();
  };

  const removeValue = (optionValue: string) => {
    if (isDisabled) return;
    onValuesChange?.(values.filter((v) => v !== optionValue));
    inputRef.current?.focus();
  };

  const handleClear = (event: React.SyntheticEvent) => {
    event.stopPropagation();
    event.preventDefault();
    setQuery('');
    if (multiple) onValuesChange?.([]);
    else onChange?.('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (isDisabled) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open) {
          openList();
          setActiveIndex(firstEnabledRow(rows));
        } else setActiveIndex((i) => nextEnabledRow(rows, i, 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!open) {
          openList();
          setActiveIndex(firstEnabledRow(rows));
        } else setActiveIndex((i) => nextEnabledRow(rows, i, -1));
        break;
      case 'Home':
        if (open) {
          event.preventDefault();
          setActiveIndex(firstEnabledRow(rows));
        }
        break;
      case 'End':
        if (open) {
          event.preventDefault();
          setActiveIndex(nextEnabledRow(rows, rows.length, -1));
        }
        break;
      case 'Enter':
        if (open && rows[activeIndex]) {
          event.preventDefault();
          handleSelect(rows[activeIndex]);
        }
        break;
      case 'Escape':
        if (open) {
          event.preventDefault();
          closeList();
        }
        break;
      case 'Backspace':
        // Empty query: peel the last chip, the usual multi-select shortcut.
        if (multiple && query === '' && values.length > 0) {
          removeValue(values[values.length - 1]);
        }
        break;
      case 'Tab':
        if (open) closeList();
        break;
    }
  };

  /*
   * Opens on pointer and keyboard interaction rather than on focus: selecting
   * an option refocuses the input, and a focus-to-open rule would immediately
   * reopen the list the selection just closed.
   */
  const handleFieldClick = () => {
    inputRef.current?.focus();
    if (!open) {
      openList();
      setActiveIndex(firstEnabledRow(rows));
    }
  };

  const hasSelection = multiple ? values.length > 0 : value !== '';
  const inputValue = query || (multiple ? '' : (selectedOption?.label ?? ''));

  const rootClass = [
    'ui-combobox',
    // Shared size ramp and per-variant colour aliases.
    'ui-control-field',
    `ui-control-field--${variant}`,
    size !== 'default' && `ui-control-field--${size}`,
    `ui-combobox--${variant}`,
    size !== 'default' && `ui-combobox--${size}`,
    open && 'ui-combobox--open',
    state !== 'default' && `ui-combobox--state-${state}`,
    leadingIcon && 'ui-combobox--has-leading-icon',
    multiple && 'ui-combobox--multiple',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const field = (
    /*
     * Clicking anywhere in the box focuses the input, which is the real control
     * — the box itself carries no role and needs no keyboard handler of its own.
     */
    <div className="ui-combobox__field" onClick={handleFieldClick}>
      {leadingIcon && (
        <span className="ui-combobox__leading-icon" aria-hidden="true">
          {leadingIcon}
        </span>
      )}
      <div className="ui-combobox__content">
        {multiple && selectedOptions.length > 0 && (
          <div className="ui-combobox__chips">
            {selectedOptions.map((option) => (
              <Chip
                key={option.value}
                appearance="subtle"
                size="small"
                dismissible
                disabled={isDisabled}
                dismissLabel={`Remove ${option.label}`}
                onDismiss={() => removeValue(option.value)}
              >
                {option.label}
              </Chip>
            ))}
          </div>
        )}
        <input
          ref={inputRef}
          id={inputId}
          className="ui-combobox__input"
          type="text"
          role="combobox"
          autoComplete="off"
          spellCheck={false}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={
            open && activeIndex >= 0 ? listboxOptionId(listboxId, activeIndex) : undefined
          }
          aria-describedby={hint ? hintId : undefined}
          aria-labelledby={label ? labelId : undefined}
          placeholder={multiple && hasSelection ? '' : placeholder}
          value={inputValue}
          disabled={isDisabled}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
        />
      </div>
      <span className="ui-combobox__trailing">
        {clearable && (hasSelection || query) && (
          <span
            className="ui-combobox__clear"
            role="button"
            aria-label="Clear selection"
            tabIndex={0}
            onMouseDown={handleClear}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') handleClear(e);
            }}
          >
            <IconClose />
          </span>
        )}
        <span className="ui-combobox__chevron" aria-hidden="true">
          {open ? <IconChevronUp /> : <IconChevronDown />}
        </span>
      </span>
    </div>
  );

  return (
    <div className={rootClass} ref={wrapperRef} style={style}>
      {label && (
        <label id={labelId} className="ui-combobox__label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className="ui-combobox__field-container">
        <Popover
          className="ui-combobox__popover"
          trigger="manual"
          placement={placement}
          open={open}
          onOpenChange={(detail) => {
            if (!detail.open) closeList();
          }}
          anchor={field}
        >
          {/* Mounted only while open: the popover panel stays in the DOM either way. */}
          {open && (
            <Listbox
              idPrefix={listboxId}
              items={visibleOptions}
              value={multiple ? values : value}
              multiple={multiple}
              activeIndex={activeIndex}
              size={size}
              loading={loading}
              loadingLabel={loadingLabel}
              emptyLabel={emptyLabel}
              createLabel={createLabel}
              createValue={createQuery}
              labelledBy={label ? labelId : undefined}
              label={label ? undefined : placeholder}
              onSelect={handleSelect}
              onActivate={setActiveIndex}
            />
          )}
        </Popover>
      </div>
      {hint && (
        <p id={hintId} className="ui-combobox__hint">
          {hint}
        </p>
      )}
    </div>
  );
}
