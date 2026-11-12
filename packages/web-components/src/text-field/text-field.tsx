import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import {
  textField,
  type TextFieldLabelPlacement,
  type TextFieldProps,
  type TextFieldSize,
  type TextFieldState,
  type TextFieldType,
  type TextFieldVariant,
} from '@mszczygiel-projects/ui-core-shared/text-field';
import {
  AttachInternals,
  Component,
  Element,
  Event,
  type EventEmitter,
  h,
  Prop,
  State,
  type VNode,
} from '@stencil/core';

import {
  Field,
  fieldAppearance,
  fieldDescription,
  fieldPlaceholder,
  FORWARDED_ATTRIBUTES,
  forwardedAttributes,
} from '../internal/field.tsx';
import { followAttribute } from '../internal/follow-attribute.ts';
import type { FormAssociated } from '../internal/form-associated.ts';
import { hasAssignedContent } from '../internal/slots.ts';
import { TextControl } from '../internal/text-control.ts';
import type { TextFieldValueChange } from './events.ts';

const { options } = textField;

declare global {
  interface HTMLUiTextFieldElement extends FormAssociated {
    /** The current string. The `value` attribute supplies the initial and reset value. */
    value: string;
    /** Sets a custom constraint; an empty string clears it. */
    setCustomValidity(message: string): void;
  }

  interface HTMLElementEventMap {
    'ui-value-change': CustomEvent<TextFieldValueChange>;
  }
}

/**
 * A single-line text input with a label, hint and validation feedback.
 *
 * Its inner input owns accessibility; ElementInternals associates the host with the outer form.
 * The `value` attribute supplies the reset value, and the property holds the current value. The
 * native `inputmode`, `enterkeyhint` and `spellcheck` attributes and an author's `aria-label`
 * reach the input.
 *
 * @slot leading-icon - A decorative icon before the input, in reading order.
 * @slot trailing-icon - A decorative icon after the input, in reading order.
 * @part base - The field, label and hint.
 * @part control - The input surface, border and focus indicator.
 * @part input-row - The input and its decorative icons.
 * @part input - The native editable input.
 * @part label-row - The row of the label on top and its hint.
 * @part label - The visible label and its floating background.
 * @part label-text - The visible label text.
 * @part label-hint - The short text at the end of the label row, such as a count.
 * @part hint - The help or feedback container.
 * @part hint-text - The help or feedback text.
 * @part leading-icon - The decorative leading icon container.
 * @part trailing-icon - The decorative trailing icon container.
 */
@Component({
  tag: 'ui-text-field',
  styleUrls: ['../internal/field.css', 'text-field.css'],
  shadow: { delegatesFocus: true },
  formAssociated: true,
})
export class UiTextField implements TextFieldProps, FormAssociated {
  @Element() host!: HTMLUiTextFieldElement;

  @AttachInternals() internals!: ElementInternals;

  /** The surface and border treatment. */
  @Prop() variant: TextFieldVariant = 'outline';

  /** The size, which follows the density. */
  @Prop() size: TextFieldSize = 'medium';

  /** The position of the visible label. */
  @Prop() labelPlacement: TextFieldLabelPlacement = 'top';

  /** Hides the visible label, which still names the control. */
  @Prop() hideLabel = false;

  /** Visual feedback; `error` also sets `aria-invalid` without changing native validity. */
  @Prop() state: TextFieldState = 'default';

  /** A persistent visible name. Include any required marker in this text. */
  @Prop() label?: string;

  /** An example or short prompt, never a replacement for the label. */
  @Prop() placeholder?: string;

  /** Help or validation feedback, connected to the description of the input. */
  @Prop() hint?: string;

  /** Short text at the end of the label row, such as a count of characters, in the description. */
  @Prop() labelHint?: string;

  /** Prevents interaction and submission. */
  @Prop({ reflect: true }) disabled = false;

