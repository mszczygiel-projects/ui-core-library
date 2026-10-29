import {
  getUiCoreConfig,
  type UiCoreConfig,
} from '@mszczygiel-projects/ui-core-foundations/config';
import { iconMinus, iconPlus } from '@mszczygiel-projects/ui-core-icons';
import { resolveLocale } from '@mszczygiel-projects/ui-core-shared/locale';
import type {
  NumberFieldControls,
  NumberFieldProps,
} from '@mszczygiel-projects/ui-core-shared/number-field';
import {
  formatNumberText,
  nextNumberValue,
  type NumberValidationContext,
  parseNumberText,
  serializeNumber,
  validateNumber,
} from '@mszczygiel-projects/ui-core-shared/numeric';
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
import type { NumberFieldValueChange } from './events.ts';

// HTMLElement is repeated because the first build runs before Stencil declares the element.
declare global {
  interface HTMLUiNumberFieldElement extends HTMLElement, FormAssociated {
    /** The canonical value. The value attribute supplies the initial and reset value. */
    value: number | null;
    /** Sets a custom constraint; an empty string clears it. */
    setCustomValidity(message: string): void;
  }
}

/**
 * A locale-aware number input with validation and optional decrement and increment buttons.
 *
 * The native input owns accessibility and editable text. ElementInternals submits the canonical
 * value and saves the draft with its locale. Parsing and constraint errors use customError.
 *
 * @part base - The field, label and hint.
 * @part control - The input surface, border and focus indicator.
 * @part input-row - The input and decrement and increment buttons.
 * @part input - The native editable input.
 * @part label - The visible label and its floating background.
 * @part label-text - The visible label text.
 * @part hint - The help or feedback container.
 * @part hint-text - The help or feedback text.
 * @part decrement - The decrement button.
 * @part decrement-icon - The decrement icon.
 * @part increment - The increment button.
 * @part increment-icon - The increment icon.
 */
@Component({
  tag: 'ui-number-field',
  styleUrls: ['../internal/field.css', 'number-field.css'],
  shadow: { delegatesFocus: true },
  formAssociated: true,
})
export class UiNumberField implements NumberFieldProps, FormAssociated {
  @Element() host!: HTMLUiNumberFieldElement;

  @AttachInternals() internals!: ElementInternals;

  /** The surface and border treatment. */
  @Prop() variant: TextFieldVariant = 'outline';

  /** The size, which follows the density. */
  @Prop() size: TextFieldSize = 'medium';

  /** The position of the visible label. */
  @Prop() labelPlacement: TextFieldLabelPlacement = 'top';

  /** Visual feedback, independent of form validity. */
  @Prop() state: TextFieldState = 'default';

  /** A persistent visible name. Include any required marker in this text. */
  @Prop() label?: string;

  /** An example or short prompt, never a replacement for the label. */
  @Prop() placeholder?: string;

  /** Help or feedback connected to the input. */
  @Prop() hint?: string;

  /** Prevents interaction and submission. */
  @Prop({ reflect: true }) disabled = false;

  /** Prevents editing but keeps submission. */
  @Prop({ attribute: 'readonly', reflect: true }) readOnly = false;

  /** Requires a nonempty value. */
  @Prop() required = false;

  /** The name of the canonical form entry. */
  @Prop({ reflect: true }) name?: string;

  /** The purpose of the browser's autofill. */
  @Prop() autoComplete?: string;

  /** BCP 47 locale, before configuration and browser language. */
  @Prop() locale?: string;

  /** Inclusive lower numeric bound. */
  @Prop() min?: number;

  /** Inclusive upper numeric bound. */
  @Prop() max?: number;

  /** Positive finite step, counted from min or zero. */
  @Prop() step = 1;

  /** Maximum decimal places, from 0 through 20; never rounds. */
  @Prop() precision?: number;

  /** Whether decrement and increment buttons accompany the input. */
  @Prop() controls: NumberFieldControls = 'none';

  /** The name of the decrement button. */
  @Prop() decrementLabel?: string;

  /** The name of the increment button. */
  @Prop() incrementLabel?: string;

  /** A complete translated validation message; property only. */
  @Prop({ attribute: null }) getValidationMessageLabel?: (
    context: NumberValidationContext,
  ) => string;

  /** One user edit, including partial text, with its canonical value and validation result. */
  @Event({ eventName: 'ui-value-change' }) valueChange!: EventEmitter<NumberFieldValueChange>;

  @State() private current = '';

  @State() private touched = false;

  @State() private formDisabled = false;

  @State() private hostAttributes: Readonly<Record<string, string | null>> = {};

  @State() private config: UiCoreConfig = getUiCoreConfig();

  private displayLocale = 'en-US';

  @State() private editing = false;

  private stopFollowing: (() => void)[] = [];

