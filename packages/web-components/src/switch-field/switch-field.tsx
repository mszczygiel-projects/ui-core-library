import type { ChoiceState } from '@mszczygiel-projects/ui-core-shared/checkbox-field';
import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import {
  switchField,
  type SwitchFieldLabelPosition,
  type SwitchFieldProps,
} from '@mszczygiel-projects/ui-core-shared/switch-field';
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

import type { CheckedChange } from '../checkbox-field/events.ts';
import { CheckedControl } from '../internal/checked-control.ts';
import { Choice, choiceDescription, choiceState } from '../internal/choice.tsx';
import { followAttribute } from '../internal/follow-attribute.ts';
import type { FormAssociated } from '../internal/form-associated.ts';
import { hasAssignedContent } from '../internal/slots.ts';

// HTMLElement is repeated because the first build runs before Stencil declares the element.
declare global {
  interface HTMLUiSwitchFieldElement extends HTMLElement, FormAssociated {
    /** Sets a custom constraint; an empty string clears it. */
    setCustomValidity(message: string): void;
  }
}

const { labelPosition: labelPositionOption } = switchField.options;

/**
 * A switch with a label and hint that turns a setting on or off at once.
 *
 * Its inner checkbox has the role `switch` and owns accessibility; ElementInternals associates the
 * host with the outer form. The `checked` attribute supplies the initial and reset state, and the
 * property holds the current one. An author's `aria-label` names the switch when it has no visible
 * label.
 *
 * @slot icon-on - A decorative icon in the thumb while the switch is on.
 * @slot icon-off - A decorative icon in the thumb while the switch is off.
 *
 * @part base - The switch, label and hint.
 * @part label - The row that holds the switch and its text; a click on it toggles the switch.
 * @part control - The switch and its pointer target.
 * @part input - The native checkbox with the role switch, drawn as the track.
 * @part thumb - The knob that moves to the end of the track while the switch is on.
 * @part icon - The box of an icon in the thumb.
 * @part label-text - The visible label text.
 * @part hint - The help or feedback container.
 * @part hint-text - The help or feedback text.
 */
@Component({
  tag: 'ui-switch-field',
  styleUrls: ['../internal/choice.css', 'switch-field.css'],
  shadow: { delegatesFocus: true },
  formAssociated: true,
})
export class UiSwitchField implements SwitchFieldProps, FormAssociated {
  @Element() host!: HTMLUiSwitchFieldElement;

  @AttachInternals() internals!: ElementInternals;

  /** A persistent visible name. */
  @Prop() label?: string;

  /** Help or validation feedback, connected to the description of the switch. */
  @Prop() hint?: string;

  /** The side of the switch on which the label and hint sit. */
  @Prop() labelPosition: SwitchFieldLabelPosition = 'end';

  /**
   * Whether the switch is on. The attribute sets the initial state, which a reset restores; the
   * property holds the current one, which a click changes.
   */
  @Prop({ mutable: true }) checked = false;

  /** Visual feedback; `error` also sets `aria-invalid` without changing native validity. */
  @Prop() state: ChoiceState = 'default';

  /** Prevents interaction and submission. */
  @Prop({ reflect: true }) disabled = false;

  /** The name of the form entry. */
  @Prop({ reflect: true }) name?: string;

  /** The string the form submits while the switch is on. */
  @Prop() value = 'on';

  /** A user turned the switch on or off, with the new state and the native change event. */
  @Event({ eventName: 'ui-checked-change' }) checkedChange!: EventEmitter<CheckedChange>;

  @State() private formDisabled = false;

  @State() private authorLabel: string | null = null;

  @State() private hasIconOn = false;

  @State() private hasIconOff = false;

  private stopFollowing: (() => void)[] = [];

  private readonly control = new CheckedControl({
    host: () => this.host,
    internals: () => this.internals,
    control: () => this.input(),
    name: () => this.name,
    value: () => this.value,
    required: () => false,
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

  /** Restores the state of the attribute without emitting an event. */
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
      // The checked attribute of a native checkbox is its default, so the property keeps it in step.
      input.checked = this.checked;
    }
    this.control.sync(this.checked);
  }

  render(): VNode {
    const state = choiceState(this.state);
    const position = oneOf(
      this.labelPosition,
      labelPositionOption.options,
      labelPositionOption.default,
    );
    const disabled = this.isDisabled();
    return (
      <Choice classes={`base ${position} ${state}`} label={this.label} hint={this.hint}>
        <span part="control" class="control">
          <input
            part="input"
            class="input"
            type="checkbox"
            role="switch"
            checked={this.checked}
            disabled={disabled}
            aria-label={this.authorLabel ?? undefined}
            aria-invalid={state === 'error' ? 'true' : undefined}
            aria-describedby={choiceDescription(this.hint)}
            onChange={this.onChange}
          />
          <span part="thumb" class="thumb" aria-hidden="true">
            <span part="icon" class="icon icon-on" hidden={!this.hasIconOn}>
              <slot name="icon-on" onSlotchange={this.onIconOnSlotChange} />
            </span>
            <span part="icon" class="icon icon-off" hidden={!this.hasIconOff}>
              <slot name="icon-off" onSlotchange={this.onIconOffSlotChange} />
            </span>
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
    this.control.sync(this.checked);
    this.checkedChange.emit({ value: this.checked, originalEvent: event });
    this.host.dispatchEvent(new globalThis.Event('change', { bubbles: true, composed: true }));
  };

  private readonly onIconOnSlotChange = (event: globalThis.Event): void => {
    this.hasIconOn = hasAssignedContent(event);
  };

  private readonly onIconOffSlotChange = (event: globalThis.Event): void => {
    this.hasIconOff = hasAssignedContent(event);
  };
}

/**
 * Every prop of the specification is a prop of the component. `implements` alone accepts a class
 * that leaves out an optional prop, so a prop added to the specification would go unnoticed.
 */
type _DeclaresEveryProp = Pick<UiSwitchField, keyof SwitchFieldProps>;
