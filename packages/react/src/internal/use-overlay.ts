'use client';

import type {
  OverlayCloseReason,
  OverlayOpenChangeDetails,
} from '@mszczygiel-projects/ui-core-shared/dialog';
import { type RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { type CloseRequest, Overlay, type OverlayOptions } from './overlay.ts';

/** The layout effect of the browser, which a server render skips without a warning. */
const useBrowserLayoutEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect;

/** What a modal gives its native dialog, besides the refs that the controller reads. */
export interface UseOverlayOptions extends Omit<OverlayOptions, 'dialog' | 'onCloseRequest'> {
  readonly dialog: RefObject<HTMLDialogElement | null>;
  /** The controlled open state, or undefined for an uncontrolled modal. */
  readonly open: boolean | undefined;
  readonly defaultOpen: boolean;
  readonly onOpenChange:
    ((open: boolean, details: OverlayOpenChangeDetails<Event>) => void) | undefined;
}

/**
 * The open state of a modal and its native dialog. The modal opens only from its props, after
 * hydration, and closes at the request of the user: an uncontrolled modal at once, a controlled
 * one when its parent agrees. A dialog that the browser closed by force stays closed until its
 * props close and open it again.
 */
export function useOverlay({
  dialog,
  open,
  defaultOpen,
  onOpenChange,
  ...options
}: UseOverlayOptions): {
  readonly isOpen: boolean;
  /** Asks the modal to close, as its close button does. */
  readonly requestClose: (reason: OverlayCloseReason, originalEvent: Event) => boolean;
} {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const [forcedClosed, setForcedClosed] = useState(false);
  const requested = open ?? uncontrolledOpen;
  const isOpen = requested && !forcedClosed;
  if (!requested && forcedClosed) {
    setForcedClosed(false);
  }

  const latest = useRef({ options, onOpenChange, isOpen });
  useBrowserLayoutEffect(() => {
    latest.current = { options, onOpenChange, isOpen };
  });
  const returnValue = useRef('');

  const [{ overlay, requestClose }] = useState(() => {
    const onCloseRequest = ({
      reason,
      returnValue: value,
      originalEvent,
      forced,
    }: CloseRequest): boolean => {
      if (!latest.current.isOpen) {
        return false;
      }
      returnValue.current = value;
      latest.current.onOpenChange?.(false, { reason, returnValue: value, originalEvent });
      setUncontrolledOpen(false);
      if (forced) {
        setForcedClosed(true);
      }
      return true;
    };
    return {
      overlay: new Overlay({
        dialog: () => dialog.current,
        content: () => latest.current.options.content(),
        closesOnBackdrop: () => latest.current.options.closesOnBackdrop(),
        dragHandles: () => latest.current.options.dragHandles(),
        dragExcluded: () => latest.current.options.dragExcluded(),
        onDragging: (dragging) => {
          latest.current.options.onDragging(dragging);
        },
        onCloseRequest,
      }),
      requestClose: (reason: OverlayCloseReason, originalEvent: Event) =>
        onCloseRequest({ reason, returnValue: '', originalEvent, forced: false }),
    };
  });

  useBrowserLayoutEffect(() => {
    if (!isOpen) {
      return;
    }
    returnValue.current = '';
    overlay.show();
    return () => {
      overlay.hide(returnValue.current);
    };
  }, [isOpen, overlay]);

  return { isOpen, requestClose };
}
