import { useState, type CSSProperties } from 'react';
import { IconEye } from '@ui-core/icons/react';
import { IconEyeSlash } from '@ui-core/icons/react';
import { TextField } from '../TextField/TextField.js';
import type {
  TextFieldVariant,
  TextFieldSize,
  TextFieldState,
  TextFieldLabelPlacement,
} from '../TextField/TextField.js';
import './PasswordField.css';

export interface PasswordFieldProps {
  variant?: TextFieldVariant;
  size?: TextFieldSize;
  label?: string;
  labelPlacement?: TextFieldLabelPlacement;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  hint?: string;
  state?: TextFieldState;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  showPassword?: boolean;
  onToggleVisibility?: () => void;
  onChange?: (value: string) => void;
  className?: string;
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
