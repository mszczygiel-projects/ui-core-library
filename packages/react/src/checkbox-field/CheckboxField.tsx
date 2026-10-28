'use client';

import { iconCheckmark, iconMinus } from '@mszczygiel-projects/ui-core-icons';
import type {
  CheckboxFieldProps as SharedCheckboxFieldProps,
  CheckedChangeDetails as SharedCheckedChangeDetails,
} from '@mszczygiel-projects/ui-core-shared/checkbox-field';
import { type ComponentPropsWithRef, useEffect, useId, useRef } from 'react';

import { Choice, choiceDescription, choicePart, choiceState } from '../internal/choice.tsx';
import { splitFieldAttributes } from '../internal/field.tsx';
import { setRef } from '../internal/set-ref.ts';

export type { ChoiceState } from '@mszczygiel-projects/ui-core-shared/checkbox-field';

/** The native event that checked or cleared the box, before React wraps it. */
export type CheckedChangeDetails = SharedCheckedChangeDetails<Event>;

/** CheckboxField props. Appearance attributes reach the root; native attributes and ref reach the input. */
export interface CheckboxFieldProps
  extends
    SharedCheckboxFieldProps,
    Omit<
      ComponentPropsWithRef<'input'>,
      keyof SharedCheckboxFieldProps | 'type' | 'defaultValue' | 'children'
    > {
  /** The controlled state. Pair it with onCheckedChange to accept clicks. */
  checked?: boolean;
  /** The initial uncontrolled state, restored by native form reset. @default false */
  defaultChecked?: boolean;
  /** React's native change handler, called on each click. */
  onChange?: ComponentPropsWithRef<'input'>['onChange'];
  /** Called once per click, with the new state and the native change event. */
  onCheckedChange?: (checked: boolean, details: CheckedChangeDetails) => void;
}

/**
 * A checkbox with a label and hint that a user turns on and off, with a mixed state for a partial
 * selection.
 *
 * The native checkbox draws the box from its own state, controlled with `checked` or uncontrolled
 * with `defaultChecked`. A click ends the mixed state of `indeterminate`, as on a native checkbox,
 * and `onCheckedChange` reports it; the next render with `indeterminate` still set shows it again.
 */
export function CheckboxField({
  label,
  hint,
  indeterminate = false,
  state = 'default',
  disabled,
  value = 'on',
  onChange,
  onCheckedChange,
  className,
  style,
  dir,
  ref,
  'aria-describedby': describedBy,
  ...rest
}: CheckboxFieldProps) {
  const attributes = splitFieldAttributes(rest);
  const hintId = `${useId()}-hint`;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const resolved = choiceState(state);

  // The mixed state has no attribute, so the property follows the prop after each render.
  useEffect(() => {
    if (inputRef.current !== null) {
      inputRef.current.indeterminate = indeterminate;
    }
  });

  return (
    <Choice
      block="checkbox-field"
      hintId={hintId}
      className={className}
      style={style}
      dir={dir}
      rootAttributes={attributes.root}
      modifiers={['end', resolved]}
      label={label}
      hint={hint}
    >
      <span className={choicePart('checkbox-field', 'control')}>
        <input
          type="checkbox"
          className={choicePart('checkbox-field', 'input')}
          value={value}
          disabled={disabled}
          aria-invalid={resolved === 'error' || undefined}
          {...attributes.control}
          ref={(input) => {
            inputRef.current = input;
            const release = setRef(ref, input);
            return () => {
              inputRef.current = null;
              release();
            };
          }}
          aria-describedby={choiceDescription(describedBy, hint, hintId)}
          onChange={(event) => {
            onChange?.(event);
            onCheckedChange?.(event.currentTarget.checked, { originalEvent: event.nativeEvent });
          }}
        />
        <span className="ui-checkbox-field__mark" aria-hidden="true">
          {/* The icons package holds trusted SVG strings, drawn in currentColor. */}
          <span
            className="ui-checkbox-field__mark-check"
            dangerouslySetInnerHTML={{ __html: iconCheckmark }}
          />
          <span
            className="ui-checkbox-field__mark-mixed"
            dangerouslySetInnerHTML={{ __html: iconMinus }}
          />
        </span>
      </span>
    </Choice>
  );
}
