import { useState, type CSSProperties } from 'react';
import { IconEye } from '@ui-core/icons/react';
import { IconEyeSlash } from '@ui-core/icons/react';
import { TextInput } from '../TextInput/TextInput.js';
import type {
  TextInputVariant,
  TextInputSize,
  TextInputState,
  TextInputLabelPlacement,
} from '../TextInput/TextInput.js';
import './PasswordInput.css';

export interface PasswordInputProps {
  variant?: TextInputVariant;
  size?: TextInputSize;
  label?: string;
  labelPlacement?: TextInputLabelPlacement;
  placeholder?: string;
  value?: string;
  hint?: string;
  state?: TextInputState;
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

export function PasswordInput({
  showPassword: controlledShowPassword,
  onToggleVisibility,
  disabled,
  state,
  ...rest
}: PasswordInputProps) {
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
      className="ui-password-input__toggle"
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
    <TextInput
      {...rest}
      type={showPassword ? 'text' : 'password'}
      disabled={disabled}
      state={state}
      trailingIcon={toggleButton}
    />
  );
}
