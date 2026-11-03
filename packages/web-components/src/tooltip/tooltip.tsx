import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import {
  tooltip,
  type TooltipPlacement,
  type TooltipProps,
} from '@mszczygiel-projects/ui-core-shared/tooltip';
import {
  hideTooltip,
  opensAtOnce,
  showTooltip,
} from '@mszczygiel-projects/ui-core-shared/tooltip-group';
import { Component, Element, h, Prop, State, type VNode, Watch } from '@stencil/core';

import { reflectsDescription } from '../internal/forward-aria.ts';
import { Popup } from '../internal/popup.ts';

const { options } = tooltip;

/** The duration of a token in milliseconds, which the bubble holds as a private property. */
function duration(element: Element | null, property: string): number {
  if (element === null) {
    return 0;
  }
  const value = getComputedStyle(element).getPropertyValue(property).trim();
  const amount = Number.parseFloat(value);
  if (Number.isNaN(amount)) {
    return 0;
  }
  return value.endsWith('ms') ? amount : value.endsWith('s') ? amount * 1000 : amount;
}

/** The focused element, inside the shadow roots too. */
function deepActiveElement(): Element | null {
  let element = document.activeElement;
  while (element?.shadowRoot?.activeElement) {
    element = element.shadowRoot.activeElement;
  }
  return element;
}

/**
 * A short text that names or describes an element while the pointer rests on it or the keyboard
 * focuses it.
 *
 * The first element of the default slot is the trigger, which the text describes. The bubble shows
 * after a delay when a mouse rests on the trigger, at once when the keyboard focuses it, and at
 * once while another tooltip of the page is shown or has just hidden. It stays while the pointer
 * moves onto it, and hides when the pointer leaves both, when the focus leaves, on a press and on
 * Escape, which no modal around it then sees. The bubble opens in the top layer, on the side that
 * `placement` asks for or the opposite one when the window has no room. Touch shows nothing, so the
 * text must not be the only way to a piece of information.
 *
 * @slot - The trigger, an element that takes the focus, such as a button.
 * @slot content - Taken by the tooltip, which places the text of `content` there, in the tree of
 *   its trigger, so that the trigger can refer to it.
 * @part base - The wrapper of the trigger and the bubble.
 * @part bubble - The bubble.
 * @part arrow - The arrow that points at the middle of the trigger.
 */
@Component({
  tag: 'ui-tooltip',
  styleUrls: ['../internal/floating.css', 'tooltip.css'],
  shadow: true,
})
export class UiTooltip implements TooltipProps {
  @Element() host!: HTMLUiTooltipElement;

  /** The text of the tooltip, which describes its trigger. */
  @Prop() content?: string;

  /** The side of the trigger on which the tooltip opens. */
  @Prop() placement: TooltipPlacement = 'top';

  /** Shows an arrow that points at the middle of the trigger. */
  @Prop() showArrow = false;

  @State() private shown = false;

  private trigger: HTMLElement | null = null;

  /**
   * The text, in the light DOM of the host and slotted into the bubble, so that the trigger can
   * reference it: an element reference cannot reach into a shadow root.
   */
  private readonly text = document.createElement('span');

  private timer: ReturnType<typeof setTimeout> | undefined;

  private events?: AbortController;

  private readonly popup = new Popup({
    host: () => this.host,
    anchor: () => this.trigger,
    popup: () => this.bubble(),
    placement: () => oneOf(this.placement, options.placement.options, options.placement.default),
    centred: true,
    arrow: () => this.host.shadowRoot?.querySelector<HTMLElement>('.arrow') ?? null,
    onDismiss: () => {
      this.hide();
    },
  });

  @Watch('content')
  protected contentChanged(): void {
    this.text.textContent = this.content ?? '';
  }

  connectedCallback(): void {
    this.text.slot = 'content';
    this.text.setAttribute('role', 'tooltip');
    this.text.textContent = this.content ?? '';
    if (this.text.parentNode !== this.host) {
      this.host.append(this.text);
    }
    this.events = new AbortController();
    const { signal } = this.events;
    this.host.addEventListener('pointerover', this.onPointerOver, { signal });
    this.host.addEventListener('pointerout', this.onPointerOut, { signal });
    this.host.addEventListener('pointerdown', this.onPointerDown, { signal });
    this.host.addEventListener('focusin', this.onFocusIn, { signal });
    this.host.addEventListener('focusout', this.onFocusOut, { signal });
    this.describe(this.trigger);
  }

