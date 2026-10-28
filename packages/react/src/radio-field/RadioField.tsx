'use client';

import type { RadioFieldProps as SharedRadioFieldProps } from '@mszczygiel-projects/ui-core-shared/radio-field';
import { type ComponentPropsWithRef, use, useId } from 'react';

import { Choice, choiceDescription, choicePart } from '../internal/choice.tsx';
import { splitFieldAttributes } from '../internal/field.tsx';
import { RadioGroupContext } from '../radio-group/RadioGroup.tsx';

/** RadioField props. Appearance attributes reach the root; native attributes and ref reach the input. */
export interface RadioFieldProps
  extends
    SharedRadioFieldProps,
    Omit<
      ComponentPropsWithRef<'input'>,
      | keyof SharedRadioFieldProps
      | 'type'
      | 'name'
      | 'checked'
      | 'defaultChecked'
      | 'required'
      | 'form'
      | 'defaultValue'
      | 'children'
    > {
  /** The value that the group takes when a user chooses this option. */
  value: string;
}

/**
 * One option of a RadioGroup, with a label and hint.
 *
 * It renders a native radio button with the name of its group, which the value of the group
 * chooses. Outside a group, the option has no state and submits nothing.
 */
export function RadioField({
  value,
  label,
  hint,
  disabled,
  onChange,
  className,
  style,
  dir,
  'aria-describedby': describedBy,
  ...rest
}: RadioFieldProps) {
  const group = use(RadioGroupContext);
  const attributes = splitFieldAttributes(rest);
  const hintId = `${useId()}-hint`;
  const isDisabled = disabled === true || group?.disabled === true;
  const checked =
    group === null
      ? { checked: false }
      : group.value !== undefined
        ? { checked: group.value === value }
        : { defaultChecked: group.defaultValue === value };

  return (
    <Choice
      block="radio-field"
      hintId={hintId}
      className={className}
      style={style}
      dir={dir}
      rootAttributes={attributes.root}
      modifiers={['end', group?.error === true ? 'error' : 'default']}
      label={label}
      hint={hint}
    >
      <span className={choicePart('radio-field', 'control')}>
        <input
          type="radio"
          className={choicePart('radio-field', 'input')}
          name={group?.name}
          form={group?.form}
          value={value}
          {...checked}
          disabled={isDisabled}
          required={group?.required}
          {...attributes.control}
          aria-describedby={choiceDescription(describedBy, hint, hintId)}
          onChange={(event) => {
            onChange?.(event);
            group?.choose(value, event.nativeEvent);
          }}
        />
        <span className="ui-radio-field__dot" aria-hidden="true" />
      </span>
    </Choice>
  );
}
