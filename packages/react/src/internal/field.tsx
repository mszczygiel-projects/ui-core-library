import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import { type FieldControlProps, textField } from '@mszczygiel-projects/ui-core-shared/text-field';
import type { CSSProperties, ReactNode, Ref } from 'react';

import { classNames } from './class-names.ts';

const { options } = textField;

/**
 * The class names of an element of a text field: the shared element of the field family, which
 * carries the styles, and the element of the component, which names the part.
 */
export function fieldPart(block: string, element: string): string {
  return `ui-field__${element} ui-${block}__${element}`;
}

/**
 * Splits the attributes that a text field passes on: `data-*` reach the root, and everything else,
 * such as `id`, `aria-*` and native attributes, reaches the native control.
 */
export function splitFieldAttributes(attributes: Readonly<Record<string, unknown>>): {
  readonly root: Record<string, unknown>;
  readonly control: Record<string, unknown>;
} {
  const root: Record<string, unknown> = {};
  const control: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(attributes)) {
    (name.startsWith('data-') ? root : control)[name] = value;
  }
  return { root, control };
}

/** The placeholder of a field: a space keeps `:placeholder-shown` for the floating label. */
export function fieldPlaceholder(placeholder: string | undefined): string {
  return placeholder === undefined || placeholder === '' ? ' ' : placeholder;
}

/** The description of the control: the author's ids and the hint. */
export function fieldDescription(
  describedBy: string | undefined,
  hint: string | undefined,
  hintId: string,
): string | undefined {
  return [describedBy, hint ? hintId : undefined].filter(Boolean).join(' ') || undefined;
}

export interface FieldProps extends Pick<
  FieldControlProps,
  'variant' | 'size' | 'labelPlacement' | 'state' | 'label' | 'hint'
> {
  /** The block of the component, such as `text-field`. */
  readonly block: string;
  /** The id of the native control, which the label names. */
  readonly controlId: string;
  readonly hintId: string;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly dir?: string;
  /** The `data-*` attributes of the root. */
  readonly rootAttributes: Readonly<Record<string, unknown>>;
  /** Classes of the component on the root, such as its modifiers. */
  readonly modifiers?: readonly (string | false | undefined)[];
  /** The content of the control, after the label: the input row or the textarea. */
  readonly children: ReactNode;
  /** The id of the label, for a control that names something else with it, such as a list. */
  readonly labelId?: string;
  /** Receives the root of the field. */
  readonly rootRef?: Ref<HTMLDivElement>;
  /** Receives the control, the surface with the border. */
  readonly controlRef?: Ref<HTMLDivElement>;
}

/** The anatomy of every text field: the label, the control with its border, and the hint. */
export function Field({
  block,
  controlId,
  hintId,
  className,
  style,
  dir,
  rootAttributes,
  modifiers = [],
  variant,
  size,
  labelPlacement,
  state,
  label,
  hint,
  children,
  labelId,
  rootRef,
  controlRef,
}: FieldProps) {
  const placement = oneOf(
    labelPlacement,
    options.labelPlacement.options,
    options.labelPlacement.default,
  );
  const appearance = [
    oneOf(variant, options.variant.options, options.variant.default),
    oneOf(size, options.size.options, options.size.default),
    placement,
    oneOf(state, options.state.options, options.state.default),
  ];
  const labelNode = label ? (
    <label id={labelId} className={fieldPart(block, 'label')} htmlFor={controlId}>
      <span className={fieldPart(block, 'label-text')}>{label}</span>
    </label>
  ) : null;
  return (
    <div
      {...rootAttributes}
      ref={rootRef}
      // The direction belongs to the whole field, as on the host of the web component: the label,
      // the hint and the icons follow it, and the control inherits it.
      dir={dir}
      style={style}
      className={classNames(
        'ui-field',
        `ui-${block}`,
        `ui-${block}__base`,
        className,
        ...appearance.map((modifier) => `ui-field--${modifier} ui-${block}--${modifier}`),
        ...modifiers,
      )}
    >
      {placement === 'top' && labelNode}
      <div ref={controlRef} className={fieldPart(block, 'control')}>
        {placement !== 'top' && labelNode}
        {children}
      </div>
      {hint && (
        <span id={hintId} className={fieldPart(block, 'hint')}>
          <span className={fieldPart(block, 'hint-text')}>{hint}</span>
        </span>
      )}
    </div>
  );
}
