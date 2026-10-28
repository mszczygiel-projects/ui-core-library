import { iconCheckmark, iconMinus } from '@mszczygiel-projects/ui-core-icons';
import type {
  CheckboxFieldProps,
  ChoiceState,
} from '@mszczygiel-projects/ui-core-shared/checkbox-field';
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

import { CheckedControl } from '../internal/checked-control.ts';
import { Choice, choiceDescription, choiceState } from '../internal/choice.tsx';
import { followAttribute } from '../internal/follow-attribute.ts';
import type { FormAssociated } from '../internal/form-associated.ts';
import type { CheckedChange } from './events.ts';

// HTMLElement is repeated because the first build runs before Stencil declares the element.
declare global {
  interface HTMLUiCheckboxFieldElement extends HTMLElement, FormAssociated {
    /** Sets a custom constraint; an empty string clears it. */
    setCustomValidity(message: string): void;
  }

  interface HTMLElementEventMap {
    'ui-checked-change': CustomEvent<CheckedChange>;
  }
}

/**
 * A checkbox with a label and hint that a user turns on and off, with a mixed state for a partial
 * selection.
 *
 * Its inner checkbox owns accessibility; ElementInternals associates the host with the outer form.
 * The `checked` attribute supplies the initial and reset state, and the property holds the current
 * one, as on a native checkbox. A click of the user ends the mixed state; a reset keeps it. An
 * author's `aria-label` names the checkbox when it has no visible label.
 *
 * @part base - The control, label and hint.
 * @part label - The row that holds the box and its text; a click on it toggles the box.
 * @part control - The box and its pointer target.
 * @part input - The native checkbox, drawn as the box.
 * @part mark - The check or the dash of the mixed state.
 * @part label-text - The visible label text.
 * @part hint - The help or feedback container.
 * @part hint-text - The help or feedback text.
 */
@Component({
  tag: 'ui-checkbox-field',
  styleUrls: ['../internal/choice.css', 'checkbox-field.css'],
  shadow: { delegatesFocus: true },
  formAssociated: true,
})
export class UiCheckboxField implements CheckboxFieldProps, FormAssociated {
  @Element() host!: HTMLUiCheckboxFieldElement;

  @AttachInternals() internals!: ElementInternals;

  /** A persistent visible name. Include any required marker in this text. */
  @Prop() label?: string;

  /** Help or validation feedback, connected to the description of the checkbox. */
  @Prop() hint?: string;

  /**
   * Whether the box is checked. The attribute sets the initial state, which a reset restores; the
   * property holds the current one, which a click changes.
   */
  @Prop({ mutable: true }) checked = false;

  /** Shows the mixed state of a partial selection, which a click of the user ends. */
  @Prop({ mutable: true }) indeterminate = false;

  /** Visual feedback; `error` also sets `aria-invalid` without changing native validity. */
  @Prop() state: ChoiceState = 'default';

  /** Prevents interaction and submission. */
  @Prop({ reflect: true }) disabled = false;

  /** Requires the box to be checked for native validation. */
  @Prop() required = false;

  /** The name of the form entry. */
  @Prop({ reflect: true }) name?: string;

  /** The string the form submits while the box is checked. */
  @Prop() value = 'on';

  /** A user checked or cleared the box, with the new state and the native change event. */
  @Event({ eventName: 'ui-checked-change' }) checkedChange!: EventEmitter<CheckedChange>;

  @State() private formDisabled = false;

  @State() private authorLabel: string | null = null;

  private stopFollowing: (() => void)[] = [];

  private readonly control = new CheckedControl({
    host: () => this.host,
    internals: () => this.internals,
    control: () => this.input(),
    name: () => this.name,
    value: () => this.value,
    required: () => this.required,
    disabled: () => this.isDisabled(),
    onChecked: (checked) => {
      this.checked = checked;
    },
  });

  /** The associated form, including an explicit `form` attribute. */
  get form(): HTMLFormElement | null {
    return this.internals.form;
  }

