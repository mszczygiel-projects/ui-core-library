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

import { followAttribute } from '../internal/follow-attribute.ts';
import type { FormAssociated } from '../internal/form-associated.ts';
import { hasAssignedContent } from '../internal/slots.ts';
import type { TextFieldValueChange } from './events.ts';

const { options } = textField;

/** The input types that a native form counts when it decides on implicit submission. */
const IMPLICIT_SUBMISSION_TYPES = [
  'text',
  'search',
  'url',
  'tel',
  'email',
  'password',
  'date',
  'month',
  'week',
  'time',
  'datetime-local',
  'number',
];

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
 * @part label - The visible label and its floating background.
 * @part label-text - The visible label text.
 * @part hint - The help or feedback container.
 * @part hint-text - The help or feedback text.
 * @part leading-icon - The decorative leading icon container.
 * @part trailing-icon - The decorative trailing icon container.
 */
@Component({
  tag: 'ui-text-field',
  styleUrl: 'text-field.css',
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

  /** Visual feedback; `error` also sets `aria-invalid` without changing native validity. */
  @Prop() state: TextFieldState = 'default';

  /** A persistent visible name. Include any required marker in this text. */
  @Prop() label?: string;

  /** An example or short prompt, never a replacement for the label. */
  @Prop() placeholder?: string;

  /** Help or validation feedback, connected to the description of the input. */
  @Prop() hint?: string;

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

  /** Whether a user or a script set the value, after which the attribute only supplies a reset. */
  private dirty = false;

  private customValidity = '';

  private stopFollowing: (() => void)[] = [];

  private formKeyEvents?: AbortController;

  /** The current string. The `value` attribute supplies the initial and reset value. */
  get value(): string {
    return this.current;
  }

  set value(value: string) {
    // A form reads the new value and validity at once, as it does for a native input, so they
    // change now rather than at the next render.
    this.restore(typeof value === 'string' ? value : '');
    // As on a native input, a value that a script sets outlives later defaults.
    this.dirty = true;
  }

  /** The associated form, including an explicit `form` attribute. */
  get form(): HTMLFormElement | null {
    return this.internals.form;
  }

  /** Native validity, synchronized from the inner input. */
  get validity(): ValidityState {
    this.syncValidity();
    return this.internals.validity;
  }

  /** The native or custom validation message. */
  get validationMessage(): string {
    this.syncValidity();
    return this.internals.validationMessage;
  }

  /** Whether the host takes part in native constraint validation. */
  get willValidate(): boolean {
    return this.internals.willValidate;
  }

  /** Checks the form-associated host and dispatches `invalid` when needed. */
  // eslint-disable-next-line stencil/own-methods-must-be-private -- the synchronous API of a native control
  checkValidity(): boolean {
    this.syncValidity();
    return this.internals.checkValidity();
  }

  /** Reports invalidity, with the native input as the anchor of the message. */
  // eslint-disable-next-line stencil/own-methods-must-be-private -- the synchronous API of a native control
  reportValidity(): boolean {
    this.syncValidity();
    return this.internals.reportValidity();
  }

  /** Sets a custom constraint; an empty string clears it. */
  // eslint-disable-next-line stencil/own-methods-must-be-private -- the synchronous API of a native control
  setCustomValidity(message: string): void {
    this.customValidity = message;
    this.syncValidity();
  }

  connectedCallback(): void {
    this.stopFollowing = [
      followAttribute(this.host, 'value', (value) => {
        // Once the value is dirty, the attribute only supplies what a reset restores.
        if (!this.dirty) {
          this.restore(value ?? '');
        }
      }),
      ...['aria-label', 'inputmode', 'enterkeyhint', 'spellcheck'].map((name) =>
        followAttribute(this.host, name, (value) => {
          this.hostAttributes = { ...this.hostAttributes, [name]: value };
        }),
      ),
    ];
    // A form reads the value and validity as soon as the field joins it, before the first render.
    this.submitValue(this.current);
    this.syncValidity();
    this.observeFormKeys(this.internals.form);
  }

  disconnectedCallback(): void {
    for (const stop of this.stopFollowing) {
      stop();
    }
    this.stopFollowing = [];
    this.formKeyEvents?.abort();
  }

  /** Tracks keyboard submission when the owning form changes. */
  formAssociatedCallback(form: HTMLFormElement | null): void {
    this.observeFormKeys(form);
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
    this.restore(this.host.getAttribute('value') ?? '');
    // After a reset, the attribute leads the value again, as on a native input.
    this.dirty = false;
  }

  /** Restores a string the browser saved, without emitting an edit event. */
  formStateRestoreCallback(state: string | File | FormData | null): void {
    if (typeof state === 'string') {
      this.restore(state);
    }
  }

  componentWillRender(): void {
    if (this.isDisabled()) {
      this.internals.states.add('disabled');
    } else {
      this.internals.states.delete('disabled');
    }
  }

  componentDidRender(): void {
    const input = this.input();
    if (input !== null && input.value !== this.current) {
      // The input sanitizes some types, such as email; the property reports what it holds.
      this.current = input.value;
    }
    this.submitValue(input?.value ?? this.current);
    this.syncValidity();
  }

  render(): VNode {
    const placement = oneOf(
      this.labelPlacement,
      options.labelPlacement.options,
      options.labelPlacement.default,
    );
    const variant = oneOf(this.variant, options.variant.options, options.variant.default);
    const size = oneOf(this.size, options.size.options, options.size.default);
    const state = oneOf(this.state, options.state.options, options.state.default);
    const spellcheck = this.hostAttributes['spellcheck'];
    const label =
      this.label !== undefined && this.label !== '' ? (
        <label part="label" class="label" htmlFor="input">
          <span part="label-text">{this.label}</span>
        </label>
      ) : null;
    return (
      <form
        role="none"
        noValidate
        onSubmit={this.onFormSubmit}
        part="base"
        class={`base ${variant} ${size} ${placement} ${state}`}
      >
        {placement === 'top' ? label : null}
        <div part="control" class="control">
          {placement === 'top' ? null : label}
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
              placeholder={
                this.placeholder === undefined || this.placeholder === '' ? ' ' : this.placeholder
              }
              disabled={this.isDisabled()}
              readOnly={this.readOnly}
              required={this.required}
              minLength={this.minLength}
              maxLength={this.maxLength}
              pattern={this.pattern}
              autoComplete={this.autoComplete}
              inputMode={this.hostAttributes['inputmode'] ?? undefined}
              enterKeyHint={this.hostAttributes['enterkeyhint'] ?? undefined}
              spellcheck={
                spellcheck === null || spellcheck === undefined ? undefined : spellcheck !== 'false'
              }
              aria-label={this.hostAttributes['aria-label'] ?? undefined}
              aria-invalid={state === 'error' ? 'true' : undefined}
              aria-describedby={this.hint !== undefined && this.hint !== '' ? 'hint' : undefined}
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
        </div>
        {this.hint !== undefined && this.hint !== '' && (
          <span id="hint" part="hint" class="hint">
            <span part="hint-text">{this.hint}</span>
          </span>
        )}
      </form>
    );
  }

  /**
   * Gives the form the entry of the field. A string value takes its name from the `name`
   * attribute, which Stencil writes only when it renders, so the entry carries the name itself.
   */
  private submitValue(value: string): void {
    if (this.name === undefined || this.name === '') {
      this.internals.setFormValue(null);
      return;
    }
    const entry = new FormData();
    entry.append(this.name, value);
    this.internals.setFormValue(entry, value);
  }

  private input(): HTMLInputElement | null {
    return this.host.shadowRoot?.querySelector('input') ?? null;
  }

  /** Disabled directly or by the owning fieldset. */
  private isDisabled(): boolean {
    return this.disabled || this.formDisabled;
  }

  private restore(value: string): void {
    const input = this.input();
    if (input !== null) {
      input.value = value;
    }
    // The input sanitizes some types, such as email, as soon as it receives the string.
    this.current = input?.value ?? value;
    this.submitValue(this.current);
    this.syncValidity();
  }

  /**
   * Copies the validity of the input to the host. Before the first render, which Stencil runs
   * later, a detached input with the same constraints answers, so that a form checks the field
   * as soon as it joins; the browser writes its message in the user's language either way.
   */
  private syncValidity(): void {
    const rendered = this.input();
    const input = rendered ?? this.detachedInput();
    input.setCustomValidity(this.customValidity);
    const validity = input.validity;
    this.internals.setValidity(
      input.willValidate
        ? {
            badInput: validity.badInput,
            customError: validity.customError,
            patternMismatch: validity.patternMismatch,
            rangeOverflow: validity.rangeOverflow,
            rangeUnderflow: validity.rangeUnderflow,
            stepMismatch: validity.stepMismatch,
            tooLong: validity.tooLong,
            tooShort: validity.tooShort,
            typeMismatch: validity.typeMismatch,
            valueMissing: validity.valueMissing,
          }
        : {},
      input.validationMessage,
      rendered ?? undefined,
    );
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
    input.value = this.current;
    return input;
  }

  private observeFormKeys(form: HTMLFormElement | null): void {
    this.formKeyEvents?.abort();
    if (form === null || !this.host.isConnected) {
      return;
    }
    this.formKeyEvents = new AbortController();
    // External inputs with a form attribute do not bubble through the form itself.
    form.getRootNode().addEventListener('keydown', this.onAssociatedKeyDown, {
      signal: this.formKeyEvents.signal,
    });
  }

  private readonly onAssociatedKeyDown = (event: globalThis.Event): void => {
    if (
      !(event instanceof KeyboardEvent) ||
      event.key !== 'Enter' ||
      event.isComposing ||
      event.defaultPrevented
    ) {
      return;
    }
    const input = event.composedPath()[0];
    const form = this.internals.form;
    if (
      !(input instanceof HTMLInputElement) ||
      form === null ||
      input.form !== form ||
      !this.blocksImplicitSubmission(input)
    ) {
      return;
    }
    // Native implicit submission does not count form-associated custom elements.
    if (this.defaultSubmitter(form) === undefined && this.blockingFields(form).length > 1) {
      event.preventDefault();
    }
  };

  private readonly onInput = (event: globalThis.Event): void => {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }
    this.current = input.value;
    this.dirty = true;
    this.submitValue(this.current);
    this.syncValidity();
    this.valueChange.emit({ value: this.current, originalEvent: event });
  };

  /** The native change event stays in the shadow root, so the host dispatches its own. */
  private readonly onChange = (): void => {
    this.host.dispatchEvent(new globalThis.Event('change', { bubbles: true, composed: true }));
  };

  /**
   * The inner form receives Enter as a native default action, after keyboard cancellation and
   * input methods. Its submit event bridges to the associated outer form.
   */
  private readonly onFormSubmit = (event: globalThis.Event): void => {
    event.preventDefault();
    event.stopPropagation();
    const form = this.internals.form;
    if (form === null || !this.host.isConnected || this.isDisabled()) {
      return;
    }
    const submitter = this.defaultSubmitter(form);
    if (submitter !== undefined) {
      if (!submitter.matches(':disabled')) {
        submitter.click();
      }
      return;
    }
    if (this.blockingFields(form).length === 1) {
      form.requestSubmit();
    }
  };

  private readonly onLeadingSlotChange = (event: globalThis.Event): void => {
    this.hasLeadingIcon = hasAssignedContent(event);
  };

  private readonly onTrailingSlotChange = (event: globalThis.Event): void => {
    this.hasTrailingIcon = hasAssignedContent(event);
  };

  private defaultSubmitter(
    form: HTMLFormElement,
  ): HTMLButtonElement | HTMLInputElement | undefined {
    const root = form.getRootNode();
    if (!(root instanceof Document || root instanceof ShadowRoot)) {
      return undefined;
    }
    return Array.from(root.querySelectorAll('button, input')).find(
      (node): node is HTMLButtonElement | HTMLInputElement =>
        (node instanceof HTMLButtonElement || node instanceof HTMLInputElement) &&
        node.form === form &&
        (node.type === 'submit' || node.type === 'image'),
    );
  }

  private blocksImplicitSubmission(node: globalThis.Element): boolean {
    return (
      node.localName === 'ui-text-field' ||
      (node instanceof HTMLInputElement && IMPLICIT_SUBMISSION_TYPES.includes(node.type))
    );
  }

  private blockingFields(form: HTMLFormElement): globalThis.Element[] {
    return Array.from(form.elements).filter((node) => this.blocksImplicitSubmission(node));
  }
}

/**
 * Every prop of the specification is a prop of the component. `implements` alone accepts a class
 * that leaves out an optional prop, so a prop added to the specification would go unnoticed.
 */
type _DeclaresEveryProp = Pick<UiTextField, keyof TextFieldProps>;
