import {
  forwardRef,
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type TextareaHTMLAttributes,
} from 'react';
import './TextareaField.css';

export type TextareaFieldVariant = 'outline' | 'filled' | 'underlined';
export type TextareaFieldSize = 'small' | 'default' | 'large';
export type TextareaFieldState = 'default' | 'success' | 'error' | 'disabled';
export type TextareaFieldLabelPlacement = 'top' | 'floating' | 'inner';
export type TextareaFieldResize = 'none' | 'vertical' | 'auto';

/**
 * Multi-line text input with label, hint, validation states, and a resize mode.
 *
 * @example
 * <TextareaField label="Message" hint="Max 500 characters" resize="auto" onChange={setMessage} />
 */
export interface TextareaFieldProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'onChange'
> {
  /**
   * Container style: bordered, filled background, or bottom border only.
   * @default 'outline'
   */
  variant?: TextareaFieldVariant;
  /**
   * Minimum field height and typography scale.
   * @default 'default'
   */
  size?: TextareaFieldSize;
  /** Label text. */
  label?: string;
  /**
   * Label position: above the field, floating over it, or inline inside it.
   * @default 'top'
   */
  labelPlacement?: TextareaFieldLabelPlacement;
  /** Helper text rendered below the field, linked via `aria-describedby`. */
  hint?: string;
  /**
   * Validation state; `error` also sets `aria-invalid`, `disabled` also disables the textarea.
   * @default 'default'
   */
  state?: TextareaFieldState;
  /**
   * How the field may grow: fixed, draggable by the user, or auto-grown to fit its content.
   * `auto` has no maximum — the field keeps growing as the user types.
   * @default 'vertical'
   */
  resize?: TextareaFieldResize;
  /** Called with the textarea's string value on every change. */
  onChange?: (value: string) => void;
  /** Extra class names appended to the root element. */
  className?: string;
  /** Inline styles forwarded to the root element (positioning only — never visual styles). */
  style?: CSSProperties;
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  function TextareaField(
    {
      variant = 'outline',
      size = 'default',
      label,
      labelPlacement = 'top',
      placeholder = '',
      value,
      hint,
      state = 'default',
      resize = 'vertical',
      onChange,
      name,
      disabled,
      required,
      readOnly,
      className,
      style,
      ...textareaProps
    }: TextareaFieldProps,
    ref,
  ) {
    const generatedId = useId();
    const textareaId = textareaProps.id ?? generatedId;
    const hintId = `${textareaId}-hint`;
    const isControlled = value !== undefined;

    const isDisabled = disabled || state === 'disabled';
    const isFloating = labelPlacement === 'floating';
    const isInner = labelPlacement === 'inner';

    const innerRef = useRef<HTMLTextAreaElement | null>(null);

    const setRefs = useCallback(
      (node: HTMLTextAreaElement | null) => {
        innerRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );

    /*
     * Feeds the measured content height to CSS as `--_auto-height`. The height itself is
     * applied by the stylesheet — this only supplies the measurement, which cannot be
     * expressed in CSS alone. Resetting the property to `auto` and then reading
     * `scrollHeight` forces a layout flush, so the value read back is the height the
     * content actually wants rather than the height it currently has.
     */
    const syncAutoHeight = useCallback(() => {
      const el = innerRef.current;
      if (!el) return;

      if (resize !== 'auto') {
        el.style.removeProperty('--_auto-height');
        return;
      }

      el.style.setProperty('--_auto-height', 'auto');
      const contentHeight = el.scrollHeight;
      el.style.setProperty('--_auto-height', `${contentHeight}px`);
    }, [resize]);

    useLayoutEffect(syncAutoHeight, [syncAutoHeight, value]);

    const rootClass = [
      'ui-textarea-field',
      `ui-textarea-field--${variant}`,
      size !== 'default' && `ui-textarea-field--${size}`,
      isFloating && 'ui-textarea-field--floating',
      isInner && 'ui-textarea-field--inner',
      state !== 'default' && `ui-textarea-field--state-${state}`,
      `ui-textarea-field--resize-${resize}`,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const labelEl = label ? (
      <label className="ui-textarea-field__label" htmlFor={textareaId}>
        {label}
      </label>
    ) : null;

    return (
      <div className={rootClass} style={style}>
        {!isFloating && !isInner && labelEl}
        <div className="ui-textarea-field__field-wrapper">
          {isInner && labelEl}
          <textarea
            {...textareaProps}
            id={textareaId}
            ref={setRefs}
            className="ui-textarea-field__textarea"
            name={name}
            {...(isControlled ? { value } : {})}
            placeholder={isFloating ? ' ' : placeholder}
            disabled={isDisabled}
            required={required}
            readOnly={readOnly}
            aria-invalid={state === 'error' ? 'true' : undefined}
            aria-required={required ? 'true' : undefined}
            aria-describedby={hint ? hintId : undefined}
            onChange={(e) => {
              syncAutoHeight();
              onChange?.(e.target.value);
            }}
          />
          {isFloating && labelEl}
        </div>
        {hint && (
          <p id={hintId} className="ui-textarea-field__hint">
            {hint}
          </p>
        )}
      </div>
    );
  },
);