  /** Native validity, synchronized from the inner checkbox. */
  get validity(): ValidityState {
    this.control.sync(this.checked);
    return this.internals.validity;
  }

  /** The native or custom validation message. */
  get validationMessage(): string {
    this.control.sync(this.checked);
    return this.internals.validationMessage;
  }

  /** Whether the host takes part in native constraint validation. */
  get willValidate(): boolean {
    return this.internals.willValidate;
  }

  /** Checks the form-associated host and dispatches `invalid` when needed. */
  // eslint-disable-next-line stencil/own-methods-must-be-private -- the synchronous API of a native control
  checkValidity(): boolean {
    this.control.sync(this.checked);
    return this.internals.checkValidity();
  }

  /** Reports invalidity, with the native checkbox as the anchor of the message. */
  // eslint-disable-next-line stencil/own-methods-must-be-private -- the synchronous API of a native control
  reportValidity(): boolean {
    this.control.sync(this.checked);
    return this.internals.reportValidity();
  }

  /** Sets a custom constraint; an empty string clears it. */
  // eslint-disable-next-line stencil/own-methods-must-be-private -- the synchronous API of a native control
  setCustomValidity(message: string): void {
    this.control.setCustomValidity(message);
  }

  connectedCallback(): void {
    this.stopFollowing = [
      followAttribute(this.host, 'aria-label', (value) => {
        this.authorLabel = value;
      }),
    ];
    // A form reads the entry and validity as soon as the control joins it.
    this.control.sync(this.checked);
  }

  disconnectedCallback(): void {
    for (const stop of this.stopFollowing) {
      stop();
    }
    this.stopFollowing = [];
  }

  /**
   * Takes the disabled state the browser computes: the host's own `disabled` attribute or a
   * disabled fieldset. The browser calls it only when that state changes, so it is kept as given.
   */
  formDisabledCallback(disabled: boolean): void {
    this.formDisabled = disabled;
  }

  /** Restores the state of the attribute without emitting an event; the mixed state stays. */
  formResetCallback(): void {
    this.control.reset();
  }

  /** Restores the state the browser saved, without emitting an event. */
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
    const input = this.input();
    if (input !== null) {
      // Neither state has an attribute that keeps the native checkbox in step.
      input.checked = this.checked;
      input.indeterminate = this.indeterminate;
    }
    this.control.sync(this.checked);
  }

  render(): VNode {
    const state = choiceState(this.state);
    const disabled = this.isDisabled();
    return (
      <Choice classes={`base end ${state}`} label={this.label} hint={this.hint}>
        <span part="control" class="control">
          <input
            part="input"
            class="input"
            type="checkbox"
            checked={this.checked}
            disabled={disabled}
            required={this.required}
            aria-label={this.authorLabel ?? undefined}
            aria-invalid={state === 'error' ? 'true' : undefined}
            aria-describedby={choiceDescription(this.hint)}
            onChange={this.onChange}
          />
          <span part="mark" class="mark" aria-hidden="true">
            <span class="mark-check" innerHTML={iconCheckmark} />
            <span class="mark-mixed" innerHTML={iconMinus} />
          </span>
        </span>
      </Choice>
    );
  }

  private input(): HTMLInputElement | null {
    return this.host.shadowRoot?.querySelector('input') ?? null;
  }

  /** Disabled directly or by the owning fieldset. */
  private isDisabled(): boolean {
    return this.disabled || this.formDisabled;
  }

  /** The native change event stays in the shadow root, so the host dispatches its own. */
  private readonly onChange = (event: globalThis.Event): void => {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }
    this.checked = input.checked;
    this.indeterminate = false;
    this.control.sync(this.checked);
    this.checkedChange.emit({ value: this.checked, originalEvent: event });
    this.host.dispatchEvent(new globalThis.Event('change', { bubbles: true, composed: true }));
  };
}

/**
 * Every prop of the specification is a prop of the component. `implements` alone accepts a class
 * that leaves out an optional prop, so a prop added to the specification would go unnoticed.
 */
type _DeclaresEveryProp = Pick<UiCheckboxField, keyof CheckboxFieldProps>;
