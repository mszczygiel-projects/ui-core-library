import { useEffect, useRef } from 'react';
import type { CSSProperties, MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import { IconClose } from '@mszczygiel-projects/ui-core-icons/react';
import { useDragDismiss } from '../hooks/useDragDismiss.js';
import './Drawer.css';
import { getUiCoreConfig } from '@mszczygiel-projects/ui-core-foundations';

export type DrawerPlacement = 'right' | 'left' | 'bottom';

export type DrawerDismiss = 'outside-click' | 'escape' | 'both' | 'none';

export type DrawerOpenChangeReason = 'close-button' | 'outside-click' | 'escape' | 'drag';

export interface DrawerOpenChangeDetail {
  open: boolean;
  reason: DrawerOpenChangeReason;
}

/**
 * showModal() does not portably stop the page behind from scrolling. Drawers
 * can coexist with dialogs, so the lock is reference-counted at module level.
 */
let scrollLockCount = 0;
let previousOverflow = '';

function lockScroll() {
  if (scrollLockCount === 0) {
    previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
  }
  scrollLockCount += 1;
}

function releaseScroll() {
  if (scrollLockCount === 0) return;
  scrollLockCount -= 1;
  if (scrollLockCount === 0) document.documentElement.style.overflow = previousOverflow;
}

/**
 * Edge-anchored modal panel built on the native `<dialog>` element. Rendered in
 * the browser top layer via `showModal()`, so no z-index is involved — focus
 * trapping, page inerting and Escape all come from the platform.
 *
 * A deliberately plain container: the drawer owns the surface, the scroll and
 * the close affordance, and nothing else. Headings, toolbars and action rows
 * are the consumer's to compose as children.
 *
 * Fully controlled: the component never owns its open state. Escape, backdrop
 * clicks, the close button and the drag gesture only call `onOpenChange` — the
 * consumer owns the state and passes `open` back down.
 *
 * @example
 * const [open, setOpen] = useState(false);
 * <Drawer open={open} onOpenChange={(d) => setOpen(d.open)} placement="right" label="Filters">
 *   <h2>Filters</h2>
 *   <p>Anything at all — the drawer imposes no structure.</p>
 * </Drawer>
 */
export interface DrawerProps {
  /**
   * Controlled open state — set by the consumer, typically in response to
   * `onOpenChange`.
   * @default false
   */
  open?: boolean;
  /**
   * Which edge the drawer is anchored to. `right` and `left` span the full
   * viewport height at a fixed width; `bottom` is a sheet that hugs its content.
   * @default 'right'
   */
  placement?: DrawerPlacement;
  /**
   * Which interactions request a close.
   * @default 'both'
   */
  dismissOn?: DrawerDismiss;
  /**
   * Shows the × close button.
   * @default true
   */
  hasCloseButton?: boolean;
  /**
   * Accessible name of the drawer. The drawer has no title region of its own,
   * so without this there is nothing for `role="dialog"` to be named by — set
   * it, or point `aria-labelledby` at your own heading via `aria-labelledby`.
   */
  label?: string;
  /**
   * Accessible name of the close button.
   * @default `getUiCoreConfig().labels.drawer.close`
   */
  closeLabel?: string;
  /**
   * Allows a bottom sheet to be flicked away downwards. Bottom-only — a
   * horizontal drag handle on a side panel is an affordance nobody recognises,
   * and the gesture never replaces Escape, the backdrop or the close button.
   * @default false
   */
  dragToDismiss?: boolean;
  /** Id of an element that names the drawer, when the name is your own heading. */
  'aria-labelledby'?: string;
  /** Drawer content. Scrolls on its own when it outgrows the panel. */
  children?: ReactNode;
  /** Called with the requested state; the component never applies it itself. */
  onOpenChange?: (detail: DrawerOpenChangeDetail) => void;
  /** Extra class names appended to the root element. */
  className?: string;
  /** Inline styles forwarded to the root element (positioning only — never visual styles). */
  style?: CSSProperties;
}

export function Drawer({
  open = false,
  placement = 'right',
  dismissOn = 'both',
  hasCloseButton = true,
  label,
  closeLabel,
  dragToDismiss = false,
  'aria-labelledby': ariaLabelledBy,
  children,
  onOpenChange,
  className,
  style,
}: DrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const grabberRef = useRef<HTMLDivElement>(null);
  const dismissRef = useRef<HTMLDivElement>(null);
  const lockedRef = useRef(false);

  useEffect(() => {
    const panel = ref.current;
    if (!panel) return;

    if (open) {
      try {
        if (!panel.open) panel.showModal();
      } catch {
        // Some environments implement <dialog> only partially — best effort.
      }
      if (!lockedRef.current) {
        lockScroll();
        lockedRef.current = true;
      }
    } else {
      try {
        if (panel.open) panel.close();
      } catch {
        // See above.
      }
      if (lockedRef.current) {
        releaseScroll();
        lockedRef.current = false;
      }
    }
  }, [open]);

  // Release the lock if the component unmounts while still open.
  useEffect(
    () => () => {
      if (lockedRef.current) {
        releaseScroll();
        lockedRef.current = false;
      }
    },
    [],
  );

  const request = (reason: DrawerOpenChangeReason) => {
    if (!open) return;
    onOpenChange?.({ open: false, reason });
  };

  const resetDrag = useDragDismiss({
    targetRef: ref,
    // The body is deliberately excluded: a drag starting there must scroll.
    handleRefs: [grabberRef, dismissRef],
    direction: 'down',
    enabled: dragToDismiss && placement === 'bottom',
    onDismiss: () => request('drag'),
  });

  // A sheet dismissed mid-drag keeps its offset otherwise, and would reopen
  // already pushed off-screen.
  useEffect(() => {
    if (!open) resetDrag();
  }, [open, resetDrag]);

  /**
   * Escape fires the native `cancel`, which would close the element and
   * desynchronise it from the controlled prop — so the default is prevented and
   * a request is raised instead.
   */
  const handleCancel = (event: React.SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    if (dismissOn === 'outside-click' || dismissOn === 'none') return;
    request('escape');
  };

  /** A click landing on the dialog element itself is a click on the backdrop. */
  const handleClick = (event: ReactMouseEvent<HTMLDialogElement>) => {
    if (event.target !== ref.current) return;
    if (dismissOn === 'escape' || dismissOn === 'none') return;
    request('outside-click');
  };

  const showGrabber = dragToDismiss && placement === 'bottom';

  const classes = ['ui-drawer', `ui-drawer--${placement}`, className].filter(Boolean).join(' ');

  return (
    <dialog
      ref={ref}
      className={classes}
      style={style}
      role="dialog"
      aria-label={label}
      aria-labelledby={ariaLabelledBy}
      onCancel={handleCancel}
      onClick={handleClick}
    >
      {showGrabber && (
        <div className="ui-drawer__grabber" ref={grabberRef} aria-hidden="true">
          <span />
        </div>
      )}

      {hasCloseButton && (
        <div className="ui-drawer__dismiss" ref={dismissRef}>
          <button
            type="button"
            className="ui-drawer__close"
            aria-label={closeLabel ?? getUiCoreConfig().labels.drawer.close}
            onClick={() => request('close-button')}
          >
            <IconClose aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="ui-drawer__body">{children}</div>
    </dialog>
  );
}
