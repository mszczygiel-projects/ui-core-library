import type { UiCoreConfig } from '@mszczygiel-projects/ui-core-foundations/config';
import { getUiCoreConfig } from '@mszczygiel-projects/ui-core-foundations/config';
import { iconClose } from '@mszczygiel-projects/ui-core-icons';
import {
  drawer,
  type DrawerPlacement,
  type DrawerProps,
} from '@mszczygiel-projects/ui-core-shared/drawer';
import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import {
  Component,
  Element,
  Event,
  type EventEmitter,
  h,
  Prop,
  State,
  type VNode,
  Watch,
} from '@stencil/core';

import { followConfig } from '../internal/config.ts';
import { followAttribute } from '../internal/follow-attribute.ts';
import { type CloseRequest, Overlay } from '../internal/overlay.ts';
import type { OverlayOpenChange as OpenChange } from '../internal/overlay-events.ts';

const { options } = drawer;

/**
 * A modal panel at an edge of the window that holds secondary content, such as filters,
 * navigation or details.
 *
 * The page opens the drawer with `open`; it opens as a native modal dialog in the top layer at the
 * start or the end of the line, which follow the direction of the text, or at the bottom. The rest
 * of the page is inert and does not scroll. The focus moves to the element of the content marked
 * with `autofocus` or `data-autofocus`, else to its first focusable element, and returns where it
 * was when the drawer closes. Escape, a press on the backdrop, the close button, a form with
 * `method="dialog"` and a drag down of a bottom drawer close it: it dispatches `ui-open-change`
 * first, which an author may cancel to keep it open. Nothing visible names a drawer, so `label` or
 * an author's `aria-label` is required. The host belongs to the page: the component reflects only
 * `open` and writes no role or ARIA attribute on it.
 *
 * @slot - The content of the drawer, which scrolls when it is taller than the window.
 * @part base - The surface of the drawer, the native dialog element; its backdrop is `::backdrop`.
 * @part grabber - The handle a user drags a bottom drawer down by.
 * @part header - The row of the close button.
 * @part close - The button that closes the drawer.
 * @part body - The box of the content, which scrolls.
 */
@Component({
  tag: 'ui-drawer',
  styleUrls: ['../internal/overlay.css', 'drawer.css'],
  shadow: true,
})
export class UiDrawer implements DrawerProps {
  @Element() host!: HTMLUiDrawerElement;

  /**
   * Whether the drawer is open. The attribute follows the drawer, which closes on its own at the
   * request of the user.
   */
  @Prop({ mutable: true, reflect: true }) open = false;

  /** The edge the drawer sits at. */
  @Prop() placement: DrawerPlacement = 'end';

  /** The accessible name of the drawer, which nothing visible gives it. */
  @Prop() label?: string;

  /** Hides the close button. */
  @Prop() hideCloseButton = false;

  /** The name of the close button, falling back to `labels.drawer.close`. */
  @Prop() closeLabel?: string;

  /** Lets a user drag a bottom drawer down to close it. */
  @Prop() dragToDismiss = false;

  /**
   * The user asked the drawer to close. Cancel the event to keep the drawer open; the browser
   * may still close it after repeated presses of Escape, which cannot be cancelled.
   */
  @Event({ eventName: 'ui-open-change', cancelable: true }) openChange!: EventEmitter<OpenChange>;

  @State() private config: UiCoreConfig = getUiCoreConfig();

  @State() private authorLabel: string | null = null;

  @State() private dragging = false;

  private stopFollowing: (() => void)[] = [];

  private loaded = false;

  /** The value of the request that closes the modal, which the native dialog keeps. */
  private returnValue = '';

  private readonly overlay = new Overlay({
    dialog: () => this.element('dialog', HTMLDialogElement),
    content: () => {
      const slot = this.host.shadowRoot?.querySelector('slot');
      return slot instanceof HTMLSlotElement ? slot.assignedElements({ flatten: true }) : [];
    },
    closesOnBackdrop: () => true,
    dragHandles: () => {
      const grabber = this.element('.grabber', HTMLElement);
      const header = this.element('.header', HTMLElement);
      return grabber?.checkVisibility() === true ? [grabber, ...(header ? [header] : [])] : [];
    },
    dragExcluded: () => {
      const close = this.element('.close', HTMLElement);
      return close ? [close] : [];
    },
    onCloseRequest: (request) => this.closeRequested(request),
    onDragging: (dragging) => {
      this.dragging = dragging;
    },
  });

  connectedCallback(): void {
    this.stopFollowing = [
      followConfig((config) => {
        this.config = config;
      }),
      followAttribute(this.host, 'aria-label', (value) => {
        this.authorLabel = value;
      }),
    ];
    if (this.loaded && this.open) {
      this.overlay.show();
    }
  }

  componentDidLoad(): void {
    this.loaded = true;
    if (this.open) {
      this.overlay.show();
    }
  }

  disconnectedCallback(): void {
    for (const stop of this.stopFollowing) {
      stop();
    }
    this.stopFollowing = [];
    this.overlay.hide();
  }

  @Watch('open')
  protected openChanged(open: boolean): void {
    if (!this.loaded) {
      return;
    }
    if (open) {
      this.overlay.show();
    } else {
      this.overlay.hide(this.returnValue);
      this.returnValue = '';
    }
  }

  render(): VNode {
    const placement = oneOf(this.placement, options.placement.options, options.placement.default);
    const draggable = this.dragToDismiss && placement === 'bottom';
    const classes = ['overlay', 'drawer', 'base', placement, this.dragging ? 'dragging' : ''];
    return (
      <dialog
        part="base"
        class={classes.filter((name) => name !== '').join(' ')}
        tabIndex={-1}
        aria-label={this.authorLabel ?? this.label}
      >
        {draggable && <div part="grabber" class="grabber" aria-hidden="true" />}
        {!this.hideCloseButton && (
          <div part="header" class="header">
            <ui-icon-button
              part="close"
              class="close"
              variant="ghost"
              size="small"
              label={this.closeLabel ?? this.config.labels.drawer.close}
              onClick={this.onClose}
            >
              <span slot="icon" innerHTML={iconClose} />
            </ui-icon-button>
          </div>
        )}
        <div part="body" class="body">
          <slot />
        </div>
      </dialog>
    );
  }

  /** Dispatches the request, and closes the drawer unless the author cancelled it. */
  private closeRequested({ reason, returnValue, originalEvent, forced }: CloseRequest): boolean {
    if (!this.open) {
      return false;
    }
    const event = this.openChange.emit({ value: false, reason, returnValue, originalEvent });
    if (event.defaultPrevented && !forced) {
      return false;
    }
    this.returnValue = returnValue;
    this.open = false;
    return true;
  }

  private element<T extends Element>(selector: string, type: new () => T): T | null {
    const found = this.host.shadowRoot?.querySelector(selector);
    return found instanceof type ? found : null;
  }

  private readonly onClose = (event: MouseEvent): void => {
    this.closeRequested({
      reason: 'close-button',
      returnValue: '',
      originalEvent: event,
      forced: false,
    });
  };
}

/**
 * Every prop of the specification is a prop of the component. `implements` alone accepts a class
 * that leaves out an optional prop, so a prop added to the specification would go unnoticed.
 */
type _DeclaresEveryProp = Pick<UiDrawer, keyof DrawerProps>;
