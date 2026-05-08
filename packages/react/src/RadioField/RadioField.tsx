import { useId, type CSSProperties } from 'react';
import './RadioField.css';

export type RadioFieldState = 'default' | 'error' | 'disabled';

export interface RadioFieldProps {
  label?: string;
  hint?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  state?: RadioFieldState;
  disabled?: boolean;
  name?: string;
  value?: string;
  required?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
  style?: CSSProperties;
  id?: string;
}

export function RadioField({
  label,
  hint,
  checked,
  defaultChecked,
  state = 'default',
  disabled,
  name,
  value = 'on',
  required,
  onChange,
  className,
  style,
  id,
}: RadioFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;

  const isControlled = checked !== undefined;
  const isDisabled = disabled || state === 'disabled';
  const isError = state === 'error';
  const isChecked = !!checked;

  const rootClass = [
    'ui-radio-field',
    isError && 'ui-radio-field--error',
    isDisabled && 'ui-radio-field--disabled',
    isChecked && 'ui-radio-field--checked',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass} style={style}>
      <label className="ui-radio-field__label-row">
        <span className="ui-radio-field__control">
          <input
            id={inputId}
            type="radio"
            className="ui-radio-field__input"
            {...(isControlled ? { checked } : {})}
            {...(!isControlled && defaultChecked !== undefined ? { defaultChecked } : {})}
            disabled={isDisabled}
            required={required}
            name={name}
            value={value}
            aria-invalid={isError ? 'true' : undefined}
            aria-describedby={hint ? hintId : undefined}
            onChange={(e) => onChange?.(e.target.checked)}
          />
        </span>
        {label && <span className="ui-radio-field__label-text">{label}</span>}
      </label>
      {hint && (
        <p id={hintId} className="ui-radio-field__hint">
          {hint}
        </p>
      )}
    </div>
  );
}
