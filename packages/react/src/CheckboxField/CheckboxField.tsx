import { useId, useEffect, useRef, type CSSProperties } from 'react';
import './CheckboxField.css';

export type CheckboxFieldState = 'default' | 'error' | 'disabled';

/**
 * Checkbox with label and hint, supporting controlled, uncontrolled, and indeterminate states.
 *
 * @example
 * <CheckboxField label="Subscribe to newsletter" hint="Max one email per week" onChange={setSubscribed} />
 */
export interface CheckboxFieldProps {
  /** Label text rendered next to the checkbox. */
  label?: string;
  /** Helper text rendered below the checkbox, linked via `aria-describedby`. */
  hint?: string;
  /** Controlled checked state; omit to use uncontrolled mode. */
  checked?: boolean;
  /** Initial checked state in uncontrolled mode. */
  defaultChecked?: boolean;
  /** Visual "partially checked" state (e.g. a parent of a mixed selection). */
  indeterminate?: boolean;
  /**
   * Validation state; `disabled` also disables the input.
   * @default 'default'
   */
  state?: CheckboxFieldState;
  /** Disables the checkbox. */
  disabled?: boolean;
  /** Native form field name. */
  name?: string;
  /**
   * Value submitted with the form when checked.
   * @default 'on'
   */
  value?: string;
  /** Marks the checkbox as required for form submission. */
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

export function CheckboxField({
  label,
  hint,
  checked,
  defaultChecked,
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
