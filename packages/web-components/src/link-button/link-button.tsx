import {
  linkButton,
  type LinkButtonProps,
  type LinkButtonSize,
  type LinkButtonVariant,
} from '@mszczygiel-projects/ui-core-shared/link-button';
import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import { Component, Element, h, Prop, State, type VNode } from '@stencil/core';

import { cancelInactiveClick } from '../internal/action.ts';
import { followAttribute } from '../internal/follow-attribute.ts';
import { followForwardedAria, forwardDescription } from '../internal/forward-aria.ts';
import { hasAssignedContent } from '../internal/slots.ts';

const { options } = linkButton;

/**
 * Navigates to another page or resource while looking like a button.
 *
 * The native link inside the shadow root owns the accessible semantics and the navigation, so
 * opening it in a new tab or copying its address works as on any link. A disabled link has no
 * address, so no pointer, key or menu can follow it.
 *
 * @slot - The visible name of the link. Supply text or non-interactive content.
 * @slot leading-icon - A decorative icon before the name, in reading order.
 * @slot trailing-icon - A decorative icon after the name, in reading order.
 * @part base - The native link and its surface, border and focus ring.
 * @part content - The icons and label.
 * @part label - The visible name of the link.
 * @part leading-icon - The decorative leading icon container.
 * @part trailing-icon - The decorative trailing icon container.
 */
@Component({
  tag: 'ui-link-button',
  styleUrls: ['../internal/action.css', 'link-button.css'],
  shadow: { delegatesFocus: true },
})
export class UiLinkButton implements LinkButtonProps {
  @Element() host!: HTMLUiLinkButtonElement;

  /** The address to navigate to. A disabled link has none. */
  @Prop() href = '';

  /** The browsing context to open the address in, such as `_blank`. */
  @Prop() target?: string;

  /** The relationship to the linked resource, written as given. */
  @Prop() rel?: string;

  /** Downloads the resource instead of navigating, under the given file name when not empty. */
  @Prop() download?: string;

  /** The visual emphasis of the link. */
  @Prop() variant: LinkButtonVariant = 'primary';

  /** The size, which follows the density. */
  @Prop() size: LinkButtonSize = 'medium';

  /** Turns the link into text that cannot be focused or followed, by any pointer or key. */
  @Prop({ reflect: true }) disabled = false;

  /** An accessible name replacing the visible content. An author's `aria-label` wins. */
  @Prop() label?: string;

  /** The `aria-label` that the page wrote on the host. */
  @State() private authorLabel: string | null = null;

  /** Renders again when a Tooltip changes the elements that describe the host. */
  @State() private describedBy = 0;

  @State() private hasLeadingIcon = false;

  @State() private hasTrailingIcon = false;

  private stopFollowing: (() => void)[] = [];

  /** Follows the same native link as the pointer and the keyboard. */
  // eslint-disable-next-line stencil/own-methods-must-be-private -- the native activation of a link
  click(): void {
    const control = this.host.shadowRoot?.querySelector('a');
    if (control) {
      control.click();
    } else {
      // Before its first render the element has no link yet, and clicks as any element does.
      HTMLElement.prototype.click.call(this.host);
    }
  }

  connectedCallback(): void {
    this.stopFollowing = [
      followAttribute(this.host, 'aria-label', (value) => {
        this.authorLabel = value;
      }),
      // A link opens no popup, so it takes only the description of a tooltip.
      followForwardedAria(this.host, () => {
        this.describedBy += 1;
      }),
    ];
  }

  disconnectedCallback(): void {
    for (const stop of this.stopFollowing) {
      stop();
    }
    this.stopFollowing = [];
  }

  componentDidRender(): void {
    const root = this.host.shadowRoot;
    forwardDescription(this.host, root?.querySelector('a'), []);
  }

  render(): VNode {
    const variant = oneOf(this.variant, options.variant.options, options.variant.default);
    const size = oneOf(this.size, options.size.options, options.size.default);
    const label = this.authorLabel ?? this.label;
    const named = typeof label === 'string' && label !== '';
    const { disabled } = this;
    // Without a label, the label part names the link: aria-hidden in the shadow root does not
    // reach the icons slotted into it, so a name from all the content would include them. A link
    // without an address has no role of its own, so a disabled one states it.
    return (
      <a
        part="base"
        class={`base action ${variant} ${size}${disabled ? ' disabled' : ''}`}
        href={disabled ? undefined : this.href}
        target={disabled ? undefined : this.target}
        rel={disabled ? undefined : this.rel}
        download={disabled ? undefined : this.download}
        role={disabled ? 'link' : undefined}
        aria-disabled={disabled ? 'true' : undefined}
        aria-label={named ? label : undefined}
        aria-labelledby={named ? undefined : 'link-label'}
        onClickCapture={this.onClick}
      >
        <span part="content" class="content">
          <span part="leading-icon" class="icon" aria-hidden="true" hidden={!this.hasLeadingIcon}>
            <slot name="leading-icon" onSlotchange={this.onLeadingSlotChange} />
          </span>
          <span id="link-label" part="label" class="label">
            <slot />
          </span>
          <span part="trailing-icon" class="icon" aria-hidden="true" hidden={!this.hasTrailingIcon}>
            <slot name="trailing-icon" onSlotchange={this.onTrailingSlotChange} />
          </span>
        </span>
      </a>
    );
  }

  private readonly onLeadingSlotChange = (event: Event): void => {
    this.hasLeadingIcon = hasAssignedContent(event);
  };

  private readonly onTrailingSlotChange = (event: Event): void => {
    this.hasTrailingIcon = hasAssignedContent(event);
  };

  /** A disabled link fires no click, as a disabled button does. */
  private readonly onClick = (event: MouseEvent): void => {
    cancelInactiveClick(event, this.disabled);
  };
}

/**
 * Every prop of the specification is a prop of the component. `implements` alone accepts a class
 * that leaves out an optional prop, so a prop added to the specification would go unnoticed.
 */
type _DeclaresEveryProp = Pick<UiLinkButton, keyof LinkButtonProps>;
