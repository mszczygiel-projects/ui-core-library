import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import {
  type TextControlProps,
  textField,
  type TextFieldLabelPlacement,
} from '@mszczygiel-projects/ui-core-shared/text-field';
import { h, type VNode } from '@stencil/core';

const { options } = textField;

/** The appearance classes of a field and its label placement, after invalid values fall back. */
export function fieldAppearance(props: TextControlProps): {
  readonly classes: string;
  readonly placement: TextFieldLabelPlacement;
  readonly error: boolean;
} {
  const placement = oneOf(
    props.labelPlacement,
    options.labelPlacement.options,
    options.labelPlacement.default,
  );
  const variant = oneOf(props.variant, options.variant.options, options.variant.default);
  const size = oneOf(props.size, options.size.options, options.size.default);
  const state = oneOf(props.state, options.state.options, options.state.default);
  return {
    classes: `base ${variant} ${size} ${placement} ${state}`,
    placement,
    error: state === 'error',
  };
}

/** The placeholder of a field: a space keeps `:placeholder-shown` for the floating label. */
export function fieldPlaceholder(placeholder: string | undefined): string {
  return placeholder === undefined || placeholder === '' ? ' ' : placeholder;
}

export interface FieldProps {
  /** The appearance classes from {@link fieldAppearance}, plus any of the component. */
  readonly classes: string;
  readonly placement: TextFieldLabelPlacement;
  readonly label?: string;
  readonly hint?: string;
  /**
   * The inner form of a single-line field, which receives Enter as a native default action. A
   * field without it, such as a textarea, renders its base as a plain element.
   */
  readonly onSubmit?: (event: Event) => void;
}

/**
 * The anatomy of every text field: the label, the control with its border, and the hint. The
 * children are the content of the control, whose native element has the id `input`.
 */
export function Field(props: FieldProps, children: VNode[]): VNode {
  const label =
    props.label !== undefined && props.label !== '' ? (
      <label part="label" class="label" htmlFor="input">
        <span part="label-text">{props.label}</span>
      </label>
    ) : null;
  const content = [
    props.placement === 'top' ? label : null,
    <div part="control" class="control">
      {props.placement === 'top' ? null : label}
      {children}
    </div>,
    props.hint !== undefined && props.hint !== '' ? (
      <span id="hint" part="hint" class="hint">
        <span part="hint-text">{props.hint}</span>
      </span>
    ) : null,
  ];
  return props.onSubmit === undefined ? (
    <div part="base" class={props.classes}>
      {content}
    </div>
  ) : (
    <form role="none" noValidate onSubmit={props.onSubmit} part="base" class={props.classes}>
      {content}
    </form>
  );
}

/** The description of the control: the hint of the field. */
export function fieldDescription(hint: string | undefined): string | undefined {
  return hint !== undefined && hint !== '' ? 'hint' : undefined;
}

/** The attributes of the host that the native control receives, since no prop owns them. */
export const FORWARDED_ATTRIBUTES = ['aria-label', 'inputmode', 'enterkeyhint', 'spellcheck'];

/** The props of the native control for the attributes the page wrote on the host. */
export function forwardedAttributes(attributes: Readonly<Record<string, string | null>>): {
  readonly inputMode?: string;
  readonly enterKeyHint?: string;
  readonly spellcheck?: boolean;
  readonly 'aria-label'?: string;
} {
  const spellcheck = attributes['spellcheck'];
  return {
    inputMode: attributes['inputmode'] ?? undefined,
    enterKeyHint: attributes['enterkeyhint'] ?? undefined,
    spellcheck:
      spellcheck === null || spellcheck === undefined ? undefined : spellcheck !== 'false',
    'aria-label': attributes['aria-label'] ?? undefined,
  };
}
