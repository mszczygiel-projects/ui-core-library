import type { UiCoreConfig } from '@mszczygiel-projects/ui-core-foundations/config';
import { getUiCoreConfig } from '@mszczygiel-projects/ui-core-foundations/config';
import { iconChevronDown } from '@mszczygiel-projects/ui-core-icons';
import type {
  ButtonShape,
  ButtonSize,
  ButtonType,
  ButtonVariant,
} from '@mszczygiel-projects/ui-core-shared/button';
import {
  firstEnabled,
  flattenOptions,
} from '@mszczygiel-projects/ui-core-shared/listbox-navigation';
import type { MenuItems } from '@mszczygiel-projects/ui-core-shared/menu';
import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import {
  splitButton,
  type SplitButtonProps,
} from '@mszczygiel-projects/ui-core-shared/split-button';
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

import { cancelInactiveClick, runFormAction, setState } from '../internal/action.ts';
import { followConfig } from '../internal/config.ts';
import { followAttribute } from '../internal/follow-attribute.ts';
import type { FormAssociated } from '../internal/form-associated.ts';
import { forwardDescription } from '../internal/forward-aria.ts';
import { hasAssignedContent } from '../internal/slots.ts';
import type { MenuAction, MenuOpenChange } from '../menu/events.ts';
import type { SplitButtonAction, SplitButtonOpenChange } from './events.ts';

const { options } = splitButton;

// HTMLElement is repeated because the first build runs before Stencil declares the element.
declare global {
  interface HTMLUiSplitButtonElement extends HTMLElement, FormAssociated {
    /** Activates the native main button, as the pointer and the keyboard do. */
    click(): void;
  }
}

/**
 * Triggers a main action, with a button beside it that opens a menu of related actions.
 *
 * The main action is a native button inside the shadow root, which takes part in the outer form
 * through ElementInternals as Button does. The native click of the host is the main action alone:
 * a press on the menu button or on an action of the menu stays inside the component. The menu
 * button carries `aria-haspopup="menu"` and `aria-expanded`, and opens a Menu at its end edge,
 * which reports a pick as `ui-action`. Disabled and loading states block both halves; without an
 * enabled action, the menu button is disabled.
 *
 * @slot - The visible name of the main action. Supply text or non-interactive content.
 * @slot leading-icon - A decorative icon before the action name, in reading order.
 * @slot trailing-icon - A decorative icon after the action name, in reading order.
 * @part base - The group of both halves.
 * @part action - The native main button and its surface, border and focus ring.
 * @part wrapper - The content and the centred loading indicator.
 * @part content - The icons and label, kept in the layout while loading.
 * @part label - The visible action name.
 * @part leading-icon - The decorative leading icon container.
 * @part trailing-icon - The decorative trailing icon container.
 * @part loader - The decorative loading indicator container.
 * @part divider - The rule between the halves.
 * @part toggle - The native button that opens the menu.
 * @part toggle-icon - The decorative arrow of the menu button.
 */
@Component({
  tag: 'ui-split-button',
  styleUrls: ['../internal/action.css', '../button/button.css', 'split-button.css'],
  shadow: { delegatesFocus: true },
  formAssociated: true,
})
export class UiSplitButton implements SplitButtonProps<string>, FormAssociated {
  @Element() host!: HTMLUiSplitButtonElement;

  @AttachInternals() internals!: ElementInternals;

  /** The visual emphasis of both halves. */
  @Prop() variant: ButtonVariant = 'primary';

  /** The size of both halves and of the menu, which follows the density. */
  @Prop() size: ButtonSize = 'medium';

  /** The corners of both halves. */
  @Prop() shape: ButtonShape = 'square';

  /** Disables both halves and removes them from keyboard navigation. */
  @Prop({ reflect: true }) disabled = false;

  /** Blocks both halves while keeping focus, width and the accessible names. */
  @Prop() loading = false;

  /** The native form action of the main button; an ordinary action does not submit. */
  @Prop() type: ButtonType = 'button';

  /** The name of the form entry, submitted only when the main button submits. */
  @Prop({ reflect: true }) name?: string;

  /** The value submitted with the name; it identifies the action and is not edited. */
  @Prop() value = '';

  /** An accessible name of the main action replacing its visible content. An author's `aria-label` wins. */
  @Prop() label?: string;

  /** The description of the loading state, falling back to `labels.splitButton.loading`. */
  @Prop() loadingLabel?: string;

  /** Whether the menu is open. The attribute supplies the initial state and follows the menu. */
  @Prop({ mutable: true, reflect: true }) open = false;

  /**
   * The related actions of the menu, alone or in groups that a rule separates. An icon is the SVG
   * string of an icon of the icon package.
   */
  @Prop() options: MenuItems<string> = [];

  /** The name of the menu button and its menu, falling back to `labels.splitButton.menu`. */
  @Prop() menuLabel?: string;

  /** The user asked to open or close the menu; canceling it keeps the menu as it is. */
  @Event({ eventName: 'ui-open-change' }) openChange!: EventEmitter<SplitButtonOpenChange>;

  /** The user picked an action of the menu. */
  @Event({ eventName: 'ui-action' }) action!: EventEmitter<SplitButtonAction>;

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

  /** Native validity; an action adds no constraint. */
  get validity(): ValidityState {
    return this.internals.validity;
  }

  /** The browser's validation message, empty for an action without a constraint. */
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

