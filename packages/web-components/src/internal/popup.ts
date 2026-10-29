import { autoUpdate, computePosition, flip, offset, shift, size } from '@floating-ui/dom';

/** What a field gives the controller of its popup. */
export interface PopupOptions {
  readonly host: () => HTMLElement;
  /** The element the popup aligns with and takes its width from. */
  readonly anchor: () => HTMLElement | null;
  /** The popup, an element with `popover="manual"` in the shadow root of the field. */
  readonly popup: () => HTMLElement | null;
  /** A pointer pressed outside the field and its popup, or the focus left both. */
  readonly onDismiss: (event: Event) => void;
}

/** Whether the browser puts a popover in the top layer. */
function supportsPopover(element: HTMLElement): boolean {
  return typeof element.showPopover === 'function';
}

/**
 * The popup of a field: in the top layer above every other content, including a modal dialog,
 * placed below its field or above it when the window has no room below, as wide as the field at
 * least, and no taller than the room in the window. A browser without the Popover API shows it in
 * fixed position instead, where an ancestor with a transform or a modal dialog can cover it.
 */
export class Popup {
  private stopUpdating?: () => void;

  private events?: AbortController;

  constructor(private readonly options: PopupOptions) {}

  get open(): boolean {
    return this.stopUpdating !== undefined;
  }

  show(): void {
    const anchor = this.options.anchor();
    const popup = this.options.popup();
    if (this.open || anchor === null || popup === null) {
      return;
    }
    if (supportsPopover(popup)) {
      if (!popup.matches(':popover-open')) {
        popup.showPopover();
      }
    } else {
      popup.hidden = false;
    }
    this.stopUpdating = autoUpdate(anchor, popup, () => {
      void this.place(anchor, popup);
    });
    this.events = new AbortController();
    const { signal } = this.events;
    const host = this.options.host();
    // Capture sees the press before a component inside the page stops it.
    document.addEventListener(
      'pointerdown',
      (event) => {
        if (!event.composedPath().includes(host)) {
          this.options.onDismiss(event);
        }
      },
      { capture: true, signal },
    );
    host.addEventListener(
      'focusout',
      (event) => {
        const next = event.relatedTarget;
        // A null target is a switch of window or a press on nothing focusable, which the pointer
        // handler decides; the popup stays open for a user who comes back.
        if (next instanceof Node && !host.contains(next) && !host.shadowRoot?.contains(next)) {
          this.options.onDismiss(event);
        }
      },
      { signal },
    );
  }

  hide(): void {
    this.stopUpdating?.();
    this.stopUpdating = undefined;
    this.events?.abort();
    this.events = undefined;
    const popup = this.options.popup();
    if (popup === null) {
      return;
    }
    if (supportsPopover(popup)) {
      if (popup.matches(':popover-open')) {
        popup.hidePopover();
      }
    } else {
      popup.hidden = true;
    }
  }

  private async place(anchor: HTMLElement, popup: HTMLElement): Promise<void> {
    // The offset is a token, which the popup holds as a private property.
    const gap = Number.parseFloat(getComputedStyle(popup).getPropertyValue('--_offset')) || 0;
    const { x, y } = await computePosition(anchor, popup, {
      strategy: 'fixed',
      placement: 'bottom-start',
      middleware: [
        offset(gap),
        flip({ padding: gap }),
        shift({ padding: gap }),
        size({
          padding: gap,
          apply({ availableHeight, rects }) {
            popup.style.setProperty('--_anchor-inline-size', `${String(rects.reference.width)}px`);
            popup.style.setProperty(
              '--_available-block-size',
              `${String(Math.max(availableHeight, 0))}px`,
            );
          },
        }),
      ],
    });
    // Floating UI places in physical coordinates, and aligns the start edge in either direction.
    popup.style.setProperty('left', `${String(x)}px`);
    popup.style.setProperty('top', `${String(y)}px`);
  }
}
