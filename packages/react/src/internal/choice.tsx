import {
  checkboxField,
  type ChoiceState,
} from '@mszczygiel-projects/ui-core-shared/checkbox-field';
import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import type { CSSProperties, ReactNode } from 'react';

import { classNames } from './class-names.ts';

const { state: stateOption } = checkboxField.options;

/** The state of a choice control after an invalid value falls back. */
export function choiceState(state: unknown): ChoiceState {
  return oneOf(state, stateOption.options, stateOption.default);
}

/**
 * The class names of an element of a choice control: the shared element of the choice family,
 * which carries the styles, and the element of the component, which names the part.
 */
export function choicePart(block: string, element: string): string {
  return `ui-choice__${element} ui-${block}__${element}`;
}

/** The description of the control: the author's ids and the hint. */
export function choiceDescription(
  describedBy: string | undefined,
  hint: string | undefined,
  hintId: string,
): string | undefined {
  return [describedBy, hint ? hintId : undefined].filter(Boolean).join(' ') || undefined;
}

export interface ChoiceProps {
  /** The block of the component, such as `checkbox-field`. */
  readonly block: string;
  readonly hintId: string;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly dir?: string;
  /** The `data-*` attributes of the root. */
  readonly rootAttributes: Readonly<Record<string, unknown>>;
  /** The modifiers of the root, such as the label position, the state and `disabled`. */
  readonly modifiers: readonly (string | false | undefined)[];
  readonly label?: string;
  readonly hint?: string;
  /** The control: the native input and what draws it. */
  readonly children: ReactNode;
}

/**
 * The anatomy of every choice control: a label that holds the control and its text, so that a
 * click on either toggles the native input, and the hint below, outside the label, so that it
 * describes the control without joining its name.
 */
export function Choice({
  block,
  hintId,
  className,
  style,
  dir,
  rootAttributes,
  modifiers,
  label,
  hint,
  children,
}: ChoiceProps) {
  return (
    <div
      {...rootAttributes}
      dir={dir}
      style={style}
      className={classNames(
        'ui-choice',
        `ui-${block}`,
        `ui-${block}__base`,
        className,
        ...modifiers.map(
          (modifier) =>
            modifier !== false &&
            modifier !== undefined &&
            `ui-choice--${modifier} ui-${block}--${modifier}`,
        ),
      )}
    >
      <label className={choicePart(block, 'label')}>
        {children}
        {label ? <span className={choicePart(block, 'label-text')}>{label}</span> : null}
      </label>
      {hint ? (
        <span id={hintId} className={choicePart(block, 'hint')}>
          <span className={`ui-${block}__hint-text`}>{hint}</span>
        </span>
      ) : null}
    </div>
  );
}
