import {
  forwardRef,
  useId,
  type CSSProperties,
  type ReactNode,
  type InputHTMLAttributes,
} from 'react';
import { IconDanger } from '@ui-core/icons/react';
import './TextField.css';

export type TextFieldVariant = 'outline' | 'filled' | 'underlined';
export type TextFieldSize = 'small' | 'default' | 'large';
export type TextFieldState = 'default' | 'success' | 'error' | 'disabled';
export type TextFieldLabelPlacement = 'top' | 'floating';

export interface TextFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'onChange'
> {
  variant?: TextFieldVariant;
  size?: TextFieldSize;
  label?: string;
  labelPlacement?: TextFieldLabelPlacement;
  hint?: string;
  state?: TextFieldState;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  onChange?: (value: string) => void;
  className?: string;
  style?: CSSProperties;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  {
    variant = 'outline',
    size = 'default',
    label,
    labelPlacement = 'top',
    placeholder = '',
    value,
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
  }: TextFieldProps,
  ref,
) {
  const generatedId = useId();
  const inputId = inputProps.id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const isControlled = value !== undefined;

  const isDisabled = disabled || state === 'disabled';
  const effectiveTrailingIcon = trailingIcon ?? (state === 'error' ? <IconDanger /> : undefined);

  const effectivePlacement = (): TextFieldLabelPlacement => {
    if (variant === 'filled') return 'top';
    if (variant === 'underlined') return 'floating';
    return labelPlacement;
  };

  const isFloating = effectivePlacement() === 'floating';

  const rootClass = [
    'ui-text-field',
    `ui-text-field--${variant}`,
    size !== 'default' && `ui-text-field--${size}`,
    isFloating && 'ui-text-field--floating',
    state !== 'default' && `ui-text-field--state-${state}`,
    leadingIcon && 'ui-text-field--has-leading-icon',
    effectiveTrailingIcon && 'ui-text-field--has-trailing-icon',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const labelEl = label ? (
    <label className="ui-text-field__label" htmlFor={inputId}>
      {label}
    </label>
  ) : null;

  return (
    <div className={rootClass} style={style}>
      {!isFloating && labelEl}
      <div className="ui-text-field__field-wrapper">
        {leadingIcon && (
          <span className="ui-text-field__icon ui-text-field__icon--leading">{leadingIcon}</span>
        )}
        <input
          {...inputProps}
          id={inputId}
          ref={ref}
          className="ui-text-field__input"
          type={type}
          name={name}
          {...(isControlled ? { value } : {})}
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
        {effectiveTrailingIcon && (
          <span className="ui-text-field__icon ui-text-field__icon--trailing">
            {effectiveTrailingIcon}
          </span>
        )}
      </div>
      {hint && (
        <p id={hintId} className="ui-text-field__hint">
          {hint}
        </p>
      )}
    </div>
  );
});
