import type { UiCoreConfig } from '@mszczygiel-projects/ui-core-foundations/config';
import { getUiCoreConfig } from '@mszczygiel-projects/ui-core-foundations/config';
import { iconEye, iconEyeSlash } from '@mszczygiel-projects/ui-core-icons';
import type { PasswordFieldProps } from '@mszczygiel-projects/ui-core-shared/password-field';
import type {
  TextFieldLabelPlacement,
  TextFieldSize,
  TextFieldState,
  TextFieldVariant,
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

import { followConfig } from '../internal/config.ts';
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
import { TextControl } from '../internal/text-control.ts';
import type { TextFieldValueChange } from '../text-field/events.ts';
import type { PasswordFieldRevealedChange as RevealedChange } from './events.ts';

// HTMLElement is repeated because the first build runs before Stencil declares the element.
declare global {
  interface HTMLUiPasswordFieldElement extends HTMLElement, FormAssociated {
    /** The current value. The `value` attribute supplies the initial and reset value. */
    value: string;
    /** Sets a custom constraint; an empty string clears it. */
    setCustomValidity(message: string): void;
  }

  interface HTMLElementEventMap {
    'ui-revealed-change': CustomEvent<RevealedChange>;
  }
}

/**
 * A password input with a button that shows or hides the password.
 *
 * Its inner input owns accessibility; ElementInternals associates the host with the outer form.
 * The reveal button is a toggle button with one name, whose pressed state says whether the
 * password shows. The `value` and `revealed` attributes supply the initial and reset state, and
 * the properties hold the current state. Submitting the owning form hides the password again, and
 * the browser never saves it to restore it. The native `inputmode`, `enterkeyhint` and
 * `spellcheck` attributes and an author's `aria-label` reach the input.
 *
 * @part base - The field, label and hint.
 * @part control - The input surface, border and focus indicator.
 * @part input-row - The input and the reveal button.
 * @part input - The native editable input.
 * @part label-row - The row of the label on top and its hint.
 * @part label - The visible label and its floating background.
 * @part label-text - The visible label text.
 * @part label-hint - The short text at the end of the label row, such as a count.
 * @part hint - The help or feedback container.
 * @part hint-text - The help or feedback text.
 * @part reveal - The toggle button that shows or hides the password.
 * @part reveal-icon - The icon of the reveal button, which shows the current state.
 */
@Component({
  tag: 'ui-password-field',
  styleUrls: ['../internal/field.css'],
  shadow: { delegatesFocus: true },
  formAssociated: true,
})
export class UiPasswordField implements PasswordFieldProps, FormAssociated {
  @Element() host!: HTMLUiPasswordFieldElement;

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

  /** Prevents editing but keeps submission; the password can still be shown. */
  @Prop({ attribute: 'readonly', reflect: true }) readOnly = false;

  /** Requires a nonempty value for native validation. */
  @Prop() required = false;

  /** The name of the form entry. */
  @Prop({ reflect: true }) name?: string;

  /** The minimum length a user enters, in UTF-16 code units. */
  @Prop() minLength?: number;

  /** The maximum length a user enters, in UTF-16 code units. */
  @Prop() maxLength?: number;

  /** A native regular expression for the whole value. */
  @Prop() pattern?: string;

  /** The purpose of the browser's autofill, such as `current-password` or `new-password`. */
  @Prop() autoComplete?: string;

  /**
   * Shows the password as plain text. The attribute sets the initial state, which a reset
   * restores; the property holds the current one, which the reveal button changes.
   */
  @Prop({ mutable: true }) revealed = false;

  /** The name of the reveal button, falling back to `labels.passwordField.reveal`. */
  @Prop() revealLabel?: string;

  /** One user edit, with the new value and the original input event. */
  @Event({ eventName: 'ui-value-change' }) valueChange!: EventEmitter<TextFieldValueChange>;

  /** The password was shown or hidden, by the reveal button or a submission of the form. */
  @Event({ eventName: 'ui-revealed-change' }) revealedChange!: EventEmitter<RevealedChange>;

  @State() private current = '';

  @State() private formDisabled = false;

  @State() private hostAttributes: Readonly<Record<string, string | null>> = {};

  @State() private config: UiCoreConfig = getUiCoreConfig();

  private stopFollowing: (() => void)[] = [];

  private formEvents?: AbortController;

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
    // A browser never restores a password from its history, and neither does this field.
    restorable: false,
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
    this.stopFollowing = [
      followConfig((config) => {
        this.config = config;
      }),
      ...FORWARDED_ATTRIBUTES.map((name) =>
        followAttribute(this.host, name, (value) => {
          this.hostAttributes = { ...this.hostAttributes, [name]: value };
        }),
      ),
    ];
    this.control.connect();
    this.observeForm(this.internals.form);
  }

  disconnectedCallback(): void {
    for (const stop of this.stopFollowing) {
      stop();
    }
    this.stopFollowing = [];
    this.control.disconnect();
    this.formEvents?.abort();
  }

  /** Tracks keyboard submission and submissions when the owning form changes. */
  formAssociatedCallback(form: HTMLFormElement | null): void {
    this.control.formAssociated(form);
    this.observeForm(form);
  }

  /**
   * Takes the disabled state the browser computes: the host's own `disabled` attribute or a
   * disabled fieldset. The browser calls it only when that state changes, so it is kept as given.
   */
  formDisabledCallback(disabled: boolean): void {
    this.formDisabled = disabled;
  }

  /** Restores the value and the visibility of the attributes without emitting an event. */
  formResetCallback(): void {
    this.control.reset();
    this.revealed = this.host.hasAttribute('revealed');
  }

  /** A password is never restored, so the browser has no state to give back. */
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
    const disabled = this.isDisabled();
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
          <input
            id="input"
            part="input"
            class="input"
            type={this.revealed ? 'text' : 'password'}
            value={this.current}
            placeholder={fieldPlaceholder(this.placeholder)}
            disabled={disabled}
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
          <button
            part="reveal"
            class="action"
            type="button"
            disabled={disabled}
            aria-pressed={this.revealed ? 'true' : 'false'}
            aria-controls="input"
            aria-label={this.revealLabel ?? this.config.labels.passwordField.reveal}
            onClick={this.onReveal}
          >
            <span
              part="reveal-icon"
              class="action-icon"
              aria-hidden="true"
              innerHTML={this.revealed ? iconEye : iconEyeSlash}
            />
          </button>
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
    input.type = 'password';
    input.required = this.required;
    input.readOnly = this.readOnly;
    input.disabled = this.isDisabled();
    if (this.pattern !== undefined) {
      input.pattern = this.pattern;
    }
    input.value = this.control.value;
    return input;
  }

  private observeForm(form: HTMLFormElement | null): void {
    this.formEvents?.abort();
    if (form === null) {
      return;
    }
    this.formEvents = new AbortController();
    form.addEventListener('submit', this.onFormSubmit, { signal: this.formEvents.signal });
  }

  private reveal(revealed: boolean, originalEvent: globalThis.Event): void {
    this.revealed = revealed;
    this.revealedChange.emit({ value: revealed, originalEvent });
  }

  /** A password manager reads the field as a password when the form submits. */
  private readonly onFormSubmit = (event: globalThis.Event): void => {
    if (this.revealed) {
      this.reveal(false, event);
    }
  };

  private readonly onReveal = (event: MouseEvent): void => {
    this.reveal(!this.revealed, event);
  };

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
}

/**
 * Every prop of the specification is a prop of the component. `implements` alone accepts a class
 * that leaves out an optional prop, so a prop added to the specification would go unnoticed.
 */
type _DeclaresEveryProp = Pick<UiPasswordField, keyof PasswordFieldProps>;
