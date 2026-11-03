'use client';

import { iconClose } from '@mszczygiel-projects/ui-core-icons';
import {
  drawer as drawerSpec,
  type DrawerPlacement,
  type DrawerProps as SharedDrawerProps,
} from '@mszczygiel-projects/ui-core-shared/drawer';
import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import { type ComponentPropsWithRef, type ReactNode, useRef, useState } from 'react';

import type { OverlayOpenChangeDetails } from '../dialog/Dialog.tsx';
import { IconButton } from '../icon-button/IconButton.tsx';
import { classNames } from '../internal/class-names.ts';
import { setRef } from '../internal/set-ref.ts';
import { useOverlay } from '../internal/use-overlay.ts';
import { useUiCoreConfig } from '../internal/use-ui-core-config.ts';

const { options } = drawerSpec;

export type { DrawerPlacement };

/** The props of Drawer. Other attributes and the ref go to the native dialog element. */
export interface DrawerProps
  extends
    SharedDrawerProps,
    Omit<ComponentPropsWithRef<'dialog'>, keyof SharedDrawerProps | 'children'> {
  /** The controlled open state. Pair it with onOpenChange, which reports a request to close. */
  open?: boolean;
  /** The initial uncontrolled open state. @default false */
  defaultOpen?: boolean;
  /**
   * The user asked the drawer to close, with the reason. An uncontrolled drawer closes; a
   * controlled one closes when its parent sets `open` to false.
   */
  onOpenChange?: (open: boolean, details: OverlayOpenChangeDetails) => void;
  /** The content of the drawer, which scrolls when it is taller than the window. */
  children?: ReactNode;
}

/**
 * A modal panel at an edge of the window that holds secondary content, such as filters,
 * navigation or details.
 *
 * It renders a native dialog, closed on the server, and opens it with `showModal()` after
 * hydration: in the top layer at the start or the end of the line, which follow the direction of
 * the text, or at the bottom. The rest of the page is inert and does not scroll. The focus moves
 * to the element of the content marked with `data-autofocus`, else to its first focusable
 * element, and returns where it was when the drawer closes. Escape, a press on the backdrop, the
 * close button, a form with `method="dialog"` and a drag down of a bottom drawer ask it to close
 * through `onOpenChange`. Nothing visible names a drawer, so `label`, `aria-label` or
 * `aria-labelledby` is required. The ref is the native dialog: open and close it through `open`,
 * never with its methods.
 */
export function Drawer({
  open,
  defaultOpen = false,
  onOpenChange,
  placement = 'end',
  label,
  hideCloseButton = false,
  closeLabel,
  dragToDismiss = false,
  children,
  className,
  ref,
  'aria-label': ariaLabel,
  ...rest
}: DrawerProps) {
  const { labels } = useUiCoreConfig();
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const grabberRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const resolvedPlacement = oneOf(placement, options.placement.options, options.placement.default);
  const draggable = dragToDismiss && resolvedPlacement === 'bottom';

  const { requestClose } = useOverlay({
    dialog: dialogRef,
    open,
    defaultOpen,
    onOpenChange,
    content: () => [...(bodyRef.current?.children ?? [])],
    closesOnBackdrop: () => true,
    dragHandles: () => {
      const grabber = grabberRef.current;
      const header = headerRef.current;
      return grabber?.checkVisibility() === true ? [grabber, ...(header ? [header] : [])] : [];
    },
    dragExcluded: () => (closeRef.current ? [closeRef.current] : []),
    onDragging: setDragging,
  });

  return (
    <dialog
      ref={(node) => {
        dialogRef.current = node;
        return setRef(ref, node);
      }}
      className={classNames(
        'ui-overlay',
        'ui-overlay--drawer',
        'ui-drawer',
        'ui-drawer__base',
        `ui-drawer--${resolvedPlacement}`,
        dragging && 'ui-overlay--dragging',
        className,
      )}
      tabIndex={-1}
      aria-label={ariaLabel ?? label}
      {...rest}
    >
      {draggable && (
        <div
          ref={grabberRef}
          className="ui-overlay__grabber ui-drawer__grabber"
          aria-hidden="true"
        />
      )}
      {!hideCloseButton && (
        <div ref={headerRef} className="ui-overlay__header ui-drawer__header">
          <IconButton
            ref={closeRef}
            className="ui-drawer__close"
            variant="ghost"
            size="small"
            label={closeLabel ?? labels.drawer.close}
            icon={<span dangerouslySetInnerHTML={{ __html: iconClose }} />}
            onClick={(event) => {
              requestClose('close-button', event.nativeEvent);
            }}
          />
        </div>
      )}
      <div ref={bodyRef} className="ui-overlay__body ui-drawer__body">
        {children}
      </div>
    </dialog>
  );
}
