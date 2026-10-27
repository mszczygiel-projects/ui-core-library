import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import type {
  TextFieldLabelPlacement,
  TextFieldSize,
  TextFieldState,
  TextFieldVariant,
} from '@mszczygiel-projects/ui-core-shared/text-field';
import {
  textareaField,
  type TextareaFieldProps,
  type TextareaFieldResize,
} from '@mszczygiel-projects/ui-core-shared/textarea-field';
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
import { TextControl } from '../internal/text-control.ts';
import type { TextFieldValueChange } from '../text-field/events.ts';

// HTMLElement is repeated because the first build runs before Stencil declares the element.
declare global {
  interface HTMLUiTextareaFieldElement extends HTMLElement, FormAssociated {
    /** The current value. The `value` attribute supplies the initial and reset value. */
    value: string;
    /** Sets a custom constraint; an empty string clears it. */
    setCustomValidity(message: string): void;
  }
}

const { options } = textareaField;

/**
 * A multi-line text input with a label, hint and validation feedback.
 *
 * Its inner textarea owns accessibility; ElementInternals associates the host with the outer form.
 * Enter starts a new line and never submits. With `resize="auto"`, the textarea grows with its
 * content and the width of the page, up to `maxRows` lines, and then scrolls. The `value`
 * attribute supplies the reset value, and the property holds the current value. The native
 * `inputmode`, `enterkeyhint` and `spellcheck` attributes and an author's `aria-label` reach the
 * textarea.
 *
 * @part base - The field, label and hint.
 * @part control - The textarea surface, border and focus indicator.
 * @part input - The native textarea.
 * @part label - The visible label and its floating background.
 * @part label-text - The visible label text.
 * @part hint - The help or feedback container.
 * @part hint-text - The help or feedback text.
 */
@Component({
  tag: 'ui-textarea-field',
  styleUrls: ['../internal/field.css', 'textarea-field.css'],
  shadow: { delegatesFocus: true },
  formAssociated: true,
})
export class UiTextareaField implements TextareaFieldProps, FormAssociated {
  @Element() host!: HTMLUiTextareaFieldElement;

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

  /** The minimum length a user enters, in UTF-16 code units. */
  @Prop() minLength?: number;

  /** The maximum length a user enters, in UTF-16 code units. */
  @Prop() maxLength?: number;

  /** The purpose of the browser's autofill. */
  @Prop() autoComplete?: string;

  /**
   * `vertical` lets the user drag the height, `none` keeps the designed height, and `auto` grows
   * with the content.
   */
  @Prop() resize: TextareaFieldResize = 'vertical';

  /** With `resize="auto"`, the number of lines after which the textarea scrolls instead of growing. */
  @Prop() maxRows?: number;

  /** One user edit, with the new value and the original input event. */
  @Event({ eventName: 'ui-value-change' }) valueChange!: EventEmitter<TextFieldValueChange>;

  @State() private current = '';

  @State() private formDisabled = false;

  @State() private hostAttributes: Readonly<Record<string, string | null>> = {};

  private stopFollowing: (() => void)[] = [];

  /** Measures the content again when the width of the textarea changes. */
  private resizeObserver?: ResizeObserver;

  private measuredInlineSize = 0;

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
    implicitSubmission: false,
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
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
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
    this.fitContent();
  }

  render(): VNode {
    const appearance = fieldAppearance(this);
    const resize = oneOf(this.resize, options.resize.options, options.resize.default);
    const maxRows = resize === 'auto' && this.maxRows !== undefined && this.maxRows > 0;
    return (
      <Field
        classes={`${appearance.classes} resize-${resize}`}
        placement={appearance.placement}
        label={this.label}
        hint={this.hint}
      >
        <textarea
          id="input"
          part="input"
          class="input"
          value={this.current}
          style={maxRows ? { '--_max-rows': String(this.maxRows) } : {}}
          placeholder={fieldPlaceholder(this.placeholder)}
          disabled={this.isDisabled()}
          readOnly={this.readOnly}
          required={this.required}
          minLength={this.minLength}
          maxLength={this.maxLength}
          autoComplete={this.autoComplete}
          {...forwardedAttributes(this.hostAttributes)}
          aria-invalid={appearance.error ? 'true' : undefined}
          aria-describedby={fieldDescription(this.hint)}
          onInput={this.onInput}
          onChange={this.onChange}
          ref={this.observeSize}
        />
      </Field>
    );
  }

  private input(): HTMLTextAreaElement | null {
    return this.host.shadowRoot?.querySelector('textarea') ?? null;
  }

  /** Disabled directly or by the owning fieldset. */
  private isDisabled(): boolean {
    return this.disabled || this.formDisabled;
  }

  /** A textarea with the constraints of the field, for checks before the first render. */
  private detachedInput(): HTMLTextAreaElement {
    const textarea = document.createElement('textarea');
    textarea.required = this.required;
    textarea.readOnly = this.readOnly;
    textarea.disabled = this.isDisabled();
    textarea.value = this.control.value;
    return textarea;
  }

  /**
   * Gives the stylesheet the height of the content with `resize="auto"`. Measuring needs the
   * layout: the height returns to auto, and the scroll height then says what the content needs.
   */
  private fitContent(): void {
    const textarea = this.input();
    if (textarea === null) {
      return;
    }
    if (oneOf(this.resize, options.resize.options, options.resize.default) !== 'auto') {
      textarea.style.removeProperty('--_auto-block-size');
      return;
    }
    textarea.style.setProperty('--_auto-block-size', 'auto');
    textarea.style.setProperty('--_auto-block-size', `${String(textarea.scrollHeight)}px`);
  }

  private readonly observeSize = (textarea: HTMLTextAreaElement | undefined): void => {
    if (textarea === undefined || this.resizeObserver !== undefined) {
      return;
    }
    this.resizeObserver = new ResizeObserver((entries) => {
      const inlineSize = entries[0]?.contentBoxSize[0]?.inlineSize ?? 0;
      // Only a new width wraps the text differently; a new height is the result of measuring.
      if (inlineSize !== this.measuredInlineSize) {
        this.measuredInlineSize = inlineSize;
        this.fitContent();
      }
    });
    this.resizeObserver.observe(textarea);
  };

  private readonly onInput = (event: globalThis.Event): void => {
    const textarea = event.currentTarget;
    if (!(textarea instanceof HTMLTextAreaElement)) {
      return;
    }
    this.control.edit(textarea.value);
    this.fitContent();
    this.valueChange.emit({ value: textarea.value, originalEvent: event });
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
type _DeclaresEveryProp = Pick<UiTextareaField, keyof TextareaFieldProps>;
