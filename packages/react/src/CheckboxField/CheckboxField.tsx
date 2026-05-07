import { useId, useEffect, useRef, type CSSProperties } from 'react';
import './CheckboxField.css';

export type CheckboxFieldState = 'default' | 'error' | 'disabled';

export interface CheckboxFieldProps {
  label?: string;
  hint?: string;
  checked?: boolean;
  indeterminate?: boolean;
  state?: CheckboxFieldState;
  disabled?: boolean;
  name?: string;
  value?: string;
  required?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
  style?: CSSProperties;
  id?: string;
}

export function CheckboxField({
  label,
  hint,
  checked,
  indeterminate = false,
  state = 'default',
  disabled,
  name,
  value = 'on',
  required,
  onChange,
  className,
  style,
  id,
}: CheckboxFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const inputRef = useRef<HTMLInputElement>(null);

  const isControlled = checked !== undefined;
  const isDisabled = disabled || state === 'disabled';
  const isError = state === 'error';
  const isChecked = !!checked;

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const rootClass = [
    'ui-checkbox-field',
    isError && 'ui-checkbox-field--error',
    isDisabled && 'ui-checkbox-field--disabled',
    isChecked && 'ui-checkbox-field--checked',
    indeterminate && 'ui-checkbox-field--indeterminate',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass} style={style}>
      <label className="ui-checkbox-field__label-row">
        <span className="ui-checkbox-field__box">
          <input
            ref={inputRef}
            id={inputId}
            type="checkbox"
            className="ui-checkbox-field__input"
            {...(isControlled ? { checked } : {})}
            disabled={isDisabled}
            required={required}
            name={name}
            value={value}
            aria-invalid={isError ? 'true' : undefined}
            aria-describedby={hint ? hintId : undefined}
            onChange={(e) => onChange?.(e.target.checked)}
          />
        </span>
        {label && <span className="ui-checkbox-field__label-text">{label}</span>}
      </label>
      {hint && (
        <p id={hintId} className="ui-checkbox-field__hint">
          {hint}
        </p>
      )}
    </div>
  );
}
