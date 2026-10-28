import type { ChoiceState } from '@mszczygiel-projects/ui-core-shared/checkbox-field';
import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import {
  radioGroup,
  type RadioGroupOrientation,
  type RadioGroupProps,
} from '@mszczygiel-projects/ui-core-shared/radio-group';
import { nextRadio } from '@mszczygiel-projects/ui-core-shared/radio-navigation';
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

import { choiceDescription, choiceState } from '../internal/choice.tsx';
import { followAttribute } from '../internal/follow-attribute.ts';
import type { FormAssociated } from '../internal/form-associated.ts';
import { copyValidity } from '../internal/form-value.ts';
import { type RadioOption, radioOptionsOf, registerRadioGroup } from '../internal/radio.ts';
import type { RadioGroupValueChange } from './events.ts';

// HTMLElement is repeated because the first build runs before Stencil declares the element.
declare global {
  interface HTMLUiRadioGroupElement extends HTMLElement, FormAssociated {
    /** Sets a custom constraint; an empty string clears it. */
    setCustomValidity(message: string): void;
  }
}

const { orientation: orientationOption } = radioGroup.options;

/**
 * A set of radio options from which a user chooses exactly one value.
 *
 * The group holds the value, submits it and validates it; its options are `ui-radio-field`
 * elements among its descendants. It gives the group one stop in the order of the Tab key, on the
 * chosen option or else the first enabled one, and the arrow keys move the choice as in a native
 * group, in reading order and around the ends. The `value` attribute supplies the initial and
 * reset value, and the property holds the current one. An author's `aria-label` names the group
 * when it has no visible label.
 *
 * @slot - The options, `ui-radio-field` elements.
 *
 * @part base - The label, the options and the hint.
 * @part label - The visible name of the group.
 * @part label-text - The visible label text.
 * @part options - The box of the options, with the role radiogroup.
 * @part hint - The help or feedback container.
 * @part hint-text - The help or feedback text.
 */
@Component({
  tag: 'ui-radio-group',
  styleUrl: 'radio-group.css',
  shadow: true,
  formAssociated: true,
})
export class UiRadioGroup implements RadioGroupProps, FormAssociated {
  @Element() host!: HTMLUiRadioGroupElement;

  @AttachInternals() internals!: ElementInternals;

  /** A persistent visible name of the group. Include any required marker in this text. */
  @Prop() label?: string;

  /** Help or validation feedback, connected to the description of the group. */
  @Prop() hint?: string;

  /** The direction in which the options follow each other. */
  @Prop() orientation: RadioGroupOrientation = 'vertical';

  /**
   * The value of the chosen option. The attribute sets the initial value, which a reset restores;
   * the property holds the current one, which a user changes.
   */
  @Prop({ mutable: true }) value?: string;

  /** The name of the form entry. */
  @Prop({ reflect: true }) name?: string;

  /** Requires a chosen option for native validation. */
  @Prop() required = false;

  /** Prevents choosing any option, and submission. */
  @Prop({ reflect: true }) disabled = false;

  /** Visual feedback; `error` also sets `aria-invalid` on the group. */
  @Prop() state: ChoiceState = 'default';

  /** A user chose an option, with its value and the native change event. */
  @Event({ eventName: 'ui-value-change' }) valueChange!: EventEmitter<RadioGroupValueChange>;

  @State() private formDisabled = false;

  @State() private authorLabel: string | null = null;

  private customValidity = '';

  private stopFollowing: (() => void)[] = [];

  /** The associated form, including an explicit `form` attribute. */
  get form(): HTMLFormElement | null {
    return this.internals.form;
  }

  /** Native validity of the group. */
  get validity(): ValidityState {
    this.sync();
    return this.internals.validity;
  }

  /** The native or custom validation message. */
  get validationMessage(): string {
    this.sync();
    return this.internals.validationMessage;
  }

  /** Whether the host takes part in native constraint validation. */
  get willValidate(): boolean {
    return this.internals.willValidate;
  }

  /** Checks the form-associated host and dispatches `invalid` when needed. */
  // eslint-disable-next-line stencil/own-methods-must-be-private -- the synchronous API of a native control
  checkValidity(): boolean {
    this.sync();
    return this.internals.checkValidity();
  }

  /** Reports invalidity, with the chosen or first radio button as the anchor of the message. */
  // eslint-disable-next-line stencil/own-methods-must-be-private -- the synchronous API of a native control
  reportValidity(): boolean {
    this.sync();
    return this.internals.reportValidity();
  }

  /** Sets a custom constraint; an empty string clears it. */
  // eslint-disable-next-line stencil/own-methods-must-be-private -- the synchronous API of a native control
  setCustomValidity(message: string): void {
    this.customValidity = message;
    this.sync();
  }

  connectedCallback(): void {
    registerRadioGroup(this.host, {
      optionsChanged: () => {
        this.sync();
      },
      choose: (option, event) => {
        this.choose(option, event);
      },
    });
    this.stopFollowing = [
      followAttribute(this.host, 'aria-label', (value) => {
        this.authorLabel = value;
      }),
    ];
    this.host.addEventListener('keydown', this.onKeyDown);
    // A form reads the entry and validity as soon as the group joins it.
    this.sync();
  }

  disconnectedCallback(): void {
    for (const stop of this.stopFollowing) {
      stop();
    }
    this.stopFollowing = [];
    this.host.removeEventListener('keydown', this.onKeyDown);
  }

