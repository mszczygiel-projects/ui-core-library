import type { UiCoreConfig } from '@mszczygiel-projects/ui-core-foundations/config';
import { getUiCoreConfig } from '@mszczygiel-projects/ui-core-foundations/config';
import {
  iconButton,
  type IconButtonProps,
  type IconButtonSize,
  type IconButtonType,
  type IconButtonVariant,
} from '@mszczygiel-projects/ui-core-shared/icon-button';
import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import { AttachInternals, Component, Element, h, Prop, State, type VNode } from '@stencil/core';

import { cancelInactiveClick, runFormAction, setState } from '../internal/action.ts';
import { followConfig } from '../internal/config.ts';
import { followAttribute } from '../internal/follow-attribute.ts';
import type { FormAssociated } from '../internal/form-associated.ts';
import {
  followForwardedAria,
  forwardDescription,
  type ForwardedAria,
} from '../internal/forward-aria.ts';

const { options } = iconButton;

declare global {
  interface HTMLUiIconButtonElement extends FormAssociated {
    /** Activates the native button, as the pointer and the keyboard do. */
    click(): void;
  }
}

/**
 * Triggers an action named only by an icon, as a square of the height of a button.
 *
 * The native button inside the shadow root owns the accessible semantics, named by `label`. The
 * host takes part in its outer form through ElementInternals, as Button does.
 *
 * @slot icon - The icon of the action. It is decorative; `label` names the action.
 * @part base - The native button and its surface, border and focus ring.
 * @part icon - The square that centres the icon, as tall as the line of a button.
 * @part loader - The decorative loading indicator container.
 */
@Component({
  tag: 'ui-icon-button',
  styleUrls: ['../internal/action.css', 'icon-button.css'],
  shadow: { delegatesFocus: true },
  formAssociated: true,
})
export class UiIconButton implements IconButtonProps, FormAssociated {
  @Element() host!: HTMLUiIconButtonElement;

  @AttachInternals() internals!: ElementInternals;

  /** The accessible name of the action, which nothing visible gives. An author's `aria-label` wins. */
  @Prop() label = '';

  /** The visual emphasis of the action. */
  @Prop() variant: IconButtonVariant = 'primary';

  /** The size, which follows the density and matches the height of a button. */
  @Prop() size: IconButtonSize = 'medium';

  /** Disables interaction and removes the native control from keyboard navigation. */
  @Prop({ reflect: true }) disabled = false;

  /** Blocks activation while keeping focus and the accessible name. */
  @Prop() loading = false;

  /** The native form action; an ordinary action does not submit. */
  @Prop() type: IconButtonType = 'button';

  /** The name of the form entry, submitted only when this button submits. */
  @Prop({ reflect: true }) name?: string;

  /** The value submitted with the name; it identifies the action and is not edited. */
  @Prop() value = '';

  /** The description of the loading state, falling back to `labels.iconButton.loading`. */
  @Prop() loadingLabel?: string;

  @State() private config: UiCoreConfig = getUiCoreConfig();

  /** Whether the browser disables the form-associated host, by its attribute or its fieldset. */
  @State() private formDisabled = false;

  /** The `aria-label` that the page wrote on the host. */
  @State() private authorLabel: string | null = null;

  /** The popup attributes that a Popover or Tooltip wrote on the host. */
  @State() private forwardedAria: ForwardedAria = {};

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
      followForwardedAria(this.host, (aria) => {
        this.forwardedAria = aria;
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

  componentDidRender(): void {
    const root = this.host.shadowRoot;
    forwardDescription(
      this.host,
      root?.querySelector('button'),
      this.loading ? [...(root?.querySelectorAll('#loading-description') ?? [])] : [],
    );
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
    // The internal form runs the action after the native click dispatch finishes, as a native
    // submit button does; its role keeps it out of the accessibility tree.
    return (
      <form role="none" onSubmit={this.onFormAction} onReset={this.onFormAction}>
        <button
          part="base"
          class={`base action ${variant} ${size}${this.loading ? ' loading' : ''}`}
          type={type}
          disabled={this.isDisabled()}
          aria-label={label === '' ? undefined : label}
          aria-busy={this.loading ? 'true' : undefined}
          aria-disabled={this.loading ? 'true' : undefined}
          aria-describedby={this.loading ? 'loading-description' : undefined}
          {...this.forwardedAria}
          onClickCapture={this.onClick}
        >
          <span part="icon" class="icon" aria-hidden="true">
            <slot name="icon" />
          </span>
          {this.loading && (
            <span part="loader" class="loader" aria-hidden="true">
              <ui-loader size={size === 'large' ? 'medium' : 'small'} />
            </span>
          )}
          {this.loading && (
            <span id="loading-description" hidden>
              {this.loadingLabel ?? this.config.labels.iconButton.loading}
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
type _DeclaresEveryProp = Pick<UiIconButton, keyof IconButtonProps>;
