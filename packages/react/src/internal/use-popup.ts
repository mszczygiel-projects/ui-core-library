'use client';

import { autoUpdate, computePosition, flip, offset, shift, size } from '@floating-ui/dom';
import { type RefObject, useEffect, useLayoutEffect, useRef } from 'react';

/** The layout effect of the browser, which a server render skips without a warning. */
const useBrowserLayoutEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect;

/**
 * The popup of a field while it is open: in the top layer above every other content, including
 * a modal dialog, placed below its field or above it when the window has no room below, as wide
 * as the field at least and no taller than the room in the window. A browser without the Popover
 * API shows it in fixed position instead. A press of the pointer outside `root` and the popup, or
 * the focus leaving `root`, calls `onDismiss`.
 */
export function usePopup({
  open,
  root,
  anchor,
  popup,
  onDismiss,
}: {
  readonly open: boolean;
  readonly root: RefObject<HTMLElement | null>;
  readonly anchor: RefObject<HTMLElement | null>;
  readonly popup: RefObject<HTMLElement | null>;
  readonly onDismiss: (event: Event) => void;
}): void {
  const dismiss = useRef(onDismiss);
  useBrowserLayoutEffect(() => {
    dismiss.current = onDismiss;
  });

  useBrowserLayoutEffect(() => {
    const reference = anchor.current;
    const floating = popup.current;
    const container = root.current;
    if (!open || reference === null || floating === null || container === null) {
      return;
    }
    if (typeof floating.showPopover === 'function') {
      if (!floating.matches(':popover-open')) {
        floating.showPopover();
      }
    } else {
      floating.hidden = false;
    }
    const stop = autoUpdate(reference, floating, () => {
      void place(reference, floating);
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
      if (typeof floating.hidePopover === 'function' && floating.matches(':popover-open')) {
        floating.hidePopover();
      }
    };
  }, [open, root, anchor, popup]);
}

async function place(anchor: HTMLElement, popup: HTMLElement): Promise<void> {
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
