import { cloneElement, isValidElement, useCallback, useEffect, useRef, useState } from 'react';
import type {
  CSSProperties,
  FocusEvent as ReactFocusEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from 'react';
import {
  computePosition,
  autoUpdate,
  offset as offsetMiddleware,
  flip as flipMiddleware,
  shift as shiftMiddleware,
  arrow as arrowMiddleware,
} from '@floating-ui/dom';
import './Popover.css';

export type PopoverPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

export type PopoverTrigger = 'click' | 'hover' | 'manual';

export type PopoverDismiss = 'outside-click' | 'escape' | 'both';

export type PopoverOpenChangeReason = 'trigger' | 'hover' | 'outside-click' | 'escape';

export interface PopoverOpenChangeDetail {
  open: boolean;
  reason: PopoverOpenChangeReason;
}

/** Top-layer rendering via the native Popover API; falls back to position: fixed. */
const supportsNativePopover =
  typeof HTMLElement !== 'undefined' && 'showPopover' in HTMLElement.prototype;

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/** Delay before a hover-triggered popover requests close, so the pointer can travel into the panel. */
const HOVER_CLOSE_DELAY_MS = 150;

/* Environments may expose the Popover API only partially (e.g. jsdom without
 * :popover-open selector support) — treat every native call as best-effort. */
function showNativePopover(el: HTMLElement) {
  try {
    el.showPopover();
  } catch {
    /* already shown or unsupported */
  }
}

function hideNativePopover(el: HTMLElement) {
  try {
    el.hidePopover();
  } catch {
    /* already hidden or unsupported */
  }
}

/**
 * Generic overlay primitive: positions floating content relative to a trigger,
 * rendered in the browser top layer (native Popover API) with a
 * `position: fixed` + `--z-overlay` fallback.
 *
 * Fully controlled: the component never owns its open state. User interactions
 * (trigger click/hover, Escape, outside click) only call `onOpenChange` — the
 * consumer owns the state and passes `open` back down.
 *
 * @example
 * const [open, setOpen] = useState(false);
 * <Popover open={open} onOpenChange={(d) => setOpen(d.open)} anchor={<button>Open</button>}>
 *   Floating content
 * </Popover>
 */
export interface PopoverProps {
  /**
   * Controlled open state — set by the consumer, typically in response to
   * `onOpenChange`.
   * @default false
   */
  open?: boolean;
  /**
   * Preferred panel position relative to the anchor; may be flipped/shifted at
   * runtime (see `data-placement` on the panel for the resolved value).
   * @default 'bottom'
   */
  placement?: PopoverPlacement;
  /**
   * Which built-in interaction requests open/close: `click` toggles from the
   * anchor, `hover` opens on hover/focus of the anchor, `manual` makes no
   * requests (consumer drives everything — e.g. DateField).
   * @default 'click'
   */
  trigger?: PopoverTrigger;
  /** Distance between anchor and panel in px. Defaults to the `--popover-offset` token (8px). */
  offset?: number;
  /**
   * Flip to the opposite side when there is not enough room.
   * @default true
   */
  flip?: boolean;
  /**
   * Nudge the panel along the alignment axis to keep it in the viewport.
   * @default true
   */
  shift?: boolean;
  /**
   * Which interactions outside the consumer's control request a close.
   * @default 'both'
   */
  dismissOn?: PopoverDismiss;
  /**
   * Keep Tab cycling inside the panel, move focus into it on open, and return
   * focus to the anchor on close. Enable for dialog-like content (DatePicker);
   * leave off for tooltips and inline-typing flows.
   * @default false
   */
  trapFocus?: boolean;
  /**
   * Render a caret pointing at the anchor.
   * @default false
   */
  arrow?: boolean;
  /**
   * Anchor element the panel is positioned against (the WC `trigger` slot
   * equivalent). When it is a single element and `trigger` is not `manual`,
   * `aria-expanded` is injected onto it.
   */
  anchor?: ReactNode;
  /** Panel content. */
  children?: ReactNode;
  /** Request to change the open state. */
  onOpenChange?: (detail: PopoverOpenChangeDetail) => void;
  /** Extra class names appended to the root element. */
  className?: string;
  /** Inline styles forwarded to the root element (positioning only — never visual styles). */
  style?: CSSProperties;
}

export function Popover({
  open = false,
  placement = 'bottom',
  trigger = 'click',
  offset,
  flip = true,
  shift = true,
  dismissOn = 'both',
  trapFocus = false,
  arrow = false,
  anchor,
  children,
  onOpenChange,
  className,
  style,
}: PopoverProps) {
  const hostRef = useRef<HTMLSpanElement>(null);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const hoverCloseTimer = useRef<ReturnType<typeof setTimeout>>();
  const [actualPlacement, setActualPlacement] = useState<string>(placement);

  // Latest-value refs so document listeners never go stale without re-subscribing.
  const openRef = useRef(open);
  openRef.current = open;
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  const requestOpenChange = useCallback((next: boolean, reason: PopoverOpenChangeReason) => {
    if (next === openRef.current) return;
    onOpenChangeRef.current?.({ open: next, reason });
  }, []);

  /** Reads a length token off the host and converts it to px (tokens are emitted in rem). */
  const tokenLengthPx = useCallback((name: string, fallback: number): number => {
    const host = hostRef.current;
    if (!host) return fallback;
    const raw = getComputedStyle(host).getPropertyValue(name).trim();
    const value = parseFloat(raw);
    if (!Number.isFinite(value)) return fallback;
    if (raw.endsWith('rem')) {
      const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      return value * rootFontSize;
    }
    return value;
  }, []);

  // Show/hide + focus management — reacts to `open` transitions only.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || !open) return undefined;

    if (supportsNativePopover) showNativePopover(panel);

    let focusFrame = 0;
    if (trapFocus) {
      const previous = document.activeElement;
      returnFocusRef.current =
        previous instanceof HTMLElement && previous !== document.body ? previous : null;
      focusFrame = requestAnimationFrame(() => {
        const target = panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ?? panel;
        target.focus();
      });
    }

    return () => {
      cancelAnimationFrame(focusFrame);
      const focusWasInside =
        document.activeElement !== null && panel.contains(document.activeElement);
      if (supportsNativePopover) hideNativePopover(panel);
      if (trapFocus && focusWasInside) {
        const target = returnFocusRef.current ?? anchorRef.current;
        target?.focus();
      }
      returnFocusRef.current = null;
    };
  }, [open, trapFocus]);

  // Positioning — re-runs while open when any positioning input changes.
  useEffect(() => {
    const panel = panelRef.current;
    const anchorEl = anchorRef.current;
    if (!panel || !anchorEl || !open) return undefined;

    const position = async () => {
      const arrowEl = arrow ? arrowRef.current : null;
      const middleware = [offsetMiddleware(offset ?? tokenLengthPx('--popover-offset', 8))];
      if (flip) middleware.push(flipMiddleware());
      if (shift) middleware.push(shiftMiddleware());
      if (arrowEl) middleware.push(arrowMiddleware({ element: arrowEl }));

      const result = await computePosition(anchorEl, panel, {
        placement,
        strategy: 'fixed',
        middleware,
      });

      panel.style.setProperty('--_x', `${result.x}px`);
      panel.style.setProperty('--_y', `${result.y}px`);
      setActualPlacement(result.placement);

      if (arrowEl && result.middlewareData.arrow) {
        const { x: arrowX, y: arrowY } = result.middlewareData.arrow;
        if (arrowX != null) arrowEl.style.setProperty('--_arrow-x', `${arrowX}px`);
        else arrowEl.style.removeProperty('--_arrow-x');
        if (arrowY != null) arrowEl.style.setProperty('--_arrow-y', `${arrowY}px`);
        else arrowEl.style.removeProperty('--_arrow-y');
      }
    };

    return autoUpdate(anchorEl, panel, () => void position(), {
      elementResize: typeof ResizeObserver === 'function',
      layoutShift: typeof IntersectionObserver === 'function',
    });
  }, [open, placement, offset, flip, shift, arrow, tokenLengthPx]);

  // Dismissal — document-level listeners active only while open.
  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event: PointerEvent) => {
      if (dismissOn === 'escape') return;
      const host = hostRef.current;
      if (host && event.target instanceof Node && host.contains(event.target)) return;
      requestOpenChange(false, 'outside-click');
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape' || dismissOn === 'outside-click') return;
      requestOpenChange(false, 'escape');
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [open, dismissOn, requestOpenChange]);

  useEffect(() => () => clearTimeout(hoverCloseTimer.current), []);

  const handleHostClick = (event: ReactMouseEvent) => {
    if (trigger !== 'click') return;
    const panel = panelRef.current;
    // Clicks inside the panel are content interactions, not trigger toggles.
    if (panel && event.target instanceof Node && panel.contains(event.target)) return;
    requestOpenChange(!open, 'trigger');
  };

  const handleMouseEnter = () => {
    if (trigger !== 'hover') return;
    clearTimeout(hoverCloseTimer.current);
    requestOpenChange(true, 'hover');
  };

  const handleMouseLeave = () => {
    if (trigger !== 'hover') return;
    clearTimeout(hoverCloseTimer.current);
    hoverCloseTimer.current = setTimeout(() => {
      requestOpenChange(false, 'hover');
    }, HOVER_CLOSE_DELAY_MS);
  };

  const handleFocus = () => {
    if (trigger !== 'hover') return;
    requestOpenChange(true, 'hover');
  };

  const handleBlur = (event: ReactFocusEvent) => {
    if (trigger !== 'hover') return;
    const host = hostRef.current;
    if (host && event.relatedTarget instanceof Node && host.contains(event.relatedTarget)) return;
    requestOpenChange(false, 'hover');
  };

  const handlePanelKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!trapFocus || event.key !== 'Tab') return;
    const panel = panelRef.current;
    if (!panel) return;
    const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    if (focusables.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === panel)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const anchorNode =
    trigger !== 'manual' && isValidElement<{ 'aria-expanded'?: boolean }>(anchor)
      ? cloneElement(anchor, { 'aria-expanded': open })
      : anchor;

  // The `popover` attribute is missing from @types/react below 18.3 — feed it
  // through a loosely-typed spread so both type versions compile.
  const nativePopoverAttr: Record<string, string> | undefined = supportsNativePopover
    ? { popover: 'manual' }
    : undefined;

  return (
    <span
      ref={hostRef}
      className={['ui-popover', className].filter(Boolean).join(' ')}
      style={style}
      onClick={handleHostClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <span ref={anchorRef} className="ui-popover__anchor">
        {anchorNode}
      </span>
      <div
        ref={panelRef}
        className={[
          'ui-popover__panel',
          !supportsNativePopover && open && 'ui-popover__panel--open',
        ]
          .filter(Boolean)
          .join(' ')}
        {...nativePopoverAttr}
        tabIndex={-1}
        data-placement={actualPlacement}
        onKeyDown={handlePanelKeyDown}
      >
        {arrow && <div className="ui-popover__arrow" ref={arrowRef} aria-hidden="true" />}
        <div className="ui-popover__content">{children}</div>
      </div>
    </span>
  );
}
