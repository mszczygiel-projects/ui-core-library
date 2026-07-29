import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { IconPlus, IconMinus } from '@mszczygiel-projects/ui-core-icons/react';
import { TextField } from '../TextField/TextField.js';
import type {
  TextFieldVariant,
  TextFieldSize,
  TextFieldState,
  TextFieldLabelPlacement,
} from '../TextField/TextField.js';
import { commitValue, formatValue, parseValue, stepValue } from './numeric.js';
import { useHoldRepeat } from './useHoldRepeat.js';
import './NumberField.css';
import { getUiCoreConfig } from '@mszczygiel-projects/ui-core-foundations';

export type NumberFieldVariant = TextFieldVariant;
export type NumberFieldSize = TextFieldSize;
export type NumberFieldState = TextFieldState;
export type NumberFieldLabelPlacement = TextFieldLabelPlacement;
export type NumberFieldControls = 'none' | 'inline';

/**
 * Numeric input with optional flanking stepper buttons.
 *
 * Omitting `label` and `hint` renders a bare field with no surrounding chrome,
 * which suits compact contexts such as a table-cell quantity editor.
 *
 * @example
 * <NumberField label="Quantity" controls="inline" min={1} max={99} onValueChange={setQty} />
 */
export interface NumberFieldProps {
  /** Controlled value; omit for uncontrolled mode. `null` means empty. */
  value?: number | null;
  /** Initial value in uncontrolled mode. */
  defaultValue?: number;
  /**
   * Lower bound, applied on commit.
   * @default -Infinity
   */
  min?: number;
  /**
   * Upper bound, applied on commit.
   * @default Infinity
   */
  max?: number;
  /**
   * Amount added or removed per step. Independent of `precision`.
   * @default 1
   */
  step?: number;
  /**
   * Decimal places kept on commit; `0` gives integer behaviour.
   * @default 0
   */
  precision?: number;
  /**
   * `inline` adds decrement/increment buttons flanking the value.
   * @default 'none'
   */
  controls?: NumberFieldControls;
  /**
   * Container style: bordered, filled background, or bottom border only.
   * @default 'outline'
   */
  variant?: NumberFieldVariant;
  /**
   * Field height and typography scale.
   * @default 'default'
   */
  size?: NumberFieldSize;
  /** Label text; omit for a bare field. */
  label?: string;
  /**
   * Label position. Forced to `top` when `controls` is `inline`, because the
   * steppers occupy the space a floating or inner label would need.
   * @default 'top'
   */
  labelPlacement?: NumberFieldLabelPlacement;
  /** Helper text rendered below the field, linked via `aria-describedby`. */
  hint?: string;
  /** Placeholder shown while empty. */
  placeholder?: string;
  /**
   * Validation state; `disabled` also disables the input and steppers.
   * @default 'default'
   */
  state?: NumberFieldState;
  /** Native form field name. */
  name?: string;
  /** Disables the input and both steppers. */
  disabled?: boolean;
  /** Marks the field as required for form submission. */
  required?: boolean;
  /** Makes the input read-only; steppers are disabled too. */
  readOnly?: boolean;
  /**
   * Accessible name for the decrement button.
   * @default `getUiCoreConfig().labels.numberField.decrement`
   */
  decrementLabel?: string;
  /**
   * Accessible name for the increment button.
   * @default `getUiCoreConfig().labels.numberField.increment`
   */
  incrementLabel?: string;
  /** Called on commit: blur, Enter, arrow key, or stepper click/hold tick. */
  onValueChange?: (value: number | null) => void;
  /** Extra class names appended to the root element. */
  className?: string;
  /** Inline styles forwarded to the root element (positioning only — never visual styles). */
  style?: CSSProperties;
}

