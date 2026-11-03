'use client';

import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import {
  popover,
  type PopoverOpenChangeDetails as SharedOpenChangeDetails,
  type PopoverOpenChangeReason,
  type PopoverProps as SharedPopoverProps,
} from '@mszczygiel-projects/ui-core-shared/popover';
import {
  cloneElement,
  type ComponentPropsWithRef,
  isValidElement,
  type MouseEvent,
  type ReactElement,
  type Ref,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { classNames } from '../internal/class-names.ts';
import { setRef } from '../internal/set-ref.ts';
import { usePopup } from '../internal/use-popup.ts';

/** What accompanies a popover that opens or closes at the request of the user. */
export type PopoverOpenChangeDetails = SharedOpenChangeDetails<Event>;

/** The props a trigger takes from Popover: its state, its press and its element. */
interface TriggerProps {
  'aria-expanded'?: boolean;
  'aria-haspopup'?: 'dialog';
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  ref?: Ref<HTMLElement>;
}

/** The props of Popover. Other attributes of a `span` go to its root element. */
export interface PopoverProps
  extends SharedPopoverProps, Omit<ComponentPropsWithRef<'span'>, keyof SharedPopoverProps> {
  /**
   * The button that opens the panel: one element that takes a ref and `onClick`, such as Button
   * or IconButton. Popover gives it `aria-expanded` and `aria-haspopup`.
   */
  trigger?: ReactElement<TriggerProps>;
  /** Whether the uncontrolled panel starts open. @default false */
  defaultOpen?: boolean;
  /** Called when the user asks to open or close the panel, with the reason and the native event. */
  onOpenChange?: (open: boolean, details: PopoverOpenChangeDetails) => void;
}

const { options } = popover;

/** The layout effect of the browser, which a server render skips without a warning. */
const useBrowserLayoutEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect;

/**
 * A panel that a button opens beside it, over the page, with content that the page around it can
 * still be used with.
 *
 * The `trigger`, a button, opens and closes the panel, and carries `aria-expanded` and
 * `aria-haspopup`. The panel is a non-modal dialog in the top layer, on the side that `placement`
 * asks for or the opposite one when the window has no room. When a press on the trigger opens it,
 * the focus moves to the element marked with `autofocus` or `data-autofocus`, else to the panel.
 * Escape closes it and returns the focus to the trigger; a press outside and the focus leaving
 * close it too. A controlled panel follows `open`, and `onOpenChange` reports each request.
 */
export function Popover({
  open,
  defaultOpen = false,
  placement = 'bottom',
  showArrow = false,
  label,
  trigger,
  onOpenChange,
  className,
  children,
  ref,
  ...rest
}: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isOpen = open ?? uncontrolledOpen;
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const arrowRef = useRef<HTMLSpanElement | null>(null);
  const focusOnOpenRef = useRef(false);
  const side = oneOf(placement, options.placement.options, options.placement.default);

  const request = (next: boolean, reason: PopoverOpenChangeReason, originalEvent: Event) => {
    if (next === isOpen) {
      return;
    }
    focusOnOpenRef.current = next && reason === 'trigger';
    setUncontrolledOpen(next);
    onOpenChange?.(next, { reason, originalEvent });
    if (!next && reason === 'escape') {
      triggerRef.current?.focus();
    }
  };

  usePopup({
    open: isOpen,
    root: rootRef,
    anchor: triggerRef,
    popup: panelRef,
    placement: side,
    centred: true,
    arrow: arrowRef,
    onDismiss: (event) => {
      request(false, event.type === 'pointerdown' ? 'outside' : 'focus-out', event);
    },
  });

  const escapeRef = useRef(request);
  useBrowserLayoutEffect(() => {
    escapeRef.current = request;
  });

  useBrowserLayoutEffect(() => {
    const root = rootRef.current;
    if (!isOpen || root === null) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        // A popover inside a modal closes first, and the modal stays open.
        event.preventDefault();
        event.stopPropagation();
        escapeRef.current(false, 'escape', event);
      }
    };
    root.addEventListener('keydown', onKeyDown);
    return () => {
      root.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  useBrowserLayoutEffect(() => {
    if (!isOpen || !focusOnOpenRef.current) {
      return;
    }
    focusOnOpenRef.current = false;
    const panel = panelRef.current;
    const target = panel?.querySelector<HTMLElement>('[autofocus], [data-autofocus]');
    (target ?? panel)?.focus();
  }, [isOpen]);

  return (
    <span
      className={classNames('ui-popover', className)}
      ref={(element) => {
        rootRef.current = element;
        const release = setRef(ref, element);
        return () => {
          rootRef.current = null;
          release();
        };
      }}
      {...rest}
    >
      {trigger !== undefined && isValidElement(trigger) && (
        <Trigger
          element={trigger}
          expanded={isOpen}
          onElement={(element) => {
            triggerRef.current = element;
          }}
          onPress={(event) => {
            request(!isOpen, 'trigger', event);
          }}
        />
      )}
      <div
        ref={panelRef}
        className="ui-popover__panel ui-floating"
        popover="manual"
        role="dialog"
        aria-label={label}
        tabIndex={-1}
      >
        {showArrow && (
          <span
            ref={arrowRef}
            className="ui-popover__arrow ui-floating__arrow"
            aria-hidden="true"
          />
        )}
        {children}
      </div>
    </span>
  );
}

/**
 * The page's own button, given the relationship to the panel and its press. It renders through
 * an element of its own, so that its element reaches both Popover and the page's ref.
 */
function Trigger({
  element,
  expanded,
  onElement,
  onPress,
}: {
  readonly element: ReactElement<TriggerProps>;
  readonly expanded: boolean;
  readonly onElement: (element: HTMLElement | null) => void;
  readonly onPress: (event: Event) => void;
}) {
  const { onClick, ref: pageRef } = element.props;
  // eslint-disable-next-line @eslint-react/no-clone-element -- a slot that takes one button
  return cloneElement(element, {
    'aria-expanded': expanded,
    'aria-haspopup': 'dialog',
    ref: (node: HTMLElement | null) => {
      onElement(node);
      const release = setRef(pageRef, node);
      return () => {
        onElement(null);
        release();
      };
    },
    onClick: (event: MouseEvent<HTMLElement>) => {
      onClick?.(event);
      if (!event.defaultPrevented) {
        onPress(event.nativeEvent);
      }
    },
  });
}
