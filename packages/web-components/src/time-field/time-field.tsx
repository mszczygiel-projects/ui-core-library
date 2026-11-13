import {
  getUiCoreConfig,
  type UiCoreConfig,
} from '@mszczygiel-projects/ui-core-foundations/config';
import { iconClock } from '@mszczygiel-projects/ui-core-icons';
import type {
  TextFieldLabelPlacement,
  TextFieldSize,
  TextFieldState,
  TextFieldVariant,
} from '@mszczygiel-projects/ui-core-shared/text-field';
import { isIsoTime } from '@mszczygiel-projects/ui-core-shared/time';
import type {
  TimeFieldProps,
  TimeFieldValueChangeDetail,
} from '@mszczygiel-projects/ui-core-shared/time-field';
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
  FORWARDED_ATTRIBUTES,
  forwardedAttributes,
} from '../internal/field.tsx';
import { followAttribute } from '../internal/follow-attribute.ts';
import type { FormAssociated } from '../internal/form-associated.ts';
import { TextControl } from '../internal/text-control.ts';

// HTMLElement is repeated because the first build runs before Stencil declares the element.
declare global {
  interface HTMLUiTimeFieldElement extends HTMLElement, FormAssociated {
    /** The current value. The `value` attribute supplies the initial and reset value. */
    value: string;
    /** Sets a custom validation message. */
    setCustomValidity(message: string): void;
  }
}

/**
 * A time input with a native time picker and a 24-hour value with minute precision.
 *
 * @part base - The field, label and hint.
 * @part control - The surface, border and focus indicator.
 * @part input-row - The row holding the native control.
 * @part input - The native time input.
 * @part label - The visible label.
 * @part label-row - The row holding the label and its hint.
 * @part label-text - The text of the visible label.
 * @part label-hint - The short note at the end of the label row.
 * @part hint - The help or feedback container.
 * @part hint-text - The help or feedback text.
 */
@Component({
  tag: 'ui-time-field',
  styleUrls: ['../internal/field.css', 'time-field.css'],
  shadow: { delegatesFocus: true },
  formAssociated: true,
})
export class UiTimeField implements TimeFieldProps, FormAssociated {
  @Element() host!: HTMLUiTimeFieldElement;

  @AttachInternals() internals!: ElementInternals;

  /** The surface and border treatment. */
  @Prop() variant: TextFieldVariant = 'outline';

  /** The size of the field. */
  @Prop() size: TextFieldSize = 'medium';

  /** The position of the label. */
  @Prop() labelPlacement: TextFieldLabelPlacement = 'top';

  /** Hides the visible label while keeping its accessible name. */
  @Prop() hideLabel = false;

  /** Visual feedback independent of native validity. */
  @Prop() state: TextFieldState = 'default';

  /** The accessible name of the control. */
  @Prop() label?: string;

  /** Help or feedback connected to the input. */
  @Prop() hint?: string;

  /** A note at the end of the label row. */
  @Prop() labelHint?: string;

  /** Prevents editing while keeping the form value. */
  @Prop({ attribute: 'readonly', reflect: true }) readOnly = false;

  /** Requires a value. */
  @Prop() required = false;

  /** The earliest permitted time. */
  @Prop() min?: string;

  /** The latest permitted time. */
  @Prop() max?: string;

  /** The purpose of browser autofill. */
  @Prop() autoComplete?: string;

  /** A user edit and the event that caused it. */
  @Event({ eventName: 'ui-value-change' }) valueChange!: EventEmitter<
    TimeFieldValueChangeDetail<globalThis.Event>
  >;

  /** The name of the form entry. */
  @Prop({ reflect: true }) name?: string;

  /** Prevents interaction and submission. */
  @Prop({ reflect: true }) disabled = false;

  /** The current value of the control. */
  @State() private current = '';

  @State() private config: UiCoreConfig = getUiCoreConfig();

  /** Whether the browser disables the form-associated host, by its attribute or its fieldset. */
  @State() private formDisabled = false;

  private stopFollowing: (() => void)[] = [];

  @State() private hostAttributes: Readonly<Record<string, string | null>> = {};

  private readonly textControl: TextControl = new TextControl({
    host: () => this.host,
    internals: () => this.internals,
    control: () => this.control(),
    detached: () => this.detachedInput(),
    name: () => this.name,
    disabled: () => this.disabled || this.formDisabled,
    onValue: (value) => {
      this.current = value;
    },
    restorable: true,
    implicitSubmission: true,
    defaultText: (value) => (isIsoTime(value) ? value : ''),
    validationMessage: () =>
      this.textControl.value !== '' &&
      this.min !== undefined &&
      this.max !== undefined &&
      isIsoTime(this.min) &&
      isIsoTime(this.max) &&
      this.min > this.max
        ? this.config.labels.timeField.inconsistentLimits
        : '',
  });

