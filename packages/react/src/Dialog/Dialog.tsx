import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent as ReactMouseEvent, ReactNode, UIEvent } from 'react';
import { IconClose } from '@mszczygiel-projects/ui-core-icons/react';
import { useDragDismiss } from '../hooks/useDragDismiss.js';
import './Dialog.css';
import { getUiCoreConfig } from '@mszczygiel-projects/ui-core-foundations';

export type DialogSize = 'small' | 'medium' | 'large' | 'fullscreen';

export type DialogVariant = 'default' | 'alert';

export type DialogDismiss = 'outside-click' | 'escape' | 'both' | 'none';

export type DialogOpenChangeReason = 'close-button' | 'outside-click' | 'escape' | 'drag';

/**
 * The sheet breakpoint, mirrored from Dialog.css. 48rem is --breakpoint-md;
 * neither a media query nor matchMedia can read a CSS custom property, so the
 * value is repeated in both places.
 */
const SHEET_QUERY = '(max-width: 47.999rem)';

export interface DialogOpenChangeDetail {
  open: boolean;
  reason: DialogOpenChangeReason;
}

/**
 * showModal() does not portably stop the page behind from scrolling. Dialogs
 * nest, so the lock is reference-counted at module level rather than per
 * instance.
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
 * Modal overlay rendered in the browser top layer via the native `<dialog>`
 * element — no z-index scale involved. Focus trapping, page inerting and Escape
 * come from the platform.
 *
 * Fully controlled: the component never owns its open state. Escape, backdrop
 * clicks and the close button only call `onOpenChange` — the consumer owns the
 * state and passes `open` back down.
 *
 * @example
 * const [open, setOpen] = useState(false);
 * <Dialog
 *   open={open}
 *   onOpenChange={(d) => setOpen(d.open)}
 *   title="Delete account?"
 *   description="This cannot be undone."
 *   footer={<><Button variant="outline">Cancel</Button><Button variant="danger">Delete</Button></>}
 * >
 *   Everything associated with the account is removed immediately.
 * </Dialog>
 */
export interface DialogProps {
  /**
   * Controlled open state — set by the consumer, typically in response to
   * `onOpenChange`.
   * @default false
   */
  open?: boolean;
  /**
   * Panel width preset. `fullscreen` fills the viewport and is the only size
   * with no max-width token, because it is viewport-driven.
   * @default 'medium'
   */
  size?: DialogSize;
  /**
   * `alert` switches the role to `alertdialog` and refuses to close on a
   * backdrop click, so a destructive choice cannot be dismissed by accident.
   * @default 'default'
   */
  variant?: DialogVariant;
  /**
   * Which interactions request a close. `alert` ignores `outside-click`
   * regardless of this value.
   * @default 'both'
   */
  dismissOn?: DialogDismiss;
  /**
   * Shows the × close button in the header.
   * @default true
   */
  hasCloseButton?: boolean;
  /**
   * Accessible name of the close button.
   * @default `getUiCoreConfig().labels.dialog.close`
   */
  closeLabel?: string;
  /** Accessible name used when no `title` is provided. */
  label?: string;
  /**
   * Allows the sheet to be flicked away downwards. Sheet-only — it does nothing
   * on the centred desktop layout, and it never replaces Escape, the backdrop
   * or the close button, none of which a pointer gesture is a substitute for.
   * @default false
   */
  dragToDismiss?: boolean;
  /** Heading — also the accessible name of the dialog. */
  title?: ReactNode;
  /** Optional supporting text below the title. */
  description?: ReactNode;
  /** Action buttons. Stacks full-width on narrow viewports. */
  footer?: ReactNode;
  /** Dialog body. Scrolls on its own when it outgrows the panel. */
  children?: ReactNode;
  /** Called with the requested state; the component never applies it itself. */
  onOpenChange?: (detail: DialogOpenChangeDetail) => void;
  /** Extra class names appended to the root element. */
  className?: string;
  /** Inline styles forwarded to the root element (positioning only — never visual styles). */
  style?: CSSProperties;
}