  /** Activates the native main button, as the pointer and the keyboard do. */
  // eslint-disable-next-line stencil/own-methods-must-be-private -- the native activation of a button
  click(): void {
    const control = this.mainButton();
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
    // A menu of an action that stops being available closes with it, as setting open does.
    if (this.open && !this.menuAvailable()) {
      this.open = false;
    }
  }

  componentDidRender(): void {
    const root = this.host.shadowRoot;
    forwardDescription(
      this.host,
      this.mainButton(),
      this.loading ? [...(root?.querySelectorAll('#loading-description') ?? [])] : [],
    );
  }

  render(): VNode {
    const variant = oneOf(this.variant, options.variant.options, options.variant.default);
    const size = oneOf(this.size, options.size.options, options.size.default);
    const shape = oneOf(this.shape, options.shape.options, options.shape.default);
    const type = oneOf(this.type, options.type.options, options.type.default);
    const disabled = this.isDisabled();
    const label = this.authorLabel ?? this.label;
    const named = typeof label === 'string' && label !== '';
    const loading = this.loading ? ' loading' : '';
    const surface = `action ${variant} ${size} ${shape}${loading}`;
    const toggleDisabled = disabled || !this.hasEnabledAction();
    // The internal form runs the action of the main button after the native click dispatch
    // finishes, as Button does; its role keeps it out of the accessibility tree.
    return (
      <form role="none" onSubmit={this.onFormAction} onReset={this.onFormAction}>
        <span
          part="base"
          class={`group ${variant}${disabled ? ' disabled' : ''}`}
          role="group"
          onClick={this.onGroupClick}
        >
          <button
            part="action"
            class={`main ${surface}`}
            type={type}
            disabled={disabled}
            aria-label={named ? label : undefined}
            aria-labelledby={named ? undefined : 'action-label'}
            aria-busy={this.loading ? 'true' : undefined}
            aria-disabled={this.loading ? 'true' : undefined}
            aria-describedby={this.loading ? 'loading-description' : undefined}
            onClickCapture={this.onMainClick}
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
                {this.loadingLabel ?? this.config.labels.splitButton.loading}
              </span>
            )}
          </button>
          <span part="divider" class="divider" aria-hidden="true" />
          <ui-menu
            class="menu"
            open={this.open}
            options={this.options}
            size={size}
            placement="bottom"
            align="end"
            onUi-open-change={this.onMenuOpenChange}
            onUi-action={this.onMenuAction}
          >
            <button
              slot="trigger"
              part="toggle"
              class={`toggle ${surface}`}
              type="button"
              disabled={toggleDisabled}
              aria-label={this.menuLabel ?? this.config.labels.splitButton.menu}
              aria-disabled={this.loading && !toggleDisabled ? 'true' : undefined}
              onClickCapture={this.onToggleClick}
            >
              <span
                part="toggle-icon"
                class="toggle-icon"
                aria-hidden="true"
                innerHTML={iconChevronDown}
              />
            </button>
          </ui-menu>
        </span>
      </form>
    );
  }

  private mainButton(): HTMLButtonElement | null {
    return this.host.shadowRoot?.querySelector<HTMLButtonElement>('button.main') ?? null;
  }

  /** Disabled directly or by the owning fieldset. */
  private isDisabled(): boolean {
    return this.disabled || this.formDisabled;
  }

  private hasEnabledAction(): boolean {
    return firstEnabled(flattenOptions(this.options)) !== undefined;
  }

  /** Whether the menu can open: the component is active and has an action to pick. */
  private menuAvailable(): boolean {
    return !this.isDisabled() && !this.loading && this.hasEnabledAction();
  }

  private readonly onLeadingSlotChange = (event: globalThis.Event): void => {
    this.hasLeadingIcon = hasAssignedContent(event);
  };

  private readonly onTrailingSlotChange = (event: globalThis.Event): void => {
    this.hasTrailingIcon = hasAssignedContent(event);
  };

  /** Cancels a click on a disabled or loading main button where it starts, as Button does. */
  private readonly onMainClick = (event: MouseEvent): void => {
    cancelInactiveClick(event, this.isDisabled() || this.loading);
  };

  /** A loading menu button keeps its focus and its name, and a press on it does nothing. */
  private readonly onToggleClick = (event: MouseEvent): void => {
    cancelInactiveClick(event, !this.menuAvailable());
  };

  /**
   * Keeps a press on the menu button or on an action of the menu inside the component, so that
   * the native click of the host is the main action alone.
   */
  private readonly onGroupClick = (event: MouseEvent): void => {
    const main = this.mainButton();
    if (main === null || !event.composedPath().includes(main)) {
      event.stopPropagation();
    }
  };

  /** Passes the request of the menu on as the request of the component, which a page may cancel. */
  private readonly onMenuOpenChange = (event: CustomEvent<MenuOpenChange>): void => {
    event.stopPropagation();
    const { value, reason, originalEvent } = event.detail;
    if (value && !this.menuAvailable()) {
      event.preventDefault();
      return;
    }
    const own = this.openChange.emit({ value, reason, originalEvent });
    if (own.defaultPrevented) {
      event.preventDefault();
      return;
    }
    this.open = value;
  };

  private readonly onMenuAction = (event: CustomEvent<MenuAction>): void => {
    event.stopPropagation();
    this.action.emit(event.detail);
  };

  private readonly onFormAction = (event: globalThis.Event): void => {
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
type _DeclaresEveryProp = Pick<UiSplitButton, keyof SplitButtonProps>;
