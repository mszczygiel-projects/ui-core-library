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

/** The description of the control: the author's ids, the hint and the hint of the label. */
export function fieldDescription(
  describedBy: string | undefined,
  hint: string | undefined,
  hintId: string,
  labelHint?: string,
): string | undefined {
  return (
    [describedBy, hint ? hintId : undefined, labelHint ? labelHintId(hintId) : undefined]
      .filter(Boolean)
      .join(' ') || undefined
  );
}

/** The id of the hint of the label, derived from the id of the hint. */
export function labelHintId(hintId: string): string {
  return `${hintId}-label`;
}

export interface FieldProps extends Pick<
  FieldControlProps,
  'variant' | 'size' | 'labelPlacement' | 'hideLabel' | 'state' | 'label' | 'hint' | 'labelHint'
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
  /**
   * A popup of the field, inside the root so that it inherits the theme, the density and the
   * token overrides set on the component, while the top layer takes it out of the layout.
   */
  readonly popup?: ReactNode;
}

/**
 * The anatomy of every text field: the label row with the label and its hint, the control with its
 * border, and the hint row.
 */
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
  hideLabel = false,
  state,
  label,
  hint,
  labelHint,
  children,
  labelId,
  rootRef,
  controlRef,
  popup,
}: FieldProps) {
  // A hidden label leaves the control, so the field takes the layout of a label on top.
  const placement = hideLabel
    ? 'top'
    : oneOf(labelPlacement, options.labelPlacement.options, options.labelPlacement.default);
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
  // The hint of the label sits in the label row above the control, or else closes the hint row.
  const inLabelRow = placement === 'top' && Boolean(label) && !hideLabel;
  const hasHint = hint !== undefined && hint !== '';
  const labelHintNode = labelHint ? (
    <span id={labelHintId(hintId)} className={fieldPart(block, 'label-hint')}>
      {labelHint}
    </span>
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
      {placement === 'top' && labelNode && (
        <div
          className={classNames(
            fieldPart(block, 'label-row'),
            hideLabel && 'ui-field__label-row--hidden',
          )}
        >
          {labelNode}
          {inLabelRow && labelHintNode}
        </div>
      )}
      <div ref={controlRef} className={fieldPart(block, 'control')}>
        {placement !== 'top' && labelNode}
        {children}
      </div>
      {(hasHint || (labelHintNode && !inLabelRow)) && (
        <span className={fieldPart(block, 'hint')}>
          {hasHint && (
            <span id={hintId} className={fieldPart(block, 'hint-text')}>
              {hint}
            </span>
          )}
          {!inLabelRow && labelHintNode}
        </span>
      )}
      {popup}
    </div>
  );
}
