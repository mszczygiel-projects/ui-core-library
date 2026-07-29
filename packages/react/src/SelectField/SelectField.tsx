import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import {
  IconChevronDown,
  IconChevronUp,
  IconClose,
} from '@mszczygiel-projects/ui-core-icons/react';
import { Popover } from '../Popover/Popover.js';
import type { PopoverPlacement } from '../Popover/Popover.js';
import { Listbox } from '../Listbox/Listbox.js';
import {
  buildRows,
  firstEnabledRow,
  flattenOptions,
  isGroupedItems,
  listboxOptionId,
  nextEnabledRow,
  rowIndexOfValue,
  scrollRowIntoView,
} from '../Listbox/listbox-navigation.js';
import type { ListboxItems, ListboxRow } from '../Listbox/listbox-navigation.js';
import './SelectField.css';
import { getUiCoreConfig } from '@mszczygiel-projects/ui-core-foundations';

export type SelectFieldVariant = 'outline' | 'filled' | 'underlined';
export type SelectFieldSize = 'small' | 'default' | 'large';
export type SelectFieldState = 'default' | 'success' | 'error' | 'disabled';
export type SelectFieldLabelPlacement = 'top' | 'inner' | 'inline';

export type {
  ListboxOption as SelectOption,
  ListboxOptionGroup as SelectOptionGroup,
} from '../Listbox/listbox-navigation.js';

/**
 * Custom dropdown select with keyboard navigation and a hidden native select
 * for form submission.
 *
 * The list floats through `Popover`, so it flips above the field when there is
 * no room below and escapes any `overflow: hidden` ancestor.
 *
 * @example
 * <SelectField
 *   label="Country"
 *   options={[{ value: 'pl', label: 'Poland' }, { value: 'de', label: 'Germany' }]}
 *   onChange={setCountry}
 * />
 */
export interface SelectFieldProps {
  /**
   * Container style: bordered, filled background, or bottom border only.
   * @default 'outline'
   */
  variant?: SelectFieldVariant;
  /**
   * Field height and typography scale.
   * @default 'default'
   */
  size?: SelectFieldSize;
  /**
   * Label position: above the field, stacked inside it, or inline with the
   * value (`Season: 2025/26`).
   * @default 'top'
   */
  labelPlacement?: SelectFieldLabelPlacement;
  /** Trigger element id; auto-generated when omitted. */
  id?: string;
  /** Label text. */
  label?: string;
  /** Helper text rendered below the field, linked via `aria-describedby`. */
  hint?: string;
  /**
   * Validation state; `disabled` also disables the trigger.
   * @default 'default'
   */
  state?: SelectFieldState;
  /**
   * Text shown while no option is selected.
   * @default 'Select option...'
   */
  placeholder?: string;
  /** Controlled selected value; omit to use uncontrolled mode. */
  value?: string;
  /** Initially selected value in uncontrolled mode. */
  defaultValue?: string;
  /**
   * Options rendered in the dropdown — a flat array or an array of
   * `{ label, options }` groups.
   * @default []
   */
  options?: ListboxItems;
  /**
   * Preferred dropdown position; flips automatically when there is no room.
   * @default 'bottom-start'
   */
  placement?: PopoverPlacement;
  /** Disables the select. */
  disabled?: boolean;
  /** Shows a clear affordance when a value is selected (also Delete/Backspace). */
  clearable?: boolean;
  /** Native form field name — enables the hidden native select for form submission. */
  name?: string;
  /** Marks the select as required for form submission. */
  required?: boolean;
  /** Associates the hidden native select with a form by id. */
  form?: string;
  /** Autocomplete hint forwarded to the hidden native select. */
  autoComplete?: string;
  /** Sets `aria-invalid` on the trigger. */
  ariaInvalid?: boolean;
  /** Icon rendered inside the trigger, at the start. */
  leadingIcon?: ReactNode;
  /**
   * Text shown when there are no options.
   * @default `getUiCoreConfig().labels.listbox.empty`
   */
  emptyLabel?: string;
  /**
   * Accessible name of the clear button.
   * @default `getUiCoreConfig().labels.selectField.clear`
   */
  clearLabel?: string;
  /** Called with the selected option's value; clearing passes an empty string. */
  onChange?: (value: string) => void;
  /** Extra class names appended to the root element. */
  className?: string;
  /** Inline styles forwarded to the root element (positioning only — never visual styles). */
  style?: CSSProperties;
}

