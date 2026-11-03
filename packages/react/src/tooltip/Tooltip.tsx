'use client';

import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import {
  tooltip,
  type TooltipProps as SharedTooltipProps,
} from '@mszczygiel-projects/ui-core-shared/tooltip';
import {
  hideTooltip,
  opensAtOnce,
  showTooltip,
} from '@mszczygiel-projects/ui-core-shared/tooltip-group';
import {
  cloneElement,
  type ComponentPropsWithRef,
  isValidElement,
  type ReactElement,
  type Ref,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { classNames } from '../internal/class-names.ts';
import { setRef } from '../internal/set-ref.ts';
import { usePopup } from '../internal/use-popup.ts';

/** The props a trigger takes from Tooltip: its description and its element. */
interface TriggerProps {
  'aria-describedby'?: string;
  ref?: Ref<HTMLElement>;
}

/** The props of Tooltip. Other attributes of a `span` go to its root element. */
export interface TooltipProps
  extends
    SharedTooltipProps,
    Omit<ComponentPropsWithRef<'span'>, keyof SharedTooltipProps | 'children' | 'content'> {
  /**
   * The trigger: one element that takes the focus and a ref, such as a Button or an IconButton.
   * Tooltip adds its text to the `aria-describedby` of the element.
   */
  children: ReactElement<TriggerProps>;
}

const { options } = tooltip;

/** The layout effect of the browser, which a server render skips without a warning. */
const useBrowserLayoutEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect;

/** The duration of a token in milliseconds, which the bubble holds as a private property. */
function duration(element: Element | null, property: string): number {
  if (element === null) {
    return 0;
  }
  const value = getComputedStyle(element).getPropertyValue(property).trim();
  const amount = Number.parseFloat(value);
  if (Number.isNaN(amount)) {
    return 0;
  }
  return value.endsWith('ms') ? amount : value.endsWith('s') ? amount * 1000 : amount;
}

/** The focused element, inside the shadow roots too. */
function deepActiveElement(): Element | null {
  let element = document.activeElement;
  while (element?.shadowRoot?.activeElement) {
    element = element.shadowRoot.activeElement;
  }
  return element;
}

/**
 * A short text that names or describes an element while the pointer rests on it or the keyboard
 * focuses it.
 *
 * The child is the trigger, which the text describes. The bubble shows after a delay when a mouse
 * rests on the trigger, at once when the keyboard focuses it, and at once while another tooltip of
 * the page is shown or has just hidden. It stays while the pointer moves onto it, and hides when
 * the pointer leaves both, when the focus leaves, on a press and on Escape, which no modal around
 * it then sees. The bubble opens in the top layer, on the side that `placement` asks for or the
 * opposite one when the window has no room. Touch shows nothing, so the text must not be the only
 * way to a piece of information.
 */
export function Tooltip({
  content,
  placement = 'top',
  showArrow = false,
  className,
  children,
  ref,
  ...rest
}: TooltipProps) {
  const [shown, setShown] = useState(false);
  const id = useId();
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const arrowRef = useRef<HTMLSpanElement | null>(null);
  const side = oneOf(placement, options.placement.options, options.placement.default);
  const hasContent = typeof content === 'string' && content !== '';
  const hasContentRef = useRef(hasContent);
  useBrowserLayoutEffect(() => {
    hasContentRef.current = hasContent;
  });

  usePopup({
    open: shown,
    root: rootRef,
    anchor: triggerRef,
    popup: bubbleRef,
    placement: side,
    centred: true,
    arrow: arrowRef,
    onDismiss: () => {
      setShown(false);
    },
  });

  // The group of the page learns when this tooltip shows and hides, and hides it for another one.
  const ownerRef = useRef({});
  useBrowserLayoutEffect(() => {
    if (!shown) {
      return;
    }
    const owner = ownerRef.current;
    showTooltip(owner, () => {
      setShown(false);
    });
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // The tooltip closes first; a modal around it stays open.
        event.preventDefault();
        event.stopPropagation();
        setShown(false);
      }
    };
    document.addEventListener('keydown', onEscape, { capture: true });
    return () => {
      document.removeEventListener('keydown', onEscape, { capture: true });
      hideTooltip(owner, performance.now());
    };
  }, [shown]);

  useBrowserLayoutEffect(() => {
    const root = rootRef.current;
    if (root === null) {
      return;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    let visible = false;
    const show = () => {
      clearTimeout(timer);
      if (hasContentRef.current) {
        visible = true;
        setShown(true);
      }
    };
    const hide = () => {
      clearTimeout(timer);
      visible = false;
      setShown(false);
    };
    const onPointerOver = (event: PointerEvent) => {
      // Touch has no hover, and a press on the trigger is its own action.
      if (event.pointerType !== 'mouse') {
        return;
      }
      visible = bubbleRef.current?.matches(':popover-open') ?? visible;
      if (visible) {
        clearTimeout(timer);
        return;
      }
      const trigger = triggerRef.current;
      if (trigger === null || !event.composedPath().includes(trigger)) {
        return;
      }
      clearTimeout(timer);
      const delay = duration(bubbleRef.current, '--_show-delay');
      if (opensAtOnce(performance.now(), delay)) {
        show();
      } else {
        timer = setTimeout(show, delay);
      }
    };
    const onPointerOut = (event: PointerEvent) => {
      const next = event.relatedTarget;
      // The pointer moves between the trigger and the bubble, both inside the root.
      if (next instanceof Node && root.contains(next)) {
        return;
      }
      clearTimeout(timer);
      if (bubbleRef.current?.matches(':popover-open') === true) {
        timer = setTimeout(hide, duration(bubbleRef.current, '--_hide-delay'));
      }
    };
    const onFocusIn = () => {
      // The keyboard shows the tooltip at once; a press that focuses the trigger shows nothing.
      if (deepActiveElement()?.matches(':focus-visible') === true) {
        show();
      }
    };
    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget;
      if (!(next instanceof Node && root.contains(next))) {
        hide();
      }
    };
    root.addEventListener('pointerover', onPointerOver);
    root.addEventListener('pointerout', onPointerOut);
    root.addEventListener('pointerdown', hide);
    root.addEventListener('focusin', onFocusIn);
    root.addEventListener('focusout', onFocusOut);
    return () => {
      clearTimeout(timer);
      root.removeEventListener('pointerover', onPointerOver);
      root.removeEventListener('pointerout', onPointerOut);
      root.removeEventListener('pointerdown', hide);
      root.removeEventListener('focusin', onFocusIn);
      root.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  return (
    <span
      className={classNames('ui-tooltip', className)}
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
      {isValidElement(children) && (
        <Trigger
          element={children}
          describedBy={hasContent ? id : undefined}
          onElement={(element) => {
            triggerRef.current = element;
          }}
        />
      )}
      <div
        ref={bubbleRef}
        id={id}
        className="ui-tooltip__bubble ui-floating"
        popover="manual"
        role="tooltip"
      >
        {showArrow && (
          <span
            ref={arrowRef}
            className="ui-tooltip__arrow ui-floating__arrow"
            aria-hidden="true"
          />
        )}
        {content}
      </div>
    </span>
  );
}

/**
 * The page's own trigger, described by the tooltip. It renders through an element of its own, so
 * that its element reaches both Tooltip and the page's ref.
 */
function Trigger({
  element,
  describedBy,
  onElement,
}: {
  readonly element: ReactElement<TriggerProps>;
  readonly describedBy: string | undefined;
  readonly onElement: (element: HTMLElement | null) => void;
}) {
  const { 'aria-describedby': own, ref: pageRef } = element.props;
  const ids = [own, describedBy].filter((value) => value !== undefined && value !== '').join(' ');
  // eslint-disable-next-line @eslint-react/no-clone-element -- a slot that takes one trigger
  return cloneElement(element, {
    'aria-describedby': ids === '' ? undefined : ids,
    ref: (node: HTMLElement | null) => {
      onElement(node);
      const release = setRef(pageRef, node);
      return () => {
        onElement(null);
        release();
      };
    },
  });
}