  /** Prevents editing but keeps submission. */
  @Prop({ attribute: 'readonly', reflect: true }) readOnly = false;

  /** Requires a nonempty value for native validation. */
  @Prop() required = false;

  /** The name of the form entry. */
  @Prop({ reflect: true }) name?: string;

  /** The native input type. */
  @Prop() type: TextFieldType = 'text';

  /** The minimum length a user enters, in UTF-16 code units. */
  @Prop() minLength?: number;

  /** The maximum length a user enters, in UTF-16 code units. */
  @Prop() maxLength?: number;

  /** A native regular expression for the whole value. */
  @Prop() pattern?: string;

  /** The purpose of the browser's autofill. */
  @Prop() autoComplete?: string;

  /** One user edit, with the new value and the original input event. */
  @Event({ eventName: 'ui-value-change' }) valueChange!: EventEmitter<TextFieldValueChange>;

  /** The current string of the field. */
  @State() private current = '';

  /** Whether the browser disables the form-associated host, by its attribute or its fieldset. */
  @State() private formDisabled = false;

  /** Attributes that the page writes on the host and the input receives. */
  @State() private hostAttributes: Readonly<Record<string, string | null>> = {};

  @State() private hasLeadingIcon = false;

  @State() private hasTrailingIcon = false;

  private stopFollowing: (() => void)[] = [];

  private readonly control = new TextControl({
    host: () => this.host,
    internals: () => this.internals,
    control: () => this.input(),
    detached: () => this.detachedInput(),
    name: () => this.name,
    disabled: () => this.isDisabled(),
    onValue: (value) => {
      this.current = value;
    },
    restorable: true,
    implicitSubmission: true,
  });

  /** The current string. The `value` attribute supplies the initial and reset value. */
  get value(): string {
    return this.control.value;
  }

  set value(value: string) {
    this.control.set(value);
  }

  /** The associated form, including an explicit `form` attribute. */
  get form(): HTMLFormElement | null {
    return this.internals.form;
  }

  /** Native validity, synchronized from the inner input. */
  get validity(): ValidityState {
    this.control.syncValidity();
    return this.internals.validity;
  }

  /** The native or custom validation message. */
  get validationMessage(): string {
    this.control.syncValidity();
    return this.internals.validationMessage;
  }

  /** Whether the host takes part in native constraint validation. */
  get willValidate(): boolean {
    return this.internals.willValidate;
  }

  /** Checks the form-associated host and dispatches `invalid` when needed. */
  // eslint-disable-next-line stencil/own-methods-must-be-private -- the synchronous API of a native control
  checkValidity(): boolean {
    this.control.syncValidity();
    return this.internals.checkValidity();
  }

  /** Reports invalidity, with the native input as the anchor of the message. */
  // eslint-disable-next-line stencil/own-methods-must-be-private -- the synchronous API of a native control
  reportValidity(): boolean {
    this.control.syncValidity();
    return this.internals.reportValidity();
  }

  /** Sets a custom constraint; an empty string clears it. */
  // eslint-disable-next-line stencil/own-methods-must-be-private -- the synchronous API of a native control
  setCustomValidity(message: string): void {
    this.control.setCustomValidity(message);
  }

  connectedCallback(): void {
    this.stopFollowing = FORWARDED_ATTRIBUTES.map((name) =>
      followAttribute(this.host, name, (value) => {
        this.hostAttributes = { ...this.hostAttributes, [name]: value };
      }),
    );
    this.control.connect();
  }

  disconnectedCallback(): void {
    for (const stop of this.stopFollowing) {
      stop();
    }
    this.stopFollowing = [];
    this.control.disconnect();
  }

  /** Tracks keyboard submission when the owning form changes. */
  formAssociatedCallback(form: HTMLFormElement | null): void {
    this.control.formAssociated(form);
  }

  /**
   * Takes the disabled state the browser computes: the host's own `disabled` attribute or a
   * disabled fieldset. The browser calls it only when that state changes, so it is kept as given.
   */
  formDisabledCallback(disabled: boolean): void {
    this.formDisabled = disabled;
  }

