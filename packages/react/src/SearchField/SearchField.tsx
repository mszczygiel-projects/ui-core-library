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

export interface SearchFieldProps {
  variant?: TextFieldVariant;
  size?: TextFieldSize;
  label?: string;
  labelPlacement?: TextFieldLabelPlacement;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  hint?: string;
  state?: TextFieldState;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  onClear?: () => void;
  className?: string;
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
      aria-label="Clear search"
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