  /**
   * Takes the disabled state the browser computes: the host's own `disabled` attribute or a
   * disabled fieldset. The browser calls it only when that state changes, so it is kept as given.
   */
  formDisabledCallback(disabled: boolean): void {
    this.formDisabled = disabled;
  }

  /** Restores the value of the attribute without emitting an event. */
  formResetCallback(): void {
    this.value = this.host.getAttribute('value') ?? undefined;
  }

  /** Restores the value the browser saved, without emitting an event. */
  formStateRestoreCallback(state: string | File | FormData | null): void {
    if (typeof state === 'string') {
      this.value = state;
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
    this.sync();
  }

  render(): VNode {
    const state = choiceState(this.state);
    const orientation = oneOf(
      this.orientation,
      orientationOption.options,
      orientationOption.default,
    );
    const hasLabel = this.label !== undefined && this.label !== '';
    return (
      <div
        part="base"
        class={`base ${orientation} ${state}${this.isDisabled() ? ' disabled' : ''}`}
      >
        {hasLabel ? (
          <span id="label" part="label" class="label">
            <span part="label-text">{this.label}</span>
          </span>
        ) : null}
        <div
          part="options"
          class="options"
          role="radiogroup"
          aria-labelledby={hasLabel ? 'label' : undefined}
          aria-label={hasLabel ? undefined : (this.authorLabel ?? undefined)}
          aria-describedby={choiceDescription(this.hint)}
          aria-invalid={state === 'error' ? 'true' : undefined}
          aria-required={this.required ? 'true' : undefined}
          aria-disabled={this.isDisabled() ? 'true' : undefined}
        >
          <slot onSlotchange={this.onSlotChange} />
        </div>
        <input
          class="validity"
          type="radio"
          name="validity"
          hidden
          tabIndex={-1}
          aria-hidden="true"
        />
        {this.hint !== undefined && this.hint !== '' ? (
          <span id="hint" part="hint" class="hint">
            <span part="hint-text">{this.hint}</span>
          </span>
        ) : null}
      </div>
    );
  }

  /** Disabled directly or by the owning fieldset. */
  private isDisabled(): boolean {
    return this.disabled || this.formDisabled;
  }

  /** The chosen option, if an enabled option has the value. */
  private chosen(options: readonly RadioOption[]): RadioOption | undefined {
    return this.value === undefined
      ? undefined
      : options.find((option) => option.value() === this.value);
  }

  /**
   * Tells every option its state, and gives the form the entry and the validity of the group,
   * whose message the browser writes in the user's language.
   */
  private sync(): void {
    const options = radioOptionsOf(this.host);
    const chosen = this.chosen(options);
    const groupDisabled = this.isDisabled();
    const enabled = options.filter((option) => !option.disabled() && !groupDisabled);
    const tabbable =
      chosen !== undefined && enabled.includes(chosen) ? chosen : (enabled[0] ?? options[0]);
    const error = choiceState(this.state) === 'error';
    options.forEach((option, index) => {
      option.update({
        checked: option === chosen,
        tabbable: option === tabbable,
        required: this.required,
        groupDisabled,
        error,
        position: index + 1,
        count: options.length,
      });
    });

    const name = this.name;
    if (
      chosen !== undefined &&
      !groupDisabled &&
      !chosen.disabled() &&
      name !== undefined &&
      name !== ''
    ) {
      const entry = new FormData();
      entry.append(name, chosen.value());
      this.internals.setFormValue(entry, chosen.value());
    } else {
      this.internals.setFormValue(null, this.value ?? null);
    }

    // A radio button validates only as a member of a named group in a document or shadow root, so
    // a hidden one in the shadow root of the group answers, with the constraints of the group.
    const validity =
      this.host.shadowRoot?.querySelector<HTMLInputElement>('input.validity') ?? null;
    if (validity === null) {
      return;
    }
    validity.required = this.required;
    validity.disabled = groupDisabled;
    validity.checked = chosen !== undefined;
    validity.setCustomValidity(this.customValidity);
    const anchor = (chosen ?? options[0])?.input() ?? undefined;
    copyValidity(this.internals, validity, anchor);
  }

  private choose(option: RadioOption, event: globalThis.Event): void {
    if (this.isDisabled() || option.disabled()) {
      return;
    }
    this.value = option.value();
    this.sync();
    this.valueChange.emit({ value: option.value(), originalEvent: event });
    this.host.dispatchEvent(new globalThis.Event('change', { bubbles: true, composed: true }));
  }

  /** The arrow keys move the choice, as in a native group; a click on the radio button chooses. */
  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    const options = radioOptionsOf(this.host);
    const target = event.composedPath()[0];
    const current = options.findIndex((option) => option.input() === target);
    if (current === -1 || !(target instanceof HTMLElement)) {
      return;
    }
    const groupDisabled = this.isDisabled();
    const next = nextRadio(
      event.key,
      current,
      options.map((option) => !option.disabled() && !groupDisabled),
      getComputedStyle(target).direction === 'rtl' ? 'rtl' : 'ltr',
    );
    const input = next === undefined ? null : (options[next]?.input() ?? null);
    if (input === null) {
      return;
    }
    event.preventDefault();
    input.focus();
    input.click();
  };

  private readonly onSlotChange = (): void => {
    this.sync();
  };
}

/**
 * Every prop of the specification is a prop of the component. `implements` alone accepts a class
 * that leaves out an optional prop, so a prop added to the specification would go unnoticed.
 */
type _DeclaresEveryProp = Pick<UiRadioGroup, keyof RadioGroupProps>;
