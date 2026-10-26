import type { UiCoreConfig } from '@mszczygiel-projects/ui-core-foundations/config';
import { getUiCoreConfig } from '@mszczygiel-projects/ui-core-foundations/config';
import {
  button,
  type ButtonProps,
  type ButtonSize,
  type ButtonType,
  type ButtonVariant,
} from '@mszczygiel-projects/ui-core-shared/button';
import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import { AttachInternals, Component, Element, h, Prop, State, type VNode } from '@stencil/core';

import { cancelInactiveClick, runFormAction, setState } from '../internal/action.ts';
import { followConfig } from '../internal/config.ts';
import { followAttribute } from '../internal/follow-attribute.ts';
import type { FormAssociated } from '../internal/form-associated.ts';
import { hasAssignedContent } from '../internal/slots.ts';

const { options } = button;

declare global {
  interface HTMLUiButtonElement extends FormAssociated {
    /** Activates the native button, as the pointer and the keyboard do. */
    click(): void;
  }
}

/**
 * Triggers an action, with optional icons and a loading state.
 *
 * The native button inside the shadow root owns the accessible semantics. The host takes part in
 * its outer form through ElementInternals. A submit contributes the name and value only during
 * that activation, and the outer submit event has no submitter.
 *
 * @slot - The visible action name. Supply text or non-interactive content.
 * @slot leading-icon - A decorative icon before the action name, in reading order.
 * @slot trailing-icon - A decorative icon after the action name, in reading order.
 * @part base - The native button and its surface, border and focus ring.
 * @part wrapper - The content and the centred loading indicator.
 * @part content - The icons and label, kept in the layout while loading.
 * @part label - The visible action name.
 * @part leading-icon - The decorative leading icon container.
 * @part trailing-icon - The decorative trailing icon container.
 * @part loader - The decorative loading indicator container.
 */
@Component({
  tag: 'ui-button',
  styleUrls: ['../internal/action.css', 'button.css'],
  shadow: { delegatesFocus: true },
  formAssociated: true,
})
export class UiButton implements ButtonProps, FormAssociated {
  @Element() host!: HTMLUiButtonElement;

  @AttachInternals() internals!: ElementInternals;

  /** The visual emphasis of the action. */
  @Prop() variant: ButtonVariant = 'primary';

  /** The size of the button, which follows the density. */
  @Prop() size: ButtonSize = 'medium';

  /** Disables interaction and removes the native control from keyboard navigation. */
  @Prop({ reflect: true }) disabled = false;

  /** Blocks activation while keeping focus, width and the accessible name of the action. */
  @Prop() loading = false;

  /** The native form action; an ordinary action does not submit. */
  @Prop() type: ButtonType = 'button';

  /** The name of the form entry, submitted only when this button submits. */
  @Prop({ reflect: true }) name?: string;

  /** The value submitted with the name; it identifies the action and is not edited. */
  @Prop() value = '';

  /** An accessible name replacing the visible content. An author's `aria-label` wins. */
  @Prop() label?: string;

  /** The description of the loading state, falling back to `labels.button.loading`. */
  @Prop() loadingLabel?: string;

  @State() private config: UiCoreConfig = getUiCoreConfig();

  /** Whether the browser disables the form-associated host, by its attribute or its fieldset. */
  @State() private formDisabled = false;

  /** The `aria-label` that the page wrote on the host. */
  @State() private authorLabel: string | null = null;

  @State() private hasLeadingIcon = false;

  @State() private hasTrailingIcon = false;

  private stopFollowing: (() => void)[] = [];

  /** The outer form associated by the browser, including an explicit `form` attribute. */
  get form(): HTMLFormElement | null {
    return this.internals.form;
  }

  /** Native validity; an action button adds no constraint. */
  get validity(): ValidityState {
    return this.internals.validity;
  }

  /** The browser's validation message, empty for a button without a constraint. */
  get validationMessage(): string {
    return this.internals.validationMessage;
  }

  /** Whether the browser includes the host in constraint validation. */
  get willValidate(): boolean {
    return this.internals.willValidate;
  }

  /** Checks the validity of the form-associated host, synchronously as a native control does. */
  // eslint-disable-next-line stencil/own-methods-must-be-private -- the synchronous API of a native control
  checkValidity(): boolean {
    return this.internals.checkValidity();
  }

  /** Reports the validity of the form-associated host, synchronously as a native control does. */
  // eslint-disable-next-line stencil/own-methods-must-be-private -- the synchronous API of a native control
  reportValidity(): boolean {
    return this.internals.reportValidity();
  }

