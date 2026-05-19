import { useId, useRef, useState, useEffect, type CSSProperties, type ReactNode } from 'react';
import {
  IconChevronDown,
  IconChevronUp,
  IconClose,
} from '@mszczygiel-projects/ui-core-icons/react';
import './SelectField.css';

export type SelectFieldVariant = 'outline' | 'filled' | 'underlined';
export type SelectFieldSize = 'small' | 'default' | 'large';
export type SelectFieldState = 'default' | 'success' | 'error' | 'disabled';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectFieldProps {
  variant?: SelectFieldVariant;
  size?: SelectFieldSize;
  id?: string;
  label?: string;
  hint?: string;
  state?: SelectFieldState;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  options?: SelectOption[];
  disabled?: boolean;
  clearable?: boolean;
  name?: string;
  required?: boolean;
  form?: string;
  autoComplete?: string;
  ariaInvalid?: boolean;
  leadingIcon?: ReactNode;
  onChange?: (value: string) => void;
  className?: string;
  style?: CSSProperties;
}

function nextEnabledIndex(options: SelectOption[], current: number, direction: 1 | -1): number {
  let next = current + direction;
  while (next >= 0 && next < options.length) {
    if (!options[next].disabled) return next;
    next += direction;
  }
  return current;
}

export function SelectField({
  variant = 'outline',
  size = 'default',
  id,
  label,
  hint,
  state = 'default',
  placeholder = 'Select option...',
  value,
  defaultValue,
  options = [],
  disabled,
  clearable = false,
  name,
  required = false,
  form,
  autoComplete,
  ariaInvalid,
  leadingIcon,
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
  const selectedOption = options.find((o) => o.value === effectiveValue);
  const hasValue = !!effectiveValue;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

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

  const openDropdown = () => {
    if (isDisabled) return;
    setOpen(true);
    setActiveIndex(options.findIndex((o) => o.value === effectiveValue));
  };

  const closeDropdown = () => {
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleSelect = (opt: SelectOption) => {
    if (opt.disabled) return;
    const prev = effectiveValue;
    if (!isControlled) setInternalValue(opt.value);
    closeDropdown();
    triggerRef.current?.focus();
    if (prev !== opt.value) onChange?.(opt.value);
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
        if (!open) {
          openDropdown();
        } else if (activeIndex >= 0 && options[activeIndex]) {
          handleSelect(options[activeIndex]);
        }
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
        else setActiveIndex((i) => nextEnabledIndex(options, i, 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!open) openDropdown();
        else setActiveIndex((i) => nextEnabledIndex(options, i, -1));
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

  const rootClass = [
    'ui-select-field',
    `ui-select-field--${variant}`,
    size !== 'default' && `ui-select-field--${size}`,
    open && 'ui-select-field--open',
    state !== 'default' && `ui-select-field--state-${state}`,
    leadingIcon && 'ui-select-field--has-leading-icon',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass} ref={wrapperRef} style={style}>
      {label && (
        <label id={labelId} className="ui-select-field__label" htmlFor={triggerId}>
          {label}
        </label>
      )}
      <div className="ui-select-field__field-container">
        <button
          ref={triggerRef}
          id={triggerId}
          className="ui-select-field__trigger"
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-describedby={hint ? hintId : undefined}
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
          <span className="ui-select-field__trailing">
            {clearable && hasValue && (
              <span
                className="ui-select-field__clear"
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
            <span className="ui-select-field__chevron" aria-hidden="true">
              {open ? <IconChevronUp /> : <IconChevronDown />}
            </span>
          </span>
        </button>
        {open && (
          <ul
            id={listboxId}
            className="ui-select-field__dropdown"
            role="listbox"
            aria-labelledby={label ? labelId : undefined}
            aria-label={label ? undefined : placeholder}
          >
            {options.map((opt, i) => (
              <li
                key={opt.value}
                className={[
                  'ui-select-field__option',
                  opt.value === effectiveValue && 'ui-select-field__option--selected',
                  i === activeIndex && 'ui-select-field__option--focused',
                  opt.disabled && 'ui-select-field__option--disabled',
                ]
                  .filter(Boolean)
                  .join(' ')}
                role="option"
                aria-selected={opt.value === effectiveValue}
                aria-disabled={opt.disabled || undefined}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(opt);
                }}
                onMouseMove={() => {
                  if (!opt.disabled) setActiveIndex(i);
                }}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        )}
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
            {options.map((opt) => (
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
