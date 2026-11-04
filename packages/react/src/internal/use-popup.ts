'use client';

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
import { type RefObject, useEffect, useLayoutEffect, useRef } from 'react';

/** The layout effect of the browser, which a server render skips without a warning. */
const useBrowserLayoutEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect;

/**
 * A popup while it is open: in the top layer above every other content, including a modal dialog,
 * on the side of its anchor that `placement` asks for, below it by default, or the opposite one
 * when the window has no room, and no taller than the room in the window. The popup of a field
 * starts at the start edge of the field and is at least as wide; a `centred` popup beside a
 * trigger is centred on it, and its `arrow` points at the middle of the trigger. A browser without
 * the Popover API shows it in fixed position instead. A press of the pointer outside `root` and
 * the popup, or the focus leaving `root`, calls `onDismiss`. A `modal` popup is a `dialog` shown
 * with `showModal()`, which makes the rest of the page inert; a click outside it calls `onDismiss`.
 */
export function usePopup({
  open,
  root,
  anchor,
  popup,
  onDismiss,
  placement = 'bottom',
  centred = false,
  arrow: arrowRef,
  modal = false,
}: {
  readonly open: boolean;
  readonly root: RefObject<HTMLElement | null>;
  readonly anchor: RefObject<HTMLElement | null>;
  readonly popup: RefObject<HTMLElement | null>;
  readonly onDismiss: (event: Event) => void;
  readonly placement?: PopupPlacement;
  readonly centred?: boolean;
  readonly arrow?: RefObject<HTMLElement | null>;
  readonly modal?: boolean;
}): void {
  const dismiss = useRef(onDismiss);
  useBrowserLayoutEffect(() => {
    dismiss.current = onDismiss;
  });

  useBrowserLayoutEffect(() => {
    const reference = anchor.current;
    const floating = popup.current;
    const container = root.current;
    if (modal && floating instanceof HTMLDialogElement) {
      if (!open || reference === null) {
        return;
      }
      if (!floating.open) {
        floating.showModal();
      }
      const stopModal = autoUpdate(reference, floating, () => {
        void placePopup(reference, floating, { placement, centred, arrow: null });
      });
      const modalEvents = new AbortController();
      // The backdrop of a modal dialog is the dialog itself, so a click on it outside its box is a
      // click outside the popup.
      floating.addEventListener(
        'click',
        (event) => {
          const box = floating.getBoundingClientRect();
          const outside =
            event.clientX < box.left ||
            event.clientX > box.right ||
            event.clientY < box.top ||
            event.clientY > box.bottom;
          if (event.target === floating && outside) {
            dismiss.current(event);
          }
        },
        { signal: modalEvents.signal },
      );
      return () => {
        stopModal();
        modalEvents.abort();
        if (floating.open) {
          floating.close();
        }
      };
    }
    // Without the Popover API, nothing but `hidden` keeps a closed popup out of sight.
    const native = floating !== null && typeof floating.showPopover === 'function';
    if (floating !== null && !native) {
      floating.hidden = !open;
    }
    if (!open || reference === null || floating === null || container === null) {
      return;
    }
    if (native && !floating.matches(':popover-open')) {
      floating.showPopover();
    }
    const stop = autoUpdate(reference, floating, () => {
      void placePopup(reference, floating, {
        placement,
        centred,
        arrow: arrowRef?.current ?? null,
      });
    });
    const events = new AbortController();
    // Capture sees the press before a component inside the page stops it.
    document.addEventListener(
      'pointerdown',
      (event) => {
        const path = event.composedPath();
        if (!path.includes(container) && !path.includes(floating)) {
          dismiss.current(event);
        }
      },
      { capture: true, signal: events.signal },
    );
    container.addEventListener(
      'focusout',
      (event) => {
        const next = event.relatedTarget;
        // A null target is a switch of window or a press on nothing focusable, which the pointer
        // handler decides; the popup stays open for a user who comes back.
        if (next instanceof Node && !container.contains(next)) {
          dismiss.current(event);
        }
      },
      { signal: events.signal },
    );
    return () => {
      stop();
      events.abort();
      if (!native) {
        floating.hidden = true;
      } else if (floating.matches(':popover-open')) {
        floating.hidePopover();
      }
    };
  }, [open, root, anchor, popup, placement, centred, arrowRef, modal]);
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
