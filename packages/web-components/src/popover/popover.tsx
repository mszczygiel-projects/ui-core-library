import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import {
  popover,
  type PopoverOpenChangeReason,
  type PopoverPlacement,
  type PopoverProps,
} from '@mszczygiel-projects/ui-core-shared/popover';
import { Component, Element, Event, type EventEmitter, h, Prop, type VNode } from '@stencil/core';

import { Popup } from '../internal/popup.ts';
import type { PopoverOpenChange } from './events.ts';

const { options } = popover;

/**
 * A panel that a button opens beside it, over the page, with content that the page around it can
 * still be used with.
 *
 * The element of the `trigger` slot, a button, opens and closes the panel, and carries
 * `aria-expanded` and `aria-haspopup`. The panel is a non-modal dialog in the top layer, on the
 * side that `placement` asks for or the opposite one when the window has no room. When a press on
 * the trigger opens it, the focus moves to the element marked with `autofocus` or `data-autofocus`,
 * else to the panel. Escape closes it and returns the focus to the trigger; a press outside and
 * the focus leaving close it too. Each request dispatches the cancelable `ui-open-change` first,
 * and the reflected `open` attribute follows the panel.
 *
 * @slot - The content of the panel.
 * @slot trigger - The button that opens the panel.
 * @part base - The wrapper of the trigger and the panel.
 * @part panel - The panel, with the role dialog.
 * @part arrow - The arrow that points at the middle of the trigger.
 */
@Component({
  tag: 'ui-popover',
  styleUrls: ['../internal/floating.css', 'popover.css'],
  shadow: true,
})
export class UiPopover implements PopoverProps {
  @Element() host!: HTMLUiPopoverElement;

  /** Whether the panel is open. The attribute supplies the initial state and follows the panel. */
  @Prop({ mutable: true, reflect: true }) open = false;

  /** The side of the trigger on which the panel opens. */
  @Prop() placement: PopoverPlacement = 'bottom';

  /** Shows an arrow that points at the middle of the trigger. */
  @Prop() showArrow = false;

  /** The accessible name of the panel, which nothing visible gives. */
  @Prop() label?: string;

  /** The user asked to open or close the panel; canceling it keeps the panel as it is. */
  @Event({ eventName: 'ui-open-change' }) openChange!: EventEmitter<PopoverOpenChange>;

  private trigger: HTMLElement | null = null;

  /** Moves the focus into the panel once it has rendered open. */
  private focusOnOpen = false;

  private readonly popup = new Popup({
    host: () => this.host,
    anchor: () => this.trigger,
    popup: () => this.panel(),
    placement: () => oneOf(this.placement, options.placement.options, options.placement.default),
    centred: true,
    arrow: () => this.host.shadowRoot?.querySelector<HTMLElement>('.arrow') ?? null,
    onDismiss: (event) => {
      this.request(false, event.type === 'pointerdown' ? 'outside' : 'focus-out', event);
    },
  });

  connectedCallback(): void {
    this.host.addEventListener('click', this.onClick);
    this.host.addEventListener('keydown', this.onKeyDown);
  }

  disconnectedCallback(): void {
    this.host.removeEventListener('click', this.onClick);
    this.host.removeEventListener('keydown', this.onKeyDown);
    this.popup.hide();
  }

  componentDidRender(): void {
    this.trigger?.setAttribute('aria-expanded', String(this.open));
    if (this.open) {
      this.popup.show();
      if (this.focusOnOpen) {
        this.focusOnOpen = false;
        const target = this.host.querySelector<HTMLElement>(
          ':scope > :not([slot]) [autofocus], :scope > :not([slot]) [data-autofocus], :scope > :not([slot])[autofocus], :scope > :not([slot])[data-autofocus]',
        );
        (target ?? this.panel())?.focus();
      }
    } else {
      this.popup.hide();
    }
  }

  render(): VNode {
    return (
      <span part="base" class="base">
        <slot name="trigger" onSlotchange={this.onTriggerChange} />
        <div
          part="panel"
          class="panel floating"
          popover="manual"
          hidden={typeof HTMLElement.prototype.showPopover !== 'function'}
          role="dialog"
          aria-label={this.label}
          tabindex={-1}
        >
          {this.showArrow && <span part="arrow" class="arrow" aria-hidden="true" />}
          <slot />
        </div>
      </span>
    );
  }

  private panel(): HTMLElement | null {
    return this.host.shadowRoot?.querySelector<HTMLElement>('.panel') ?? null;
  }

  /** Asks to open or close the panel, unless the page cancels the request. */
  private request(
    open: boolean,
    reason: PopoverOpenChangeReason,
    originalEvent: globalThis.Event,
  ): void {
    if (this.open === open) {
      return;
    }
    const event = this.openChange.emit({ value: open, reason, originalEvent });
    if (event.defaultPrevented) {
      return;
    }
    this.focusOnOpen = open && reason === 'trigger';
    const returnFocus = !open && reason === 'escape';
    this.open = open;
    if (returnFocus) {
      this.trigger?.focus();
    }
  }

  /** The first element of the trigger slot is the button, which names the panel it opens. */
  private readonly onTriggerChange = (event: globalThis.Event): void => {
    const slot = event.target;
    if (!(slot instanceof HTMLSlotElement)) {
      return;
    }
    const [element] = slot.assignedElements();
    if (this.trigger !== null && this.trigger !== element) {
      this.trigger.removeAttribute('aria-expanded');
      this.trigger.removeAttribute('aria-haspopup');
    }
    this.trigger = element instanceof HTMLElement ? element : null;
    this.trigger?.setAttribute('aria-haspopup', 'dialog');
    this.trigger?.setAttribute('aria-expanded', String(this.open));
  };

  private readonly onClick = (event: MouseEvent): void => {
    if (this.trigger !== null && event.composedPath().includes(this.trigger)) {
      this.request(!this.open, 'trigger', event);
    }
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.open) {
      // A popover inside a modal closes first, and the modal stays open.
      event.preventDefault();
      event.stopPropagation();
      this.request(false, 'escape', event);
    }
  };
}

/**
 * Every prop of the specification is a prop of the component. `implements` alone accepts a class
 * that leaves out an optional prop, so a prop added to the specification would go unnoticed.
 */
type _DeclaresEveryProp = Pick<UiPopover, keyof PopoverProps>;