export function SelectField({
  variant = 'outline',
  size = 'default',
  labelPlacement = 'top',
  id,
  label,
  hint,
  state = 'default',
  placeholder = 'Select option...',
  value,
  defaultValue,
  options = [],
  placement = 'bottom-start',
  disabled,
  clearable = false,
  name,
  required = false,
  form,
  autoComplete,
  ariaInvalid,
  leadingIcon,
  emptyLabel,
  clearLabel,
  onChange,
  className,
  style,
}: SelectFieldProps) {
  const generatedId = useId();
  const triggerId = id ?? `${generatedId}-trigger`;
  const labelId = `${triggerId}-label`;
  const listboxId = `${triggerId}-listbox`;
  const hintId = `${triggerId}-hint`;

  const isControlled = value !== undefined;
  const initialUncontrolledValueRef = useRef(defaultValue ?? '');
  const [internalValue, setInternalValue] = useState(() => defaultValue ?? '');
  const effectiveValue = isControlled ? value : internalValue;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const isDisabled = disabled || state === 'disabled';
  const flatOptions = flattenOptions(options);
  const rows = buildRows(options);
  const selectedOption = flatOptions.find((o) => o.value === effectiveValue);
  const hasValue = !!effectiveValue;

  /*
   * Keeps the floating list as wide as the field. Observes the wrapper — a node
   * React never recreates — and reads the trigger fresh on each callback, so a
   * re-rendered trigger cannot leave a stale observer behind.
   */
  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    if (!open || !wrapper) return undefined;
    const sync = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      wrapper.style.setProperty(
        '--ui-select-field-dropdown-width',
        `${trigger.getBoundingClientRect().width}px`,
      );
    };
    sync();
    if (typeof ResizeObserver !== 'function') return undefined;
    const observer = new ResizeObserver(sync);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [open]);

  // Keeps the active row visible while arrowing through a scrolling list.
  useEffect(() => {
    if (!open) return;
    scrollRowIntoView(listboxId, activeIndex);
  }, [open, activeIndex, listboxId]);

  useEffect(() => {
    const formElement = wrapperRef.current?.closest('form');
    if (!formElement) return;

    const handleFormReset = () => {
      setOpen(false);
      setActiveIndex(-1);
      if (!isControlled) {
        setInternalValue(initialUncontrolledValueRef.current);
      }
    };

    formElement.addEventListener('reset', handleFormReset);
    return () => formElement.removeEventListener('reset', handleFormReset);
  }, [isControlled]);

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  const openDropdown = () => {
    if (isDisabled) return;
    setOpen(true);
    const selected = rowIndexOfValue(rows, effectiveValue);
    setActiveIndex(selected >= 0 ? selected : firstEnabledRow(rows));
  };

  const handleSelect = (row: ListboxRow) => {
    if (row.kind !== 'option' || row.option.disabled) return;
    const prev = effectiveValue;
    if (!isControlled) setInternalValue(row.option.value);
    closeDropdown();
    triggerRef.current?.focus();
    if (prev !== row.option.value) onChange?.(row.option.value);
  };

  const handleClear = (e: React.SyntheticEvent | Event) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isControlled) setInternalValue('');
    if (effectiveValue !== '') onChange?.('');
  };

  const handleNativeSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextValue = e.target.value;
    if (!isControlled) setInternalValue(nextValue);
    if (effectiveValue !== nextValue) onChange?.(nextValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isDisabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!open) openDropdown();
        else if (rows[activeIndex]) handleSelect(rows[activeIndex]);
        break;
      case 'Escape':
        if (open) {
          e.preventDefault();
          closeDropdown();
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!open) openDropdown();
        else setActiveIndex((i) => nextEnabledRow(rows, i, 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!open) openDropdown();
        else setActiveIndex((i) => nextEnabledRow(rows, i, -1));
        break;
      case 'Home':
        if (open) {
          e.preventDefault();
          setActiveIndex(firstEnabledRow(rows));
        }
        break;
      case 'End':
        if (open) {
          e.preventDefault();
          setActiveIndex(nextEnabledRow(rows, rows.length, -1));
        }
        break;
      case 'Delete':
      case 'Backspace':
        if (!open && clearable && effectiveValue) {
          e.preventDefault();
          handleClear(e);
        }
        break;
      case 'Tab':
        if (open) closeDropdown();
        break;
    }
  };

  const isInner = labelPlacement === 'inner';
  const isInline = labelPlacement === 'inline';

  const rootClass = [
    'ui-select-field',
    // Shared size ramp and per-variant colour aliases.
    'ui-control-field',
    `ui-control-field--${variant}`,
    size !== 'default' && `ui-control-field--${size}`,
    `ui-select-field--${variant}`,
    size !== 'default' && `ui-select-field--${size}`,
    open && 'ui-select-field--open',
    state !== 'default' && `ui-select-field--state-${state}`,
    leadingIcon && 'ui-select-field--has-leading-icon',
    isInner && 'ui-select-field--inner',
    isInline && 'ui-select-field--inline',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const trigger = (
    <button
      ref={triggerRef}
      id={triggerId}
      className="ui-select-field__trigger"
      type="button"
      role="combobox"
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={listboxId}
      aria-activedescendant={
        open && activeIndex >= 0 ? listboxOptionId(listboxId, activeIndex) : undefined
      }
      aria-describedby={hint ? hintId : undefined}
      aria-labelledby={label ? labelId : undefined}
      aria-required={required || undefined}
      aria-invalid={ariaInvalid || undefined}
      disabled={isDisabled}
      onClick={() => (open ? closeDropdown() : openDropdown())}
      onKeyDown={handleKeyDown}
    >
      {leadingIcon && (
        <span className="ui-select-field__leading-icon" aria-hidden="true">
          {leadingIcon}
        </span>
      )}
      {label && isInner && (
        <span id={labelId} className="ui-select-field__inner-label">
          {label}
        </span>
      )}
      <span className="ui-select-field__content">
        {label && isInline && (
          <span id={labelId} className="ui-select-field__inline-label">
            {label}:
          </span>
        )}
        <span
          className={[
            'ui-select-field__value',
            !selectedOption && 'ui-select-field__value--placeholder',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {selectedOption?.label ?? placeholder}
        </span>
      </span>
      <span className="ui-select-field__trailing">
        {clearable && hasValue && (
          <span
            className="ui-select-field__clear"
            role="button"
            aria-label={clearLabel ?? getUiCoreConfig().labels.selectField.clear}
            tabIndex={0}
            onMouseDown={handleClear}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') handleClear(e);
            }}
          >
            <IconClose />
          </span>
        )}
        <span className="ui-select-field__chevron" aria-hidden="true">
          {open ? <IconChevronUp /> : <IconChevronDown />}
        </span>
      </span>
    </button>
  );

  return (
    <div className={rootClass} ref={wrapperRef} style={style}>
      {label && !isInner && !isInline && (
        <label id={labelId} className="ui-select-field__label" htmlFor={triggerId}>
          {label}
        </label>
      )}
      <div className="ui-select-field__field-container">
        <Popover
          className="ui-select-field__popover"
          trigger="manual"
          placement={placement}
          open={open}
          onOpenChange={(detail) => {
            if (!detail.open) closeDropdown();
          }}
          anchor={trigger}
        >
          {/* Mounted only while open: the popover panel stays in the DOM either way. */}
          {open && (
            <Listbox
              idPrefix={listboxId}
              items={options}
              value={effectiveValue}
              activeIndex={activeIndex}
              size={size}
              emptyLabel={emptyLabel}
              labelledBy={label ? labelId : undefined}
              label={label ? undefined : placeholder}
              onSelect={handleSelect}
              onActivate={setActiveIndex}
            />
          )}
        </Popover>
        {name && (
          <select
            className="ui-select-field__native-select"
            tabIndex={-1}
            aria-hidden="true"
            name={name}
            value={effectiveValue}
            required={required}
            form={form}
            autoComplete={autoComplete}
            disabled={isDisabled}
            onChange={handleNativeSelectChange}
          >
            <option value="" disabled={required}>
              {placeholder}
            </option>
            {isGroupedItems(options)
              ? options.map((group, groupIndex) => {
                  const groupOptions = (group.options ?? []).map((opt) => (
                    <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                      {opt.label}
                    </option>
                  ));
                  // A nameless optgroup renders as an empty row in the native
                  // menu, so an unlabelled group contributes its options flat.
                  return group.label ? (
                    <optgroup key={`group-${groupIndex}`} label={group.label}>
                      {groupOptions}
                    </optgroup>
                  ) : (
                    <Fragment key={`group-${groupIndex}`}>{groupOptions}</Fragment>
                  );
                })
              : flatOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))}
          </select>
        )}
      </div>
      {hint && (
        <p id={hintId} className="ui-select-field__hint">
          {hint}
        </p>
      )}
    </div>
  );
}
