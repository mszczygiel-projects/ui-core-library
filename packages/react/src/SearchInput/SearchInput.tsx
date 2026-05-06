import { useState, type CSSProperties } from 'react';
import { IconSearch } from '@ui-core/icons/react';
import { IconClose } from '@ui-core/icons/react';
import { TextInput } from '../TextInput/TextInput.js';
import type { TextInputVariant, TextInputSize, TextInputState } from '../TextInput/TextInput.js';
import './search-input.css';

export interface SearchInputProps {
  variant?: TextInputVariant;
  size?: TextInputSize;
  value?: string;
  placeholder?: string;
  hint?: string;
  state?: TextInputState;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  onClear?: () => void;
  className?: string;
  style?: CSSProperties;
}

export function SearchInput({
  variant = 'outline',
  size = 'default',
  value,
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
}: SearchInputProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState('');
  const effectiveValue = isControlled ? value : internalValue;
  const hasValue = effectiveValue !== '';
  const isDisabled = disabled || state === 'disabled';

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
      className={['ui-search-input__clear', !hasValue && 'ui-search-input__clear--hidden']
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
    <TextInput
      className={['ui-search-input', className].filter(Boolean).join(' ')}
      style={style}
      size={size}
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