const TITLE_ID = 'ui-dialog-title';
const DESCRIPTION_ID = 'ui-dialog-description';

export function Dialog({
  open = false,
  size = 'medium',
  variant = 'default',
  dismissOn = 'both',
  hasCloseButton = true,
  closeLabel,
  label,
  dragToDismiss = false,
  title,
  description,
  footer,
  children,
  onOpenChange,
  className,
  style,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const grabberRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const lockedRef = useRef(false);
  const [scrollEdges, setScrollEdges] = useState({ start: false, end: false });
  const [isSheet, setIsSheet] = useState(
    () => typeof matchMedia === 'function' && matchMedia(SHEET_QUERY).matches,
  );

  useEffect(() => {
    if (typeof matchMedia !== 'function') return;
    const mq = matchMedia(SHEET_QUERY);
    const onChange = () => setIsSheet(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  /** Separators are shown only on the edges the content actually runs past. */
  const syncScrollEdges = useCallback(() => {
    const body = bodyRef.current;
    if (!body) return;
    const overflowing = body.scrollHeight - body.clientHeight > 1;
    const atTop = body.scrollTop <= 0;
    const atBottom = body.scrollTop + body.clientHeight >= body.scrollHeight - 1;
    setScrollEdges({ start: overflowing && !atTop, end: overflowing && !atBottom });
  }, []);

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
      syncScrollEdges();
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
  }, [open, syncScrollEdges]);

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

  useEffect(() => {
    const body = bodyRef.current;
    if (!open || !body || typeof ResizeObserver !== 'function') return;
    const observer = new ResizeObserver(syncScrollEdges);
    observer.observe(body);
    return () => observer.disconnect();
  }, [open, syncScrollEdges]);

  const request = (reason: DialogOpenChangeReason) => {
    if (!open) return;
    onOpenChange?.({ open: false, reason });
  };

  const resetDrag = useDragDismiss({
    targetRef: ref,
    // The body is deliberately excluded: a drag starting there must scroll.
    handleRefs: [grabberRef, headerRef],
    enabled: dragToDismiss && isSheet,
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
    if (variant === 'alert') return;
    if (dismissOn === 'escape' || dismissOn === 'none') return;
    request('outside-click');
  };

  const showHeader = Boolean(title) || Boolean(description) || hasCloseButton;

  const classes = ['ui-dialog', `ui-dialog--${size}`, `ui-dialog--${variant}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <dialog
      ref={ref}
      className={classes}
      style={style}
      role={variant === 'alert' ? 'alertdialog' : 'dialog'}
      aria-labelledby={title ? TITLE_ID : undefined}
      aria-label={!title && label ? label : undefined}
      aria-describedby={description ? DESCRIPTION_ID : undefined}
      data-scroll-start={scrollEdges.start ? '' : undefined}
      data-scroll-end={scrollEdges.end ? '' : undefined}
      onCancel={handleCancel}
      onClick={handleClick}
    >
      {dragToDismiss && (
        <div className="ui-dialog__grabber" ref={grabberRef} aria-hidden="true">
          <span />
        </div>
      )}

      {showHeader && (
        <div className="ui-dialog__header" ref={headerRef}>
          <div className="ui-dialog__header-text">
            {title && (
              <h2 className="ui-dialog__title" id={TITLE_ID}>
                {title}
              </h2>
            )}
            {description && (
              <p className="ui-dialog__description" id={DESCRIPTION_ID}>
                {description}
              </p>
            )}
          </div>
          {hasCloseButton && (
            <button
              type="button"
              className="ui-dialog__close"
              aria-label={closeLabel ?? getUiCoreConfig().labels.dialog.close}
              onClick={() => request('close-button')}
            >
              <IconClose aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      <div
        className="ui-dialog__body"
        ref={bodyRef}
        onScroll={(event: UIEvent<HTMLDivElement>) => {
          void event;
          syncScrollEdges();
        }}
      >
        {children}
      </div>

      {footer && <div className="ui-dialog__footer">{footer}</div>}
    </dialog>
  );
}
