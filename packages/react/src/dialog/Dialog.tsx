'use client';

import { iconClose } from '@mszczygiel-projects/ui-core-icons';
import {
  dialog as dialogSpec,
  type DialogProps as SharedDialogProps,
  type DialogSize,
  type OverlayCloseReason,
  type OverlayOpenChangeDetails as SharedOpenChangeDetails,
} from '@mszczygiel-projects/ui-core-shared/dialog';
import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import {
  type ComponentPropsWithRef,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

import { IconButton } from '../icon-button/IconButton.tsx';
import { classNames } from '../internal/class-names.ts';
import { rendersContent } from '../internal/renders-content.ts';
import { setRef } from '../internal/set-ref.ts';
import { useOverlay } from '../internal/use-overlay.ts';
import { useUiCoreConfig } from '../internal/use-ui-core-config.ts';

const { options } = dialogSpec;

export type { DialogSize, OverlayCloseReason };

/** What asked a modal to close, with the native event before React wraps it. */
export type OverlayOpenChangeDetails = SharedOpenChangeDetails<Event>;

/** The props of Dialog. Other attributes and the ref go to the native dialog element. */
export interface DialogProps
  extends
    SharedDialogProps,
    Omit<ComponentPropsWithRef<'dialog'>, keyof SharedDialogProps | 'children'> {
  /** The controlled open state. Pair it with onOpenChange, which reports a request to close. */
  open?: boolean;
  /** The initial uncontrolled open state. @default false */
  defaultOpen?: boolean;
  /**
   * The user asked the dialog to close, with the reason. An uncontrolled dialog closes; a
   * controlled one closes when its parent sets `open` to false.
   */
  onOpenChange?: (open: boolean, details: OverlayOpenChangeDetails) => void;
  /** The content of the dialog, which scrolls when it is taller than the window. */
  children?: ReactNode;
  /** The actions of the dialog, such as buttons. */
  footer?: ReactNode;
}

/**
 * A modal window over the page that asks the user to read, decide or enter something before going
 * on.
 *
 * It renders a native dialog, closed on the server, and opens it with `showModal()` after
 * hydration: in the top layer, with the rest of the page inert and not scrolling. The focus moves
 * to the element of the content marked with `data-autofocus`, else to its first focusable
 * element, and returns where it was when the dialog closes. Escape, a press on the backdrop
 * (except for an alert), the close button, a form with `method="dialog"` and a drag down of a
 * sheet ask it to close through `onOpenChange`. Below the breakpoint it rises from the bottom of
 * the window as a sheet. The heading names the dialog, and the description describes it; without
 * a heading, `label` or `aria-label` names it. The ref is the native dialog: open and close it
 * through `open`, never with its methods.
 */
export function Dialog({
  open,
  defaultOpen = false,
  onOpenChange,
  size = 'medium',
  alert = false,
  heading,
  description,
  label,
  hideCloseButton = false,
  closeLabel,
  dragToDismiss = false,
  children,
  footer,
  className,
  ref,
  'aria-label': ariaLabel,
  ...rest
}: DialogProps) {
  const { labels } = useUiCoreConfig();
  const id = useId();
  const headingId = `${id}-heading`;
  const descriptionId = `${id}-description`;
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLDivElement | null>(null);
  const grabberRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [edges, setEdges] = useState({ fromStart: false, toEnd: true });
  const resolvedSize = oneOf(size, options.size.options, options.size.default);
  const hasHeading = heading !== undefined && heading !== '';
  const hasDescription = description !== undefined && description !== '';
  const hasFooter = rendersContent(footer);

  const { isOpen, requestClose } = useOverlay({
    dialog: dialogRef,
    open,
    defaultOpen,
    onOpenChange,
    content: () => [...(bodyRef.current?.children ?? []), ...(footerRef.current?.children ?? [])],
    closesOnBackdrop: () => !alert,
    dragHandles: () => {
      const grabber = grabberRef.current;
      const header = headerRef.current;
      return grabber?.checkVisibility() === true ? [grabber, ...(header ? [header] : [])] : [];
    },
    dragExcluded: () => (closeRef.current ? [closeRef.current] : []),
    onDragging: setDragging,
  });

  /** The separators show where the content runs on under the header or the footer. */
  const measureEdges = useCallback(() => {
    const body = bodyRef.current;
    if (body === null) {
      return;
    }
    setEdges({
      fromStart: body.scrollTop > 0,
      toEnd: body.scrollTop + body.clientHeight >= body.scrollHeight - 1,
    });
  }, []);

  useEffect(() => {
    const body = bodyRef.current;
    if (body === null) {
      return;
    }
    const observer = new ResizeObserver(measureEdges);
    observer.observe(body);
    return () => {
      observer.disconnect();
    };
  }, [measureEdges]);

  useEffect(() => {
    if (isOpen) {
      measureEdges();
    }
  }, [isOpen, measureEdges]);

  return (
    <dialog
      ref={(node) => {
        dialogRef.current = node;
        return setRef(ref, node);
      }}
      className={classNames(
        'ui-overlay',
        'ui-overlay--dialog',
        'ui-dialog',
        'ui-dialog__base',
        `ui-dialog--${resolvedSize}`,
        edges.fromStart && 'ui-dialog--scrolled-from-start',
        !edges.toEnd && 'ui-dialog--scrolled-before-end',
        dragging && 'ui-overlay--dragging',
        className,
      )}
      role={alert ? 'alertdialog' : undefined}
      tabIndex={-1}
      aria-labelledby={hasHeading && ariaLabel === undefined ? headingId : undefined}
      aria-label={ariaLabel ?? (hasHeading ? undefined : label)}
      aria-describedby={hasDescription ? descriptionId : undefined}
      {...rest}
    >
      {dragToDismiss && (
        <div
          ref={grabberRef}
          className="ui-overlay__grabber ui-dialog__grabber"
          aria-hidden="true"
        />
      )}
      <div
        ref={headerRef}
        className="ui-overlay__header ui-dialog__header"
        hidden={!hasHeading && !hasDescription && hideCloseButton}
      >
        <div className="ui-dialog__titles">
          <h2 id={headingId} className="ui-dialog__heading" hidden={!hasHeading}>
            {heading}
          </h2>
          <p id={descriptionId} className="ui-dialog__description" hidden={!hasDescription}>
            {description}
          </p>
        </div>
        {!hideCloseButton && (
          <IconButton
            ref={closeRef}
            className="ui-dialog__close"
            variant="ghost"
            size="small"
            label={closeLabel ?? labels.dialog.close}
            icon={<span dangerouslySetInnerHTML={{ __html: iconClose }} />}
            onClick={(event) => {
              requestClose('close-button', event.nativeEvent);
            }}
          />
        )}
      </div>
      <div ref={bodyRef} className="ui-overlay__body ui-dialog__body" onScroll={measureEdges}>
        {children}
      </div>
      <div ref={footerRef} className="ui-dialog__footer" hidden={!hasFooter}>
        {footer}
      </div>
    </dialog>
  );
}
