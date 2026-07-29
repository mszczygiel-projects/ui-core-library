import { useId, useState, type CSSProperties, type ReactNode } from 'react';
import './SwitchField.css';

export type SwitchFieldState = 'default' | 'error' | 'disabled';
export type SwitchFieldLabelPosition = 'left' | 'right';

/**
 * On/off switch with an optional label and description, in controlled or uncontrolled mode.
 *
 * @example
 * <SwitchField
 *   label="Email notifications"
 *   description="Receive notifications at your email address"
 *   labelPosition="left"
 *   onChange={setEnabled}
 * />
 */
export interface SwitchFieldProps {
  /** Label text rendered next to the switch. */
  label?: string;
  /** Secondary text rendered under the label, linked via `aria-describedby`. */
  description?: string;
  /**
   * Which side the label and description sit on. `left` renders a full-width
   * settings row with the switch pushed to the trailing edge.
   * @default 'right'
   */
  labelPosition?: SwitchFieldLabelPosition;
  /** Controlled on/off state; omit to use uncontrolled mode. */
  checked?: boolean;
  /** Initial on/off state in uncontrolled mode. */
  defaultChecked?: boolean;
  /** Icon shown inside the thumb while the switch is on. */
  iconOn?: ReactNode;
  /** Icon shown inside the thumb while the switch is off. */
  iconOff?: ReactNode;
  /**
   * Validation state; `disabled` also disables the input.
   * @default 'default'
   */
  state?: SwitchFieldState;
  /** Disables the switch. */
  disabled?: boolean;
  /** Native form field name. */
  name?: string;
  /**
   * Value submitted with the form when the switch is on.
   * @default 'on'
   */
  value?: string;
  /** Marks the switch as required for form submission. */
  required?: boolean;
  /** Called with the next on/off state on user interaction. */
  onChange?: (checked: boolean) => void;
  /** Extra class names appended to the root element. */
  className?: string;
  /** Inline styles forwarded to the root element (positioning only — never visual styles). */
  style?: CSSProperties;
  /** Input element id; auto-generated when omitted. */
  id?: string;
}

export function SwitchField({
  label,
  description,
  labelPosition = 'right',
  checked,
  defaultChecked,
  iconOn,
  iconOff,
  state = 'default',
  disabled,
  name,
  value = 'on',
  required,
  onChange,
  className,
  style,
  id,
}: SwitchFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = `${inputId}-description`;

  const isControlled = checked !== undefined;
  const [uncontrolledChecked, setUncontrolledChecked] = useState(defaultChecked ?? false);
  // The thumb position is CSS-driven, so uncontrolled mode has to track the state here
  // rather than leaning on the input's own :checked.
  const isChecked = isControlled ? checked : uncontrolledChecked;

  const isDisabled = disabled || state === 'disabled';
  const isError = state === 'error';

  const rootClass = [
    'ui-switch-field',
    isChecked && 'ui-switch-field--checked',
    isError && 'ui-switch-field--error',
    isDisabled && 'ui-switch-field--disabled',
    labelPosition === 'left' && 'ui-switch-field--label-left',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const icon = isChecked ? iconOn : iconOff;

  return (
    <div className={rootClass} style={style}>
      <label className="ui-switch-field__row" htmlFor={inputId}>
        <span className="ui-switch-field__control">
          <span className="ui-switch-field__track">
            <span className="ui-switch-field__thumb">
              {icon && <span className="ui-switch-field__icon">{icon}</span>}
            </span>
          </span>
          <input
            id={inputId}
            type="checkbox"
            role="switch"
            className="ui-switch-field__input"
            checked={isChecked}
            disabled={isDisabled}
            required={required}
            name={name}
            value={value}
            aria-invalid={isError ? 'true' : undefined}
            aria-describedby={description ? descriptionId : undefined}
            onChange={(e) => {
              if (!isControlled) setUncontrolledChecked(e.target.checked);
              onChange?.(e.target.checked);
            }}
          />
        </span>
        <span className="ui-switch-field__text">
          {label && <span className="ui-switch-field__label">{label}</span>}
          {description && (
            <span id={descriptionId} className="ui-switch-field__description">
              {description}
            </span>
          )}
        </span>
      </label>
    </div>
  );
}