  private readonly control = new TextControl({
    host: () => this.host,
    internals: () => this.internals,
    control: () => this.input(),
    detached: () => this.detachedInput(),
    name: () => this.name,
    disabled: () => this.isDisabled(),
    onValue: (text) => {
      this.current = text;
    },
    restorable: true,
    implicitSubmission: true,
    defaultText: (value) =>
      formatNumberText(value === '' ? null : Number(value), this.displayLocale),
    serialize: (text) => serializeNumber(parseNumberText(text, this.displayLocale).value),
    validationMessage: () => this.parserMessage(),
    saveState: (text) => JSON.stringify({ text, locale: this.displayLocale }),
    restoreText: (state) => {
      try {
        const saved: unknown = JSON.parse(state);
        if (
          typeof saved === 'object' &&
          saved !== null &&
          'text' in saved &&
          typeof saved.text === 'string' &&
          'locale' in saved &&
          typeof saved.locale === 'string'
        ) {
          this.displayLocale = resolveLocale(saved.locale);
          return saved.text;
        }
      } catch {
        // Browsers may restore a plain string from an earlier state.
      }
      return state;
    },
  });

  /** Canonical value; the value attribute supplies the initial and reset value. */
  get value(): number | null {
    return parseNumberText(this.control.value, this.displayLocale).value;
  }

  set value(value: number | null) {
    if (!this.editing) {
      this.displayLocale = resolveLocale(this.locale, this.config.locale, navigator.language);
    }
    this.control.set(formatNumberText(value, this.displayLocale));
  }

  /** The associated form, including an explicit form attribute. */
  get form(): HTMLFormElement | null {
    return this.internals.form;
  }

  /** Native validity, synchronized from the visible input. */
  get validity(): ValidityState {
    this.control.syncValidity();
    return this.internals.validity;
  }

  /** Native or custom validation message. */
  get validationMessage(): string {
    this.control.syncValidity();
    return this.internals.validationMessage;
  }

  /** Whether the host participates in constraint validation. */
  get willValidate(): boolean {
    return this.internals.willValidate;
  }

  /** Checks validity and dispatches invalid when needed. */
  // eslint-disable-next-line stencil/own-methods-must-be-private -- the synchronous API of a native control
  checkValidity(): boolean {
    this.control.syncValidity();
    return this.internals.checkValidity();
  }

  /** Reports invalidity with the visible input as anchor. */
  // eslint-disable-next-line stencil/own-methods-must-be-private -- the synchronous API of a native control
  reportValidity(): boolean {
    this.control.syncValidity();
    return this.internals.reportValidity();
  }

  /** Sets a consumer constraint; an empty string clears it. */
  // eslint-disable-next-line stencil/own-methods-must-be-private -- the synchronous API of a native control
  setCustomValidity(message: string): void {
    this.control.setCustomValidity(message);
  }

  connectedCallback(): void {
    const parsed = parseNumberText(this.control.value, this.displayLocale);
    const nextLocale = resolveLocale(this.locale, this.config.locale, navigator.language);
    if (parsed.inputState === 'empty' || parsed.inputState === 'valid') {
      this.displayLocale = nextLocale;
      this.control.reformat(formatNumberText(parsed.value, nextLocale));
    }
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
    this.host.addEventListener('invalid', this.onInvalid);
    this.control.connect();
  }

  disconnectedCallback(): void {
    for (const stop of this.stopFollowing) {
      stop();
    }
    this.stopFollowing = [];
    this.host.removeEventListener('invalid', this.onInvalid);
    this.control.disconnect();
  }

  /** Tracks keyboard submission when the owning form changes. */
  formAssociatedCallback(form: HTMLFormElement | null): void {
    this.control.formAssociated(form);
  }

  /** Uses the browser's disabled fieldset calculation, including the first legend exception. */
  formDisabledCallback(disabled: boolean): void {
    this.formDisabled = disabled;
  }

  /** Restores the current default attribute without an edit event. */
  formResetCallback(): void {
    this.touched = false;
    this.editing = false;
    this.displayLocale = resolveLocale(this.locale, this.config.locale, navigator.language);
    this.control.reset();
  }

  /** Restores the saved draft and grammar, then validates it again. */
  formStateRestoreCallback(state: string | File | FormData | null): void {
    this.control.restoreState(state);
  }