  /** Activates the same native control as the pointer and the keyboard. */
  // eslint-disable-next-line stencil/own-methods-must-be-private -- the native activation of a button
  click(): void {
    const control = this.host.shadowRoot?.querySelector('button');
    if (control) {
      control.click();
    } else {
      // Before its first render the element has no control yet, and clicks as any element does.
      HTMLElement.prototype.click.call(this.host);
    }
  }

  connectedCallback(): void {
    this.stopFollowing = [
      followConfig((config) => {
        this.config = config;
      }),
      followAttribute(this.host, 'aria-label', (value) => {
        this.authorLabel = value;
      }),
    ];
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

  /** A reset clears transient submission data and leaves the configured action unchanged. */
  formResetCallback(): void {
    this.internals.setFormValue(null);
  }

  /** An action has no editable state to restore. */
  formStateRestoreCallback(): void {
    this.internals.setFormValue(null);
  }

  componentWillRender(): void {
    setState(this.internals, 'disabled', this.isDisabled());
    setState(this.internals, 'loading', this.loading);
  }

  render(): VNode {
    const variant = oneOf(this.variant, options.variant.options, options.variant.default);
    const size = oneOf(this.size, options.size.options, options.size.default);
    const type = oneOf(this.type, options.type.options, options.type.default);
    const label = this.authorLabel ?? this.label;
    const named = typeof label === 'string' && label !== '';
    // Without a label, the label part names the button: aria-hidden in the shadow root does not
    // reach the icons slotted into it, so a name from all the content would include them. The
    // internal form runs the action after the native click dispatch finishes, as a native submit
    // button does, so that a listener anywhere on the page can still cancel it; its role keeps it
    // out of the accessibility tree.
    return (
      <form role="none" onSubmit={this.onFormAction} onReset={this.onFormAction}>
        <button
          part="base"
          class={`base action ${variant} ${size}${this.loading ? ' loading' : ''}`}
          type={type}
          disabled={this.isDisabled()}
          aria-label={named ? label : undefined}
          aria-labelledby={named ? undefined : 'action-label'}
          aria-busy={this.loading ? 'true' : undefined}
          aria-disabled={this.loading ? 'true' : undefined}
          aria-describedby={this.loading ? 'loading-description' : undefined}
          onClickCapture={this.onClick}
        >
          <span part="wrapper" class="wrapper">
            <span part="content" class="content">
              <span
                part="leading-icon"
                class="icon"
                aria-hidden="true"
                hidden={!this.hasLeadingIcon}
              >
                <slot name="leading-icon" onSlotchange={this.onLeadingSlotChange} />
              </span>
              <span id="action-label" part="label" class="label">
                <slot />
              </span>
              <span
                part="trailing-icon"
                class="icon"
                aria-hidden="true"
                hidden={!this.hasTrailingIcon}
              >
                <slot name="trailing-icon" onSlotchange={this.onTrailingSlotChange} />
              </span>
            </span>
            {this.loading && (
              <span part="loader" class="loader" aria-hidden="true">
                <ui-loader size={size === 'large' ? 'medium' : 'small'} />
              </span>
            )}
          </span>
          {this.loading && (
            <span id="loading-description" hidden>
              {this.loadingLabel ?? this.config.labels.button.loading}
            </span>
          )}
        </button>
      </form>
    );
  }

  /** Disabled directly or by the owning fieldset. */
  private isDisabled(): boolean {
    return this.disabled || this.formDisabled;
  }

  private readonly onLeadingSlotChange = (event: Event): void => {
    this.hasLeadingIcon = hasAssignedContent(event);
  };

  private readonly onTrailingSlotChange = (event: Event): void => {
    this.hasTrailingIcon = hasAssignedContent(event);
  };

  /**
   * Cancels a click on a disabled or loading button where it starts. A click that starts on an
   * active button completes, even when a click handler then starts loading, as in React.
   */
  private readonly onClick = (event: MouseEvent): void => {
    cancelInactiveClick(event, this.isDisabled() || this.loading);
  };

  private readonly onFormAction = (event: Event): void => {
    runFormAction(event, this.internals, {
      disabled: this.isDisabled(),
      name: this.name,
      value: this.value,
    });
  };
}

/**
 * Every prop of the specification is a prop of the component. `implements` alone accepts a class
 * that leaves out an optional prop, so a prop added to the specification would go unnoticed.
 */
type _DeclaresEveryProp = Pick<UiButton, keyof ButtonProps>;
