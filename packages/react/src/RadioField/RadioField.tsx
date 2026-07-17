import { useId, type CSSProperties } from 'react';
import './RadioField.css';

export type RadioFieldState = 'default' | 'error' | 'disabled';

/**
 * Single radio button with label and hint; group radios by giving them the same `name`.
 *
 * @example
 * <RadioField name="plan" value="pro" label="Pro plan" onChange={selectPro} />
 */
export interface RadioFieldProps {
  /** Label text rendered next to the radio. */
  label?: string;
  /** Helper text rendered below the radio, linked via `aria-describedby`. */
  hint?: string;
  /** Controlled checked state; omit to use uncontrolled mode. */
  checked?: boolean;
  /** Initial checked state in uncontrolled mode. */
  defaultChecked?: boolean;
  /**
   * Validation state; `disabled` also disables the input.
   * @default 'default'
   */
  state?: RadioFieldState;
  /** Disables the radio. */
  disabled?: boolean;
  /** Native form field name — radios with the same name form a group. */
  name?: string;
  /**
   * Value submitted with the form when selected.
   * @default 'on'
   */
  value?: string;
  /** Marks the radio group as required for form submission. */
  required?: boolean;
  /** Called with the next checked state on user interaction. */
  onChange?: (checked: boolean) => void;
  /** Extra class names appended to the root element. */
  className?: string;
  /** Inline styles forwarded to the root element (positioning only — never visual styles). */
  style?: CSSProperties;
  /** Input element id; auto-generated when omitted. */
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
