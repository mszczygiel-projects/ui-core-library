import type { UiCoreConfig } from '@mszczygiel-projects/ui-core-foundations/config';
import { getUiCoreConfig } from '@mszczygiel-projects/ui-core-foundations/config';
import { iconClose } from '@mszczygiel-projects/ui-core-icons';
import {
  dialog,
  type DialogProps,
  type DialogSize,
} from '@mszczygiel-projects/ui-core-shared/dialog';
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
import { hasAssignedContent } from '../internal/slots.ts';

const { options } = dialog;

declare global {
  interface HTMLElementEventMap {
    'ui-open-change': CustomEvent<OpenChange>;
  }
}

/**
 * A modal window over the page that asks the user to read, decide or enter something before going
 * on.
 *
 * The page opens the dialog with `open`; it opens as a native modal dialog in the top layer, makes
 * the rest of the page inert and stops it from scrolling. The focus moves to the element of the
 * content marked with `autofocus` or `data-autofocus`, else to its first focusable element, and
 * returns where it was when the dialog closes. Escape, a press on the backdrop (except for an
 * alert), the close button, a form with `method="dialog"` and a drag down of a sheet close the
 * dialog: it dispatches `ui-open-change` first, which an author may cancel to keep it open. Below
 * the breakpoint it rises from the bottom of the window as a sheet. The heading names the dialog,
 * and the description describes it; without a heading, `label` or an author's `aria-label` names
 * it. The host belongs to the page: the component reflects only `open` and writes no role or ARIA
 * attribute on it.
 *
 * @slot - The content of the dialog, which scrolls when it is taller than the window.
 * @slot footer - The actions of the dialog, such as buttons.
 * @part base - The surface of the dialog, the native dialog element; its backdrop is `::backdrop`.
 * @part grabber - The handle a user drags the sheet down by.
 * @part header - The row of the heading, the description and the close button.
 * @part heading - The heading.
 * @part description - The text below the heading.
 * @part close - The button that closes the dialog.
 * @part body - The box of the content, which scrolls.
 * @part footer - The box of the actions.
 */
@Component({
  tag: 'ui-dialog',
  styleUrls: ['../internal/overlay.css', 'dialog.css'],
  shadow: true,
})
export class UiDialog implements DialogProps {
  @Element() host!: HTMLUiDialogElement;

  /**
   * Whether the dialog is open. The attribute follows the dialog, which closes on its own at the
   * request of the user.
   */
  @Prop({ mutable: true, reflect: true }) open = false;

  /** The width of the window, or the whole window. */
  @Prop() size: DialogSize = 'medium';

  /** Makes the dialog an alert dialog, which a press on the backdrop does not close. */
  @Prop() alert = false;

  /** The heading, which names the dialog. */
  @Prop() heading?: string;

  /** The text below the heading, which describes the dialog. */
  @Prop() description?: string;

  /** The accessible name of a dialog without a heading. */
  @Prop() label?: string;

  /** Hides the close button. */
  @Prop() hideCloseButton = false;

  /** The name of the close button, falling back to `labels.dialog.close`. */
  @Prop() closeLabel?: string;

  /** Lets a user drag the sheet down to close it, below the breakpoint. */
  @Prop() dragToDismiss = false;

  /**
   * The user asked the dialog to close. Cancel the event to keep the dialog open; the browser
   * may still close it after repeated presses of Escape, which cannot be cancelled.
   */
  @Event({ eventName: 'ui-open-change', cancelable: true }) openChange!: EventEmitter<OpenChange>;

  @State() private config: UiCoreConfig = getUiCoreConfig();

  @State() private authorLabel: string | null = null;

  @State() private hasFooter = false;

  @State() private scrolledFromStart = false;

  @State() private scrolledToEnd = true;

  @State() private dragging = false;

  private stopFollowing: (() => void)[] = [];

  private loaded = false;

  /** The value of the request that closes the modal, which the native dialog keeps. */
  private returnValue = '';

  private readonly edges = new ResizeObserver(() => {
    this.measureEdges();
  });

  private readonly overlay = new Overlay({
    dialog: () => this.element('dialog', HTMLDialogElement),
    content: () => [
      ...this.slotElements('slot:not([name])'),
      ...this.slotElements('slot[name="footer"]'),
    ],
    closesOnBackdrop: () => !this.alert,
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
    const body = this.element('.body', HTMLElement);
    if (body !== null) {
      this.edges.observe(body);
    }
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
      this.measureEdges();
    } else {
      this.overlay.hide(this.returnValue);
      this.returnValue = '';
    }
  }

  render(): VNode {
    const size = oneOf(this.size, options.size.options, options.size.default);
    const hasHeading = this.heading !== undefined && this.heading !== '';
    const hasDescription = this.description !== undefined && this.description !== '';
    const classes = [
      'overlay',
      'dialog',
      'base',
      size,
      this.scrolledFromStart ? 'scrolled-from-start' : '',
      this.scrolledToEnd ? '' : 'scrolled-before-end',
      this.dragging ? 'dragging' : '',
    ];
    return (
      <dialog
        part="base"
        class={classes.filter((name) => name !== '').join(' ')}
        role={this.alert ? 'alertdialog' : undefined}
        tabIndex={-1}
        aria-labelledby={hasHeading && this.authorLabel === null ? 'heading' : undefined}
        aria-label={this.authorLabel ?? (hasHeading ? undefined : this.label)}
        aria-describedby={hasDescription ? 'description' : undefined}
      >
        {this.dragToDismiss && <div part="grabber" class="grabber" aria-hidden="true" />}
        <div
          part="header"
          class="header"
          hidden={!hasHeading && !hasDescription && this.hideCloseButton}
        >
          <div class="titles">
            <h2 id="heading" part="heading" class="heading" hidden={!hasHeading}>
              {this.heading}
            </h2>
            <p id="description" part="description" class="description" hidden={!hasDescription}>
              {this.description}
            </p>
          </div>
          {!this.hideCloseButton && (
            <ui-icon-button
              part="close"
              class="close"
              variant="ghost"
              size="small"
              label={this.closeLabel ?? this.config.labels.dialog.close}
              onClick={this.onClose}
            >
              <span slot="icon" innerHTML={iconClose} />
            </ui-icon-button>
          )}
        </div>
        <div part="body" class="body" onScroll={this.onScroll}>
          <slot />
        </div>
        <div part="footer" class="footer" hidden={!this.hasFooter}>
          <slot name="footer" onSlotchange={this.onFooterChange} />
        </div>
      </dialog>
    );
  }

  /** Dispatches the request, and closes the dialog unless the author cancelled it. */
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

  private slotElements(selector: string): Element[] {
    const slot = this.host.shadowRoot?.querySelector(selector);
    return slot instanceof HTMLSlotElement ? slot.assignedElements({ flatten: true }) : [];
  }

  /** The separators show where the content runs on under the header or the footer. */
  private measureEdges(): void {
    const body = this.element('.body', HTMLElement);
    if (body === null) {
      return;
    }
    this.scrolledFromStart = body.scrollTop > 0;
    this.scrolledToEnd = body.scrollTop + body.clientHeight >= body.scrollHeight - 1;
  }

  private readonly onScroll = (): void => {
    this.measureEdges();
  };

  private readonly onFooterChange = (event: Event): void => {
    this.hasFooter = hasAssignedContent(event);
  };

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
type _DeclaresEveryProp = Pick<UiDialog, keyof DialogProps>;
