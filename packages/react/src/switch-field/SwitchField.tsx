'use client';

import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import {
  switchField,
  type SwitchFieldProps as SharedSwitchFieldProps,
} from '@mszczygiel-projects/ui-core-shared/switch-field';
import { type ComponentPropsWithRef, type ReactNode, useId } from 'react';

import type { CheckedChangeDetails } from '../checkbox-field/CheckboxField.tsx';
import { Choice, choiceDescription, choicePart, choiceState } from '../internal/choice.tsx';
import { splitFieldAttributes } from '../internal/field.tsx';
import { rendersContent } from '../internal/renders-content.ts';

export type { SwitchFieldLabelPosition } from '@mszczygiel-projects/ui-core-shared/switch-field';

const { labelPosition: labelPositionOption } = switchField.options;

/** SwitchField props. Appearance attributes reach the root; native attributes and ref reach the input. */
export interface SwitchFieldProps
  extends
    SharedSwitchFieldProps,
    Omit<
      ComponentPropsWithRef<'input'>,
      keyof SharedSwitchFieldProps | 'type' | 'defaultValue' | 'children' | 'required'
    > {
  /** The controlled state. Pair it with onCheckedChange to accept clicks. */
  checked?: boolean;
  /** The initial uncontrolled state, restored by native form reset. @default false */
  defaultChecked?: boolean;
  /** A decorative icon in the thumb while the switch is on. */
  iconOn?: ReactNode;
  /** A decorative icon in the thumb while the switch is off. */
  iconOff?: ReactNode;
  /** React's native change handler, called on each click. */
  onChange?: ComponentPropsWithRef<'input'>['onChange'];
  /** Called once per click, with the new state and the native change event. */
  onCheckedChange?: (checked: boolean, details: CheckedChangeDetails) => void;
}

/**
 * A switch with a label and hint that turns a setting on or off at once.
 *
 * A native checkbox with the role switch draws the track from its own state, controlled with
 * `checked` or uncontrolled with `defaultChecked`.
 */
export function SwitchField({
  label,
  hint,
  labelPosition = 'end',
  state = 'default',
  disabled,
  value = 'on',
  iconOn,
  iconOff,
  onChange,
  onCheckedChange,
  className,
  style,
  dir,
  'aria-describedby': describedBy,
  ...rest
}: SwitchFieldProps) {
  const attributes = splitFieldAttributes(rest);
  const hintId = `${useId()}-hint`;
  const resolved = choiceState(state);
  const position = oneOf(labelPosition, labelPositionOption.options, labelPositionOption.default);

  return (
    <Choice
      block="switch-field"
      hintId={hintId}
      className={className}
      style={style}
      dir={dir}
      rootAttributes={attributes.root}
      modifiers={[position, resolved]}
      label={label}
      hint={hint}
    >
      <span className={choicePart('switch-field', 'control')}>
        <input
          type="checkbox"
          role="switch"
          className={choicePart('switch-field', 'input')}
          value={value}
          disabled={disabled}
          aria-invalid={resolved === 'error' || undefined}
          {...attributes.control}
          aria-describedby={choiceDescription(describedBy, hint, hintId)}
          onChange={(event) => {
            onChange?.(event);
            onCheckedChange?.(event.currentTarget.checked, { originalEvent: event.nativeEvent });
          }}
        />
        <span className="ui-switch-field__thumb" aria-hidden="true">
          {rendersContent(iconOn) && (
            <span className="ui-switch-field__icon ui-switch-field__icon-on">{iconOn}</span>
          )}
          {rendersContent(iconOff) && (
            <span className="ui-switch-field__icon ui-switch-field__icon-off">{iconOff}</span>
          )}
        </span>
      </span>
    </Choice>
  );
}
