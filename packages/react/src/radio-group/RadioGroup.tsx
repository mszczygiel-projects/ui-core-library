'use client';

import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import {
  radioGroup,
  type RadioGroupProps as SharedRadioGroupProps,
  type RadioGroupValueChangeDetails as SharedValueChangeDetails,
} from '@mszczygiel-projects/ui-core-shared/radio-group';
import { type ComponentPropsWithRef, createContext, type ReactNode, useId } from 'react';

import { choiceDescription, choiceState } from '../internal/choice.tsx';
import { classNames } from '../internal/class-names.ts';

export type { RadioGroupOrientation } from '@mszczygiel-projects/ui-core-shared/radio-group';

/** The native change event of the chosen radio button, before React wraps it. */
export type RadioGroupValueChangeDetails = SharedValueChangeDetails<Event>;

/** What a group gives its options. */
export interface RadioGroupContextValue {
  readonly name: string;
  /** The native form ID attribute of the radio buttons; empty for a group without a name. */
  readonly form?: string;
  /** The controlled value, or undefined for an uncontrolled group. */
  readonly value?: string;
  readonly defaultValue?: string;
  readonly required: boolean;
  readonly disabled: boolean;
  readonly error: boolean;
  readonly choose: (value: string, originalEvent: Event) => void;
}

/** The group of the options inside it, or null outside a group. */
export const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

/** RadioGroup props. Native attributes and ref reach the element with the role radiogroup. */
export interface RadioGroupProps
  extends
    SharedRadioGroupProps,
    Omit<
      ComponentPropsWithRef<'div'>,
      keyof SharedRadioGroupProps | 'defaultValue' | 'children' | 'role'
    > {
  /** The controlled value. Pair it with onValueChange to accept choices. */
  value?: string;
  /** The initial uncontrolled value, restored by native form reset. */
  defaultValue?: string;
  /** The native form ID attribute of the radio buttons. */
  form?: string;
  /** The options, RadioField elements. */
  children?: ReactNode;
  /** Called once per choice, with the value of the chosen option and the native change event. */
  onValueChange?: (value: string, details: RadioGroupValueChangeDetails) => void;
}

const { orientation: orientationOption } = radioGroup.options;

/**
 * A set of radio options from which a user chooses exactly one value.
 *
 * Its options render native radio buttons that share a name, so the browser keeps one of them
 * chosen, gives the group one stop in the order of the Tab key, moves the choice with the arrow
 * keys, submits and validates it. A group without a name takes a generated one and leaves its
 * radio buttons out of every form, so that it submits nothing.
 */
export function RadioGroup({
  label,
  hint,
  orientation = 'vertical',
  value,
  defaultValue,
  name,
  form,
  required = false,
  disabled = false,
  state = 'default',
  onValueChange,
  className,
  style,
  dir,
  children,
  'aria-describedby': describedBy,
  ...rest
}: RadioGroupProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const hintId = `${id}-hint`;
  const resolved = choiceState(state);
  const layout = oneOf(orientation, orientationOption.options, orientationOption.default);
  const root: Record<string, unknown> = {};
  const group: Record<string, unknown> = {};
  for (const [key, attribute] of Object.entries(rest)) {
    (key.startsWith('data-') ? root : group)[key] = attribute;
  }
  const named = name !== undefined && name !== '';

  return (
    <div
      {...root}
      dir={dir}
      style={style}
      className={classNames(
        'ui-radio-group',
        'ui-radio-group__base',
        className,
        `ui-radio-group--${layout}`,
        `ui-radio-group--${resolved}`,
        disabled && 'ui-radio-group--disabled',
      )}
    >
      {label ? (
        <span id={labelId} className="ui-radio-group__label">
          <span className="ui-radio-group__label-text">{label}</span>
        </span>
      ) : null}
      <div
        role="radiogroup"
        className="ui-radio-group__options"
        aria-labelledby={label ? labelId : undefined}
        aria-invalid={resolved === 'error' || undefined}
        aria-required={required || undefined}
        aria-disabled={disabled || undefined}
        {...group}
        aria-describedby={choiceDescription(describedBy, hint, hintId)}
      >
        <RadioGroupContext
          value={{
            name: named ? name : id,
            // A form attribute that names no form leaves the radio buttons out of every form.
            form: named ? form : '',
            value,
            defaultValue,
            required,
            disabled,
            error: resolved === 'error',
            choose: (chosen, originalEvent) => {
              onValueChange?.(chosen, { originalEvent });
            },
          }}
        >
          {children}
        </RadioGroupContext>
      </div>
      {hint ? (
        <span id={hintId} className="ui-radio-group__hint">
          <span className="ui-radio-group__hint-text">{hint}</span>
        </span>
      ) : null}
    </div>
  );
}
