import {
  forwardRef,
  useId,
  type CSSProperties,
  type ReactNode,
  type InputHTMLAttributes,
} from 'react';
import { IconDanger } from '@mszczygiel-projects/ui-core-icons/react';
import './TextField.css';

export type TextFieldVariant = 'outline' | 'filled' | 'underlined';
export type TextFieldSize = 'small' | 'default' | 'large';
export type TextFieldState = 'default' | 'success' | 'error' | 'disabled';
export type TextFieldLabelPlacement = 'top' | 'floating' | 'inner';

/**
 * Single-line text input with label, hint, validation states, and optional icons.
 *
 * @example
 * <TextField label="Email" type="email" hint="Work address preferred" onChange={setEmail} />
 */
export interface TextFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'onChange'
> {
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
  /** Helper text rendered below the field, linked via `aria-describedby`. */
  hint?: string;
  /**
   * Validation state; `error` shows a danger icon, `disabled` also disables the input.
   * @default 'default'
   */
  state?: TextFieldState;
  /** Icon rendered inside the field, at the start. */
  leadingIcon?: ReactNode;
  /** Icon rendered inside the field, at the end; `error` state provides a default. */
  trailingIcon?: ReactNode;
  /** Called with the input's string value on every change. */
  onChange?: (value: string) => void;
  /** Extra class names appended to the root element. */
  className?: string;
  /** Inline styles forwarded to the root element (positioning only — never visual styles). */
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

  const isFloating = labelPlacement === 'floating';
  const isInner = labelPlacement === 'inner';

  const rootClass = [
    'ui-text-field',
    `ui-text-field--${variant}`,
    size !== 'default' && `ui-text-field--${size}`,
    isFloating && 'ui-text-field--floating',
    isInner && 'ui-text-field--inner',
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
      {!isFloating && !isInner && labelEl}
      <div className="ui-text-field__field-wrapper">
        {isInner && labelEl}
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
