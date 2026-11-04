import {
  arrow,
  autoUpdate,
  computePosition,
  flip,
  offset,
  type Placement,
  shift,
  size,
} from '@floating-ui/dom';
import type { PopupPlacement } from '@mszczygiel-projects/ui-core-shared/popover';

/** What a field gives the controller of its popup. */
export interface PopupOptions {
  readonly host: () => HTMLElement;
  /** The element the popup aligns with and takes its width from. */
  readonly anchor: () => HTMLElement | null;
  /**
   * The popup, an element with `popover="manual"` in the shadow root of the field, or a `dialog`
   * for a modal popup.
   */
  readonly popup: () => HTMLElement | null;
  /**
   * A pointer pressed outside the field and its popup, or the focus left both. A modal popup is
   * dismissed by a click outside it instead, which the inert page never receives.
   */
  readonly onDismiss: (event: Event) => void;
  /**
   * A modal popup: a `dialog` shown with `showModal()`, which makes the rest of the page inert, so
   * that nothing outside it takes the focus or a press while it is open.
   */
  readonly modal?: boolean;
  /** The side of the anchor on which the popup opens, below it by default. */
  readonly placement?: () => PopupPlacement;
  /**
   * A popup beside a trigger, centred on it, instead of the popup of a field, which starts at the
   * start edge of the field and is at least as wide.
   */
  readonly centred?: boolean;
  /** An arrow inside the popup that points at the middle of the anchor. */
  readonly arrow?: () => HTMLElement | null;
}

/** Whether the browser puts a popover in the top layer. */
function supportsPopover(element: HTMLElement): boolean {
  return typeof element.showPopover === 'function';
}

/**
 * A popup in the top layer above every other content, including a modal dialog, on the side of its
 * anchor that its component asks for, or the opposite one when the window has no room, and no
 * taller than the room in the window. The popup of a field starts at the start edge of the field
 * and is at least as wide; a popup beside a trigger is centred on it. A browser without the
 * Popover API shows it in fixed position instead, where an ancestor with a transform or a modal
 * dialog can cover it.
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
    if (this.options.modal === true && popup instanceof HTMLDialogElement) {
      this.showModal(anchor, popup);
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
    if (popup instanceof HTMLDialogElement) {
      if (popup.open) {
        popup.close();
      }
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

  private showModal(anchor: HTMLElement, popup: HTMLDialogElement): void {
    if (!popup.open) {
      popup.showModal();
    }
    this.stopUpdating = autoUpdate(anchor, popup, () => {
      void this.place(anchor, popup);
    });
    this.events = new AbortController();
    // The backdrop of a modal dialog is the dialog itself, so a click on it outside its box is a
    // click outside the popup.
    popup.addEventListener(
      'click',
      (event) => {
        const box = popup.getBoundingClientRect();
        const outside =
          event.clientX < box.left ||
          event.clientX > box.right ||
          event.clientY < box.top ||
          event.clientY > box.bottom;
        if (event.target === popup && outside) {
          this.options.onDismiss(event);
        }
      },
      { signal: this.events.signal },
    );
  }

  private async place(anchor: HTMLElement, popup: HTMLElement): Promise<void> {
    await placePopup(anchor, popup, {
      placement: this.options.placement?.() ?? 'bottom',
      centred: this.options.centred === true,
      arrow: this.options.arrow?.() ?? null,
    });
  }
}

/** The physical side of a logical placement, in the direction of the anchor's text. */
function physicalPlacement(
  anchor: HTMLElement,
  placement: PopupPlacement,
  centred: boolean,
): Placement {
  const rtl = getComputedStyle(anchor).direction === 'rtl';
  const side =
    placement === 'start'
      ? rtl
        ? 'right'
        : 'left'
      : placement === 'end'
        ? rtl
          ? 'left'
          : 'right'
        : placement;
  // Floating UI aligns a start in the direction of the text on its own.
  return centred ? side : `${side}-start`;
}

/** A length token in CSS pixels; a rem resolves against the font size of the root. */
function pixels(value: string): number {
  const amount = Number.parseFloat(value);
  if (Number.isNaN(amount)) {
    return 0;
  }
  return value.trim().endsWith('rem')
    ? amount * Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
    : amount;
}

/**
 * Places a popup in fixed position beside its anchor, and its arrow on the edge that faces the
 * anchor. The physical side ends up in `data-side`, so that the styles turn the arrow.
 */
export async function placePopup(
  anchor: HTMLElement,
  popup: HTMLElement,
  {
    placement,
    centred,
    arrow: arrowElement,
  }: { placement: PopupPlacement; centred: boolean; arrow: HTMLElement | null },
): Promise<void> {
  // The offset and the arrow are tokens, which the popup holds as private properties.
  const style = getComputedStyle(popup);
  const gap = pixels(style.getPropertyValue('--_offset'));
  const arrowSize = arrowElement === null ? 0 : pixels(style.getPropertyValue('--_arrow-size'));
  const result = await computePosition(anchor, popup, {
    strategy: 'fixed',
    placement: physicalPlacement(anchor, placement, centred),
    middleware: [
      // The arrow is a square turned by 45°, so half its diagonal stands out of the popup.
      offset(gap + (arrowSize * Math.SQRT2) / 2),
      flip({ padding: gap }),
      // A list stays aligned with its field; a centred popup keeps its distance from the edge.
      shift({ padding: centred ? gap : 0 }),
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
      ...(arrowElement === null ? [] : [arrow({ element: arrowElement, padding: arrowSize })]),
    ],
  });
  // Floating UI places in physical coordinates.
  popup.style.setProperty('left', `${String(result.x)}px`);
  popup.style.setProperty('top', `${String(result.y)}px`);
  const [side = 'bottom'] = result.placement.split('-');
  popup.dataset['side'] = side;
  const point = result.middlewareData.arrow;
  if (arrowElement !== null && point !== undefined) {
    // The arrow sits across the edge that faces the trigger, its middle on the outer line of the
    // border; Floating UI gives the position along that edge.
    const facing = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }[side] ?? 'top';
    for (const edge of ['top', 'right', 'bottom', 'left']) {
      arrowElement.style.setProperty(edge, '');
    }
    arrowElement.style.setProperty('left', point.x === undefined ? '' : `${String(point.x)}px`);
    arrowElement.style.setProperty('top', point.y === undefined ? '' : `${String(point.y)}px`);
    arrowElement.style.setProperty(facing, 'calc(var(--_arrow-size) / -2 - var(--_border-width))');
  }
}
