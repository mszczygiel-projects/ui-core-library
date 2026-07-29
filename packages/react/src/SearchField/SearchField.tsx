import { useRef, useState, useEffect, type CSSProperties } from 'react';
import { IconSearch } from '@mszczygiel-projects/ui-core-icons/react';
import { IconClose } from '@mszczygiel-projects/ui-core-icons/react';
import { TextField } from '../TextField/TextField.js';
import type {
  TextFieldVariant,
  TextFieldSize,
  TextFieldState,
  TextFieldLabelPlacement,
} from '../TextField/TextField.js';
import './SearchField.css';
import { getUiCoreConfig } from '@mszczygiel-projects/ui-core-foundations';

/**
 * Search input built on TextField, with a leading search icon and a clear button.
 *
 * @example
 * <SearchField label="Search products" onChange={setQuery} onClear={resetResults} />
 */
export interface SearchFieldProps {
  /**
   * Container style: bordered, filled background, or bottom border only.
   * @default 'outline'
   */
  variant?: TextFieldVariant;
  /**
   * Field height and typography scale.
   * @default 'default'
   */
  size?: TextFieldSize;
  /** Label text. */
  label?: string;
  /**
   * Label position: above the field, floating over it, or inline inside it.
   * @default 'top'
   */
  labelPlacement?: TextFieldLabelPlacement;
  /** Controlled input value; omit to use uncontrolled mode. */
  value?: string;
  /** Initial value in uncontrolled mode. */
  defaultValue?: string;
  /**
   * Placeholder text shown while empty.
   * @default 'Search...'
   */
  placeholder?: string;
  /** Helper text rendered below the field, linked via `aria-describedby`. */
  hint?: string;
  /**
   * Validation state; `disabled` also disables the input.
   * @default 'default'
   */
  state?: TextFieldState;
  /** Native form field name. */
  name?: string;
  /** Disables the input and the clear button. */
  disabled?: boolean;
  /** Marks the field as required for form submission. */
  required?: boolean;
  /** Makes the input read-only. */
  readOnly?: boolean;
  /** Called with the input's string value on every change (including clearing). */
  onChange?: (value: string) => void;
  /** Called when the clear button empties the field. */
  onClear?: () => void;
  /**
   * Accessible name of the clear button.
   * @default `getUiCoreConfig().labels.searchField.clear`
   */
  clearLabel?: string;
  /** Extra class names appended to the root element. */
  className?: string;
  /** Inline styles forwarded to the root element (positioning only — never visual styles). */
  style?: CSSProperties;
}

export function SearchField({
  variant = 'outline',
  size = 'default',
  label,
  labelPlacement,
  value,
  defaultValue,
  placeholder = 'Search...',
  hint,
  state = 'default',
  name,
  disabled,
  required,
  readOnly,
  onChange,
  onClear,
  clearLabel,
  className,
  style,
}: SearchFieldProps) {
  const isControlled = value !== undefined;
  const initialUncontrolledValueRef = useRef(defaultValue ?? '');
  const [internalValue, setInternalValue] = useState(() => defaultValue ?? '');
  const effectiveValue = isControlled ? value : internalValue;
  const hasValue = effectiveValue !== '';
  const isDisabled = disabled || state === 'disabled';
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const formElement = inputRef.current?.closest('form');
    if (!formElement) return;
    const handleFormReset = () => {
      if (!isControlled) setInternalValue(initialUncontrolledValueRef.current);
    };
    formElement.addEventListener('reset', handleFormReset);
    return () => formElement.removeEventListener('reset', handleFormReset);
  }, [isControlled]);

  const handleChange = (v: string) => {
    if (!isControlled) setInternalValue(v);
    onChange?.(v);
  };

  const handleClear = () => {
    if (!isControlled) setInternalValue('');
    onChange?.('');
    onClear?.();
  };

  const clearButton = (
    <button
      className={['ui-search-field__clear', !hasValue && 'ui-search-field__clear--hidden']
        .filter(Boolean)
        .join(' ')}
      type="button"
      aria-label={clearLabel ?? getUiCoreConfig().labels.searchField.clear}
      aria-hidden={!hasValue || undefined}
      tabIndex={hasValue ? 0 : -1}
      disabled={isDisabled}
      onClick={handleClear}
    >
      <IconClose />
    </button>
  );

  return (
    <TextField
      ref={inputRef}
      className={['ui-search-field', className].filter(Boolean).join(' ')}
      style={style}
      size={size}
      label={label}
      labelPlacement={labelPlacement}
      value={effectiveValue}
      placeholder={placeholder}
      hint={hint}
      state={state}
      name={name}
      disabled={disabled}
      required={required}
      readOnly={readOnly}
      type="search"
      variant={variant}
      leadingIcon={<IconSearch />}
      trailingIcon={clearButton}
      onChange={handleChange}
    />
  );
}
