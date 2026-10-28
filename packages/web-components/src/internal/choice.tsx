import {
  checkboxField,
  type ChoiceState,
} from '@mszczygiel-projects/ui-core-shared/checkbox-field';
import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import { h, type VNode } from '@stencil/core';

const { state: stateOption } = checkboxField.options;

/** The state of a choice control after an invalid value falls back. */
export function choiceState(state: unknown): ChoiceState {
  return oneOf(state, stateOption.options, stateOption.default);
}

export interface ChoiceProps {
  /** The classes of the base: the component's own, such as its label position and state. */
  readonly classes: string;
  readonly label?: string;
  readonly hint?: string;
}

/**
 * The anatomy of every choice control: a label that holds the control and its text, so that a
 * click on either toggles the native input, and the hint below, outside the label, so that it
 * describes the control without joining its name. The children are the control.
 */
export function Choice(props: ChoiceProps, children: VNode[]): VNode {
  return (
    <div part="base" class={props.classes}>
      <label part="label" class="label">
        {children}
        {props.label !== undefined && props.label !== '' ? (
          <span part="label-text" class="label-text">
            {props.label}
          </span>
        ) : null}
      </label>
      {props.hint !== undefined && props.hint !== '' ? (
        <span id="hint" part="hint" class="hint">
          <span part="hint-text">{props.hint}</span>
        </span>
      ) : null}
    </div>
  );
}

/** The description of the control: the hint of the choice. */
export function choiceDescription(hint: string | undefined): string | undefined {
  return hint !== undefined && hint !== '' ? 'hint' : undefined;
}