  disconnectedCallback(): void {
    this.events?.abort();
    this.events = undefined;
    clearTimeout(this.timer);
    this.hide();
    this.undescribe(this.trigger);
  }

  componentDidRender(): void {
    if (this.shown) {
      this.popup.show();
    } else {
      this.popup.hide();
    }
  }

  render(): VNode {
    return (
      <span part="base" class="base">
        <slot onSlotchange={this.onTriggerChange} />
        <div
          part="bubble"
          class="bubble floating"
          popover="manual"
          hidden={typeof HTMLElement.prototype.showPopover !== 'function'}
        >
          {this.showArrow && <span part="arrow" class="arrow" aria-hidden="true" />}
          <slot name="content" />
        </div>
      </span>
    );
  }

  private bubble(): HTMLElement | null {
    return this.host.shadowRoot?.querySelector<HTMLElement>('.bubble') ?? null;
  }

  private show(): void {
    clearTimeout(this.timer);
    if (this.shown || (this.content ?? '') === '') {
      return;
    }
    this.shown = true;
    showTooltip(this, () => {
      this.hide();
    });
    document.addEventListener('keydown', this.onEscape, { capture: true });
  }

  private hide(): void {
    clearTimeout(this.timer);
    if (!this.shown) {
      return;
    }
    this.shown = false;
    hideTooltip(this, performance.now());
    document.removeEventListener('keydown', this.onEscape, { capture: true });
  }

  /** Shows after the delay of the tokens, unless another tooltip has just shown. */
  private showLater(): void {
    clearTimeout(this.timer);
    const delay = duration(this.bubble(), '--_show-delay');
    if (opensAtOnce(performance.now(), delay)) {
      this.show();
      return;
    }
    this.timer = setTimeout(() => {
      this.show();
    }, delay);
  }

  private hideLater(): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(
      () => {
        this.hide();
      },
      duration(this.bubble(), '--_hide-delay'),
    );
  }

  // Element reflection crosses the shadow root of an action to the text; a browser without it
  // leaves the trigger without its description, and the bubble still shows the text.
  private describe(trigger: HTMLElement | null): void {
    if (trigger !== null && reflectsDescription(trigger)) {
      trigger.ariaDescribedByElements = [this.text];
    }
  }

  private undescribe(trigger: HTMLElement | null): void {
    if (trigger !== null && reflectsDescription(trigger)) {
      trigger.ariaDescribedByElements = null;
    }
  }

  private readonly onTriggerChange = (event: globalThis.Event): void => {
    const slot = event.target;
    if (!(slot instanceof HTMLSlotElement)) {
      return;
    }
    const [element] = slot.assignedElements();
    const next = element instanceof HTMLElement ? element : null;
    if (next !== this.trigger) {
      this.undescribe(this.trigger);
      this.trigger = next;
      this.describe(next);
    }
  };

  private readonly onPointerOver = (event: PointerEvent): void => {
    // Touch has no hover, and a press on the trigger is its own action.
    if (event.pointerType !== 'mouse') {
      return;
    }
    if (this.shown) {
      clearTimeout(this.timer);
      return;
    }
    if (this.trigger !== null && event.composedPath().includes(this.trigger)) {
      this.showLater();
    }
  };

  private readonly onPointerOut = (event: PointerEvent): void => {
    const next = event.relatedTarget;
    // The pointer moves between the trigger and the bubble, both inside the host.
    if (
      next instanceof Node &&
      (this.host.contains(next) || this.host.shadowRoot?.contains(next))
    ) {
      return;
    }
    if (this.shown) {
      this.hideLater();
    } else {
      clearTimeout(this.timer);
    }
  };

  private readonly onPointerDown = (): void => {
    this.hide();
  };

  private readonly onFocusIn = (): void => {
    // The keyboard shows the tooltip at once; a press that focuses the trigger shows nothing.
    if (deepActiveElement()?.matches(':focus-visible') === true) {
      this.show();
    }
  };

  private readonly onFocusOut = (event: FocusEvent): void => {
    const next = event.relatedTarget;
    if (!(next instanceof Node && this.host.contains(next))) {
      this.hide();
    }
  };

  private readonly onEscape = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.shown) {
      // The tooltip closes first; a modal around it stays open.
      event.preventDefault();
      event.stopPropagation();
      this.hide();
    }
  };
}

/**
 * Every prop of the specification is a prop of the component. `implements` alone accepts a class
 * that leaves out an optional prop, so a prop added to the specification would go unnoticed.
 */
type _DeclaresEveryProp = Pick<UiTooltip, keyof TooltipProps>;