  componentWillRender(): void {
    const nextLocale = resolveLocale(this.locale, this.config.locale, navigator.language);
    const parsed = parseNumberText(this.control.value, this.displayLocale);
    if (
      !this.editing &&
      nextLocale !== this.displayLocale &&
      (parsed.inputState === 'empty' || parsed.inputState === 'valid')
    ) {
      this.displayLocale = nextLocale;
      this.control.reformat(formatNumberText(parsed.value, nextLocale));
    }
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
    const invalid = this.touched && !this.validity.valid;
    const appearance = fieldAppearance({
      variant: this.variant,
      size: this.size,
      labelPlacement: this.labelPlacement,
      state: invalid ? 'error' : this.state,
    });
    const hint = this.hint;
    return (
      <Field
        classes={appearance.classes}
        placement={appearance.placement}
        label={this.label}
        hint={hint}
        onSubmit={this.control.onInnerSubmit}
      >
        <div part="input-row" class="input-row" onInput={this.onInput}>
          {this.controls === 'inline' && this.action(-1)}
          <input
            id="input"
            part="input"
            class="input"
            type="text"
            value={this.current}
            placeholder={fieldPlaceholder(this.placeholder)}
            disabled={this.isDisabled()}
            readOnly={this.readOnly}
            required={this.required}
            autoComplete={this.autoComplete}
            {...forwardedAttributes(this.hostAttributes)}
            inputMode={this.hostAttributes['inputmode'] ?? 'decimal'}
            aria-invalid={appearance.error ? 'true' : undefined}
            aria-describedby={fieldDescription(hint)}
            role="spinbutton"
            aria-valuenow={this.value ?? undefined}
            aria-valuemin={Number.isFinite(this.min) ? this.min : undefined}
            aria-valuemax={Number.isFinite(this.max) ? this.max : undefined}
            aria-valuetext={this.current || undefined}
            onKeyDown={this.onKeyDown}
            onFocus={() => {
              this.editing = true;
            }}
            onBlur={() => {
              this.editing = false;
              this.touched = true;
            }}
            onChange={this.onChange}
          />
          {this.controls === 'inline' && this.action(1)}
        </div>
      </Field>
    );
  }

  private input(): HTMLInputElement | null {
    return this.host.shadowRoot?.querySelector('input') ?? null;
  }

  private isDisabled(): boolean {
    return this.disabled || this.formDisabled;
  }

  private constraints() {
    return { min: this.min, max: this.max, step: this.step, precision: this.precision };
  }

  private parserMessage(): string {
    const reason = validateNumber(
      parseNumberText(this.control.value, this.displayLocale),
      this.constraints(),
    );
    return reason === null
      ? ''
      : (this.getValidationMessageLabel ?? this.config.labels.numberField.validationMessage)({
          ...this.constraints(),
          reason,
          locale: this.displayLocale,
        });
  }

  private detachedInput(): HTMLInputElement {
    const input = document.createElement('input');
    input.required = this.required;
    input.readOnly = this.readOnly;
    input.disabled = this.isDisabled();
    input.value = this.control.value;
    return input;
  }

  private notify(text: string, originalEvent: globalThis.Event): void {
    this.control.edit(text);
    const parsed = parseNumberText(text, this.displayLocale);
    this.valueChange.emit({
      ...parsed,
      text,
      originalEvent,
      validationError: validateNumber(parsed, this.constraints()),
    });
  }

  private action(direction: -1 | 1): VNode {
    const part = direction < 0 ? 'decrement' : 'increment';
    const next = nextNumberValue(this.value, direction, this.constraints());
    return (
      <button
        part={part}
        class={direction < 0 ? 'action action-leading' : 'action'}
        type="button"
        disabled={this.isDisabled() || this.readOnly || next === this.value}
        aria-controls="input"
        aria-label={
          direction < 0
            ? (this.decrementLabel ?? this.config.labels.numberField.decrement)
            : (this.incrementLabel ?? this.config.labels.numberField.increment)
        }
        onClick={(event) => {
          this.changeNumber(next, event);
        }}
      >
        <span
          part={`${part}-icon`}
          class="action-icon"
          aria-hidden="true"
          innerHTML={direction < 0 ? iconMinus : iconPlus}
        />
      </button>
    );
  }

  private changeNumber(next: number | null, event: globalThis.Event): void {
    const input = this.input();
    if (input === null || this.isDisabled() || this.readOnly || next === this.value) {
      return;
    }
    input.value = formatNumberText(next, this.displayLocale);
    input.focus();
    this.notify(input.value, event);
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (
      event.defaultPrevented ||
      event.isComposing ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      this.readOnly ||
      this.isDisabled()
    ) {
      return;
    }
    const next =
      event.key === 'ArrowUp'
        ? nextNumberValue(this.value, 1, this.constraints())
        : event.key === 'ArrowDown'
          ? nextNumberValue(this.value, -1, this.constraints())
          : event.key === 'Home' && Number.isFinite(this.min)
            ? this.min
            : event.key === 'End' && Number.isFinite(this.max)
              ? this.max
              : undefined;
    if (next !== undefined) {
      event.preventDefault();
      this.changeNumber(next, event);
    }
  };

  private readonly onInput = (event: globalThis.Event): void => {
    const input = event.target;
    if (input instanceof HTMLInputElement) {
      this.notify(input.value, event);
    }
  };

  private readonly onInvalid = (): void => {
    this.touched = true;
  };

  /** Native change does not cross a shadow boundary. */
  private readonly onChange = (): void => {
    this.host.dispatchEvent(new globalThis.Event('change', { bubbles: true, composed: true }));
  };
}

/** Checks that optional specification props are present in the implementation too. */
type _DeclaresEveryProp = Pick<UiNumberField, keyof NumberFieldProps>;
