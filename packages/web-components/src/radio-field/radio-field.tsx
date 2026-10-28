import type { RadioFieldProps } from '@mszczygiel-projects/ui-core-shared/radio-field';
import { Component, Element, h, Prop, State, type VNode, Watch } from '@stencil/core';

import { Choice, choiceDescription } from '../internal/choice.tsx';
import { followAttribute } from '../internal/follow-attribute.ts';
import {
  type RadioGroupChannel,
  radioGroupOf,
  type RadioOption,
  type RadioOptionState,
  registerRadioOption,
} from '../internal/radio.ts';

const ALONE: RadioOptionState = {
  checked: false,
  tabbable: true,
  required: false,
  groupDisabled: false,
  error: false,
  position: 1,
  count: 1,
};

/**
 * One option of a RadioGroup, with a label and hint.
 *
 * Its inner radio button owns accessibility. The group that holds it chooses it by its value,
 * gives the group one stop in the order of the Tab key, and moves the choice with the arrow keys.
 * Outside a group, the option has no state and submits nothing. An author's `aria-label` names
 * the radio button when it has no visible label.
 *
 * @part base - The radio button, label and hint.
 * @part label - The row that holds the radio button and its text; a click on it chooses it.
 * @part control - The radio button and its pointer target.
 * @part input - The native radio button.
 * @part label-text - The visible label text.
 * @part hint - The help or feedback container.
 * @part hint-text - The help or feedback text.
 */
@Component({
  tag: 'ui-radio-field',
  styleUrls: ['../internal/choice.css', 'radio-field.css'],
  shadow: { delegatesFocus: true },
})
export class UiRadioField implements RadioFieldProps {
  @Element() host!: HTMLUiRadioFieldElement;

  /** The value that the group takes when a user chooses this option. */
  @Prop() value = '';

  /** A persistent visible name. */
  @Prop() label?: string;

  /** Help, connected to the description of the radio button. */
  @Prop() hint?: string;

  /** Prevents choosing the option. */
  @Prop({ reflect: true }) disabled = false;

  @State() private group: RadioOptionState = ALONE;

  @State() private authorLabel: string | null = null;

  private channel?: RadioGroupChannel;

  private stopFollowing: (() => void)[] = [];

  private readonly option: RadioOption = {
    element: this.host,
    value: () => this.value,
    disabled: () => this.disabled,
    input: () => this.input(),
    update: (state) => {
      this.group = state;
    },
  };

  connectedCallback(): void {
    registerRadioOption(this.option);
    this.stopFollowing = [
      followAttribute(this.host, 'aria-label', (value) => {
        this.authorLabel = value;
      }),
    ];
    this.channel = radioGroupOf(this.host);
    if (this.channel === undefined) {
      this.group = ALONE;
    }
    this.channel?.optionsChanged();
  }

  disconnectedCallback(): void {
    for (const stop of this.stopFollowing) {
      stop();
    }
    this.stopFollowing = [];
    this.channel?.optionsChanged();
    this.channel = undefined;
  }

  @Watch('value')
  @Watch('disabled')
  protected optionChanged(): void {
    this.channel?.optionsChanged();
  }

  componentDidRender(): void {
    const input = this.input();
    if (input !== null) {
      // The checked attribute of a native radio button is its default, so the property keeps it in
      // step with the group.
      input.checked = this.group.checked;
    }
  }

  render(): VNode {
    const disabled = this.disabled || this.group.groupDisabled;
    return (
      <Choice
        classes={`base end ${this.group.error ? 'error' : 'default'}`}
        label={this.label}
        hint={this.hint}
      >
        <span part="control" class="control">
          <input
            part="input"
            class="input"
            type="radio"
            value={this.value}
            checked={this.group.checked}
            disabled={disabled}
            required={this.group.required}
            tabIndex={this.group.tabbable ? 0 : -1}
            aria-label={this.authorLabel ?? undefined}
            aria-describedby={choiceDescription(this.hint)}
            // The radio buttons live in separate shadow roots, so a reader learns their place in
            // the group from these.
            aria-posinset={this.channel === undefined ? undefined : String(this.group.position)}
            aria-setsize={this.channel === undefined ? undefined : String(this.group.count)}
            onChange={this.onChange}
          />
          <span class="dot" aria-hidden="true" />
        </span>
      </Choice>
    );
  }

  private input(): HTMLInputElement | null {
    return this.host.shadowRoot?.querySelector('input') ?? null;
  }

  private readonly onChange = (event: globalThis.Event): void => {
    if (this.channel === undefined) {
      // Outside a group, the option has no state to keep.
      const input = this.input();
      if (input !== null) {
        input.checked = false;
      }
      return;
    }
    this.channel.choose(this.option, event);
  };
}

/**
 * Every prop of the specification is a prop of the component. `implements` alone accepts a class
 * that leaves out an optional prop, so a prop added to the specification would go unnoticed.
 */
type _DeclaresEveryProp = Pick<UiRadioField, keyof RadioFieldProps>;
