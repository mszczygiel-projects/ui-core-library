import { useState, type CSSProperties } from 'react';
import { IconEye } from '@mszczygiel-projects/ui-core-icons/react';
import { IconEyeSlash } from '@mszczygiel-projects/ui-core-icons/react';
import { TextField } from '../TextField/TextField.js';
import type {
  TextFieldVariant,
  TextFieldSize,
  TextFieldState,
  TextFieldLabelPlacement,
} from '../TextField/TextField.js';
import './PasswordField.css';

/**
 * Password input built on TextField, with a show/hide visibility toggle.
 *
 * @example
 * <PasswordField label="Password" hint="Minimum 12 characters" onChange={setPassword} />
 */
export interface PasswordFieldProps {
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
  /** Placeholder text shown while empty. */
  placeholder?: string;
  /** Controlled input value; omit to use uncontrolled mode. */
  value?: string;
  /** Initial value in uncontrolled mode. */
  defaultValue?: string;
  /** Helper text rendered below the field, linked via `aria-describedby`. */
  hint?: string;
  /**
   * Validation state; `disabled` also disables the input.
   * @default 'default'
   */
  state?: TextFieldState;
  /** Native form field name. */
  name?: string;
  /** Disables the input and the visibility toggle. */
  disabled?: boolean;
  /** Marks the field as required for form submission. */
  required?: boolean;
  /** Makes the input read-only. */
  readOnly?: boolean;
  /** Controlled visibility state; omit to let the component toggle internally. */
  showPassword?: boolean;
  /** Called when the visibility toggle is clicked. */
  onToggleVisibility?: () => void;
  /** Called with the input's string value on every change. */
  onChange?: (value: string) => void;
  /** Extra class names appended to the root element. */
  className?: string;
  /** Inline styles forwarded to the root element (positioning only — never visual styles). */
  style?: CSSProperties;
}

export function PasswordField({
  showPassword: controlledShowPassword,
  onToggleVisibility,
  disabled,
  state,
  ...rest
}: PasswordFieldProps) {
  const [internalShowPassword, setInternalShowPassword] = useState(false);

  const isControlled = controlledShowPassword !== undefined;
  const showPassword = isControlled ? controlledShowPassword : internalShowPassword;

  const isDisabled = disabled || state === 'disabled';

  const handleToggle = () => {
    if (!isControlled) {
      setInternalShowPassword((prev) => !prev);
    }
    onToggleVisibility?.();
  };

  const toggleButton = (
    <button
      className="ui-password-field__toggle"
      type="button"
      aria-label={showPassword ? 'Hide password' : 'Show password'}
      aria-pressed={showPassword}
      disabled={isDisabled}
      onClick={handleToggle}
    >
      {showPassword ? <IconEye /> : <IconEyeSlash />}
    </button>
  );

  return (
    <TextField
      {...rest}
      type={showPassword ? 'text' : 'password'}
      disabled={disabled}
      state={state}
      trailingIcon={toggleButton}
    />
  );
}
