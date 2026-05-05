import { useId, type CSSProperties, type ReactNode, type InputHTMLAttributes } from 'react';
import './text-input.css';

export type TextInputVariant = 'outline' | 'filled' | 'underlined';
export type TextInputSize = 'small' | 'default' | 'large';
export type TextInputState = 'default' | 'success' | 'error' | 'disabled';
export type TextInputLabelPlacement = 'top' | 'floating';

export interface TextInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'onChange'
> {
  variant?: TextInputVariant;
  size?: TextInputSize;
  label?: string;
  labelPlacement?: TextInputLabelPlacement;
  hint?: string;
  state?: TextInputState;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  onChange?: (value: string) => void;
  className?: string;
  style?: CSSProperties;
}

export function TextInput({
  variant = 'outline',
  size = 'default',
  label,
  labelPlacement = 'top',
  placeholder = '',
  value = '',
  hint,
  state = 'default',
  leadingIcon,
  trailingIcon,
  onChange,
  name,
  type = 'text',
  disabled,
  required,
  readOnly,
  className,
  style,
  ...inputProps
}: TextInputProps) {
  const generatedId = useId();
  const inputId = inputProps.id ?? generatedId;
  const hintId = `${inputId}-hint`;

  const isDisabled = disabled || state === 'disabled';

  const effectivePlacement = (): TextInputLabelPlacement => {
    if (variant === 'filled') return 'top';
    if (variant === 'underlined') return 'floating';
    return labelPlacement;
  };

  const isFloating = effectivePlacement() === 'floating';

  const rootClass = [
    'ui-text-input',
    `ui-text-input--${variant}`,
    size !== 'default' && `ui-text-input--${size}`,
    isFloating && 'ui-text-input--floating',
    state !== 'default' && `ui-text-input--state-${state}`,
    leadingIcon && 'ui-text-input--has-leading-icon',
    trailingIcon && 'ui-text-input--has-trailing-icon',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const labelEl = label ? (
    <label className="ui-text-input__label" htmlFor={inputId}>
      {label}
    </label>
  ) : null;

  return (
    <div className={rootClass} style={style}>
      {!isFloating && labelEl}
      <div className="ui-text-input__field-wrapper">
        {leadingIcon && (
          <span className="ui-text-input__icon ui-text-input__icon--leading">{leadingIcon}</span>
        )}
        <input
          {...inputProps}
          id={inputId}
          className="ui-text-input__input"
          type={type}
          name={name}
          value={value}
          placeholder={isFloating ? ' ' : placeholder}
          disabled={isDisabled}
          required={required}
          readOnly={readOnly}
          aria-invalid={state === 'error' ? 'true' : undefined}
          aria-required={required ? 'true' : undefined}
          aria-describedby={hint ? hintId : undefined}
          onChange={(e) => onChange?.(e.target.value)}
        />
        {isFloating && labelEl}
        {trailingIcon && (
          <span className="ui-text-input__icon ui-text-input__icon--trailing">{trailingIcon}</span>
        )}
      </div>
      {hint && (
        <p id={hintId} className="ui-text-input__hint">
          {hint}
        </p>
      )}
    </div>
  );
}