  /** The current value. The `value` attribute supplies the initial and reset value. */
  get value(): string {
    return this.textControl.value;
  }

  set value(value: string) {
    this.textControl.set(isIsoTime(value) ? value : '');
  }

  /** The associated form, including an explicit `form` attribute. */
  get form(): HTMLFormElement | null {
    return this.internals.form;
  }

  /** Native validity, from the native control. */
  get validity(): ValidityState {
    this.textControl.syncValidity();
    return this.internals.validity;
  }

  /** The native validation message. */
  get validationMessage(): string {
    this.textControl.syncValidity();
    return this.internals.validationMessage;
  }

  /** Whether the host takes part in native constraint validation. */
  get willValidate(): boolean {
    return this.internals.willValidate;
  }

  /** Checks the form-associated host and dispatches `invalid` when needed. */
  // eslint-disable-next-line stencil/own-methods-must-be-private -- the synchronous API of a native control
  checkValidity(): boolean {
    this.textControl.syncValidity();
    return this.internals.checkValidity();
  }

  /** Reports invalidity, with the native control as the anchor of the message. */
  // eslint-disable-next-line stencil/own-methods-must-be-private -- the synchronous API of a native control
  reportValidity(): boolean {
    this.textControl.syncValidity();
    return this.internals.reportValidity();
  }

  /** Sets a custom constraint; an empty string clears it. */
  // eslint-disable-next-line stencil/own-methods-must-be-private -- the synchronous API of a native control
  setCustomValidity(message: string): void {
    this.textControl.setCustomValidity(message);
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
    this.textControl.connect();
  }

  disconnectedCallback(): void {
    for (const stop of this.stopFollowing) {
      stop();
    }
    this.stopFollowing = [];
    this.textControl.disconnect();
  }

  /** Tracks implicit submission when the form owner changes. */
  formAssociatedCallback(form: HTMLFormElement | null): void {
    this.textControl.formAssociated(form);
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
    this.textControl.reset();
  }

  /** Restores a value the browser saved, without emitting an edit event. */
  formStateRestoreCallback(state: string | File | FormData | null): void {
    this.textControl.restoreState(state);
  }

  componentDidRender(): void {
    this.textControl.rendered();
  }

  render(): VNode {
    const appearance = fieldAppearance({
      variant: this.variant,
      size: this.size,
      labelPlacement: this.labelPlacement,
      hideLabel: this.hideLabel,
      state: this.state,
    });
    return (
      <Field
        classes={appearance.classes}
        placement={appearance.placement}
        label={this.label}
        hideLabel={this.hideLabel}
        hint={this.hint}
        labelHint={this.labelHint}
        onSubmit={this.textControl.onInnerSubmit}
      >
        <div part="input-row" class="input-row">
          <input
            id="input"
            part="input"
            class="input"
            type="time"
            step={60}
            min={this.min}
            max={this.max}
            value={this.current}
            disabled={this.disabled || this.formDisabled}
            readOnly={this.readOnly}
            required={this.required}
            autoComplete={this.autoComplete}
            {...forwardedAttributes(this.hostAttributes)}
            aria-invalid={appearance.error ? 'true' : undefined}
            aria-describedby={fieldDescription(this.hint, this.labelHint)}
            onInput={this.onInput}
          />
          <span class="picker-icon" aria-hidden="true" innerHTML={iconClock} />
        </div>
      </Field>
    );
  }

  private control(): HTMLInputElement | null {
    return this.host.shadowRoot?.querySelector('input') ?? null;
  }

  private detachedInput(): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'time';
    input.step = '60';
    input.min = this.min ?? '';
    input.max = this.max ?? '';
    input.required = this.required;
    input.readOnly = this.readOnly;
    input.disabled = this.disabled || this.formDisabled;
    input.value = this.current;
    return input;
  }

  private readonly onInput = (event: globalThis.Event): void => {
    const control = event.currentTarget;
    if (control instanceof HTMLInputElement) {
      this.textControl.edit(control.value);
      this.valueChange.emit({ value: this.current, originalEvent: event });
    }
  };
}

/**
 * Every prop of the specification is a prop of the component. `implements` alone accepts a class
 * that leaves out an optional prop, so a prop added to the specification would go unnoticed.
 */
type _DeclaresEveryProp = Pick<UiTimeField, keyof TimeFieldProps>;