  /** Restores the value of the attribute without emitting an edit event. */
  formResetCallback(): void {
    this.control.reset();
  }

  /** Restores a string the browser saved, without emitting an edit event. */
  formStateRestoreCallback(state: string | File | FormData | null): void {
    this.control.restoreState(state);
  }

  componentWillRender(): void {
    if (this.isDisabled()) {
      this.internals.states.add('disabled');
    } else {
      this.internals.states.delete('disabled');
    }
  }

  componentDidRender(): void {
    this.control.rendered();
  }

  render(): VNode {
    const appearance = fieldAppearance(this);
    return (
      <Field
        classes={appearance.classes}
        placement={appearance.placement}
        label={this.label}
        hideLabel={this.hideLabel}
        hint={this.hint}
        labelHint={this.labelHint}
        onSubmit={this.control.onInnerSubmit}
      >
        <div part="input-row" class="input-row">
          <span
            part="leading-icon"
            class="leading-icon"
            aria-hidden="true"
            hidden={!this.hasLeadingIcon}
          >
            <slot name="leading-icon" onSlotchange={this.onLeadingSlotChange} />
          </span>
          <input
            id="input"
            part="input"
            class="input"
            type={oneOf(this.type, options.type.options, options.type.default)}
            value={this.current}
            placeholder={fieldPlaceholder(this.placeholder)}
            disabled={this.isDisabled()}
            readOnly={this.readOnly}
            required={this.required}
            minLength={this.minLength}
            maxLength={this.maxLength}
            pattern={this.pattern}
            autoComplete={this.autoComplete}
            {...forwardedAttributes(this.hostAttributes)}
            aria-invalid={appearance.error ? 'true' : undefined}
            aria-describedby={fieldDescription(this.hint, this.labelHint)}
            onInput={this.onInput}
            onChange={this.onChange}
          />
          <span
            part="trailing-icon"
            class="trailing-icon"
            aria-hidden="true"
            hidden={!this.hasTrailingIcon}
          >
            <slot name="trailing-icon" onSlotchange={this.onTrailingSlotChange} />
          </span>
        </div>
      </Field>
    );
  }

  private input(): HTMLInputElement | null {
    return this.host.shadowRoot?.querySelector('input') ?? null;
  }

  /** Disabled directly or by the owning fieldset. */
  private isDisabled(): boolean {
    return this.disabled || this.formDisabled;
  }

  /** An input with the constraints of the field, for checks before the first render. */
  private detachedInput(): HTMLInputElement {
    const input = document.createElement('input');
    input.type = oneOf(this.type, options.type.options, options.type.default);
    input.required = this.required;
    input.readOnly = this.readOnly;
    input.disabled = this.isDisabled();
    if (this.pattern !== undefined) {
      input.pattern = this.pattern;
    }
    input.value = this.control.value;
    return input;
  }

  private readonly onInput = (event: globalThis.Event): void => {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }
    this.control.edit(input.value);
    this.valueChange.emit({ value: input.value, originalEvent: event });
  };

  /** The native change event stays in the shadow root, so the host dispatches its own. */
  private readonly onChange = (): void => {
    this.host.dispatchEvent(new globalThis.Event('change', { bubbles: true, composed: true }));
  };

  private readonly onLeadingSlotChange = (event: globalThis.Event): void => {
    this.hasLeadingIcon = hasAssignedContent(event);
  };

  private readonly onTrailingSlotChange = (event: globalThis.Event): void => {
    this.hasTrailingIcon = hasAssignedContent(event);
  };
}

/**
 * Every prop of the specification is a prop of the component. `implements` alone accepts a class
 * that leaves out an optional prop, so a prop added to the specification would go unnoticed.
 */
type _DeclaresEveryProp = Pick<UiTextField, keyof TextFieldProps>;