export function NumberField({
  value,
  defaultValue,
  min = -Infinity,
  max = Infinity,
  step = 1,
  precision = 0,
  controls = 'none',
  variant = 'outline',
  size = 'default',
  label,
  labelPlacement = 'top',
  hint,
  placeholder,
  state = 'default',
  name,
  disabled,
  required,
  readOnly,
  decrementLabel,
  incrementLabel,
  onValueChange,
  className,
  style,
}: NumberFieldProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<number | null>(() =>
    defaultValue !== undefined ? commitValue(defaultValue, min, max, precision) : null,
  );
  const currentValue = isControlled ? (value ?? null) : internalValue;

  const [text, setText] = useState(() => formatValue(currentValue, precision));
  const [isEditing, setIsEditing] = useState(false);

  const isDisabled = disabled || state === 'disabled';
  const isInline = controls === 'inline';
  const isInert = Boolean(isDisabled || readOnly);

  // A held stepper ticks faster than React re-renders, so each tick would
  // otherwise keep stepping from the same stale value. These mirrors let a tick
  // read — and advance — the committed value synchronously; every render
  // resyncs them to the real state.
  const valueRef = useRef(currentValue);
  const textRef = useRef(text);
  valueRef.current = currentValue;
  textRef.current = text;

  // Mirror committed changes into the input, but never while the user is typing —
  // a transient "1." must survive until blur.
  useEffect(() => {
    if (!isEditing) setText(formatValue(currentValue, precision));
  }, [currentValue, precision, isEditing]);

  /** Commits a value; reports whether it actually moved. */
  const applyValue = useCallback(
    (next: number | null): boolean => {
      const moved = next !== valueRef.current;
      setIsEditing(false);
      if (isControlled) {
        // The parent owns the value — show what it actually is, not what we asked for.
        setText(formatValue(valueRef.current, precision));
      } else {
        valueRef.current = next;
        textRef.current = formatValue(next, precision);
        setInternalValue(next);
        setText(textRef.current);
      }
      if (moved) onValueChange?.(next);
      return moved;
    },
    [isControlled, onValueChange, precision],
  );

  const commitText = useCallback(() => {
    const parsed = parseValue(textRef.current);
    applyValue(parsed === null ? null : commitValue(parsed, min, max, precision));
  }, [applyValue, max, min, precision]);

  /** Performs one step; reports whether the value actually moved. */
  const doStep = useCallback(
    (direction: 1 | -1): boolean => {
      if (isInert) return false;
      // Step from whatever is currently typed, so a hold continues from there.
      const base = parseValue(textRef.current) ?? valueRef.current;
      const next = stepValue(base, direction, step, min, max, precision);
      return applyValue(next);
    },
    [applyValue, isInert, max, min, precision, step],
  );

  const decrementHold = useHoldRepeat(useCallback(() => doStep(-1), [doStep]));
  const incrementHold = useHoldRepeat(useCallback(() => doStep(1), [doStep]));

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      doStep(1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      doStep(-1);
    } else if (event.key === 'Enter') {
      commitText();
    }
  };

  const atMin = currentValue !== null && currentValue <= min;
  const atMax = currentValue !== null && currentValue >= max;

  const stepper = (
    kind: 'decrement' | 'increment',
    ariaLabel: string,
    icon: ReactNode,
    atBound: boolean,
    hold: ReturnType<typeof useHoldRepeat>,
  ) => (
    <button
      type="button"
      className={`ui-number-field__stepper ui-number-field__stepper--${kind}`}
      aria-label={ariaLabel}
      disabled={isInert || atBound}
      onPointerDown={(event) => {
        // Keep focus on the input so typing can continue after a click.
        event.preventDefault();
        hold.start();
      }}
      onPointerUp={hold.stop}
      onPointerLeave={hold.stop}
      onPointerCancel={hold.stop}
    >
      {icon}
    </button>
  );

  const rootClass = ['ui-number-field', isInline && 'ui-number-field--inline', className]
    .filter(Boolean)
    .join(' ');

  return (
    <TextField
      className={rootClass}
      style={style}
      variant={variant}
      size={size}
      label={label}
      labelPlacement={isInline ? 'top' : labelPlacement}
      hint={hint}
      placeholder={placeholder}
      state={state}
      name={name}
      disabled={disabled}
      required={required}
      readOnly={readOnly}
      value={text}
      type="text"
      inputMode={precision > 0 ? 'decimal' : 'numeric'}
      pattern={precision > 0 ? '[0-9]*[.,]?[0-9]*' : '[0-9]*'}
      autoComplete="off"
      role="spinbutton"
      aria-valuenow={currentValue ?? undefined}
      aria-valuemin={Number.isFinite(min) ? min : undefined}
      aria-valuemax={Number.isFinite(max) ? max : undefined}
      onChange={(next) => {
        setIsEditing(true);
        textRef.current = next;
        setText(next);
      }}
      onBlur={commitText}
      onKeyDown={handleKeyDown}
      leadingIcon={
        isInline
          ? stepper(
              'decrement',
              decrementLabel ?? getUiCoreConfig().labels.numberField.decrement,
              <IconMinus />,
              atMin,
              decrementHold,
            )
          : undefined
      }
      trailingIcon={
        isInline
          ? stepper(
              'increment',
              incrementLabel ?? getUiCoreConfig().labels.numberField.increment,
              <IconPlus />,
              atMax,
              incrementHold,
            )
          : undefined
      }
    />
  );
}
