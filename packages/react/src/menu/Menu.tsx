'use client';

import {
  EMPTY_TYPEAHEAD,
  flattenOptions,
  isGrouped,
  typeahead,
} from '@mszczygiel-projects/ui-core-shared/listbox-navigation';
import {
  menu,
  type MenuActionDetails as SharedActionDetails,
  type MenuAlign,
  type MenuGroup,
  type MenuItem,
  type MenuItems,
  type MenuOpenChangeDetails as SharedOpenChangeDetails,
  type MenuOpenChangeReason,
  type MenuPlacement,
  type MenuProps as SharedMenuProps,
  type MenuSize,
} from '@mszczygiel-projects/ui-core-shared/menu';
import { menuKeyAction, openingIndex } from '@mszczygiel-projects/ui-core-shared/menu-navigation';
import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import {
  cloneElement,
  type ComponentPropsWithRef,
  isValidElement,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { classNames } from '../internal/class-names.ts';
import { rendersContent } from '../internal/renders-content.ts';
import { setRef } from '../internal/set-ref.ts';
import { usePopup } from '../internal/use-popup.ts';

export type { MenuAlign, MenuGroup, MenuItem, MenuItems, MenuPlacement, MenuSize };

/** What accompanies a menu that opens or closes at the request of the user. */
export type MenuOpenChangeDetails = SharedOpenChangeDetails<Event>;

/** What accompanies the pick of an action: the key or pointer event that picked it. */
export type MenuActionDetails = SharedActionDetails<Event>;

/** The props a trigger takes from Menu: its state, its name, its press, its keys and its element. */
interface TriggerProps {
  id?: string;
  'aria-expanded'?: boolean;
  'aria-haspopup'?: 'menu';
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
  ref?: Ref<HTMLElement>;
}

/** The props of Menu. Other attributes of a `span` go to its root element. */
export interface MenuProps
  extends
    SharedMenuProps<ReactNode>,
    Omit<ComponentPropsWithRef<'span'>, keyof SharedMenuProps | 'children'> {
  /**
   * The button that opens the menu: one element that takes a ref, `onClick` and `onKeyDown`, such
   * as Button or IconButton. Menu gives it `aria-expanded` and `aria-haspopup`.
   */
  trigger?: ReactElement<TriggerProps>;
  /** Whether the uncontrolled menu starts open. @default false */
  defaultOpen?: boolean;
  /** Called when the user asks to open or close the menu, with the reason and the native event. */
  onOpenChange?: (open: boolean, details: MenuOpenChangeDetails) => void;
  /** Called when the user picks an action, with its value and the native event. */
  onAction?: (value: string, details: MenuActionDetails) => void;
}

const { options: specOptions } = menu;

/** The layout effect of the browser, which a server render skips without a warning. */
const useBrowserLayoutEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect;

/** The index of the enabled action under a pointer event, from its data attribute. */
function enabledItemAt(event: Event): number | undefined {
  const target = event.target;
  const item = target instanceof Element ? target.closest('[role="menuitem"]') : null;
  if (item === null || item.getAttribute('aria-disabled') === 'true') {
    return undefined;
  }
  const index = Number(item.getAttribute('data-index'));
  return Number.isInteger(index) ? index : undefined;
}

function grouped(items: MenuItems<ReactNode>): items is readonly MenuGroup<ReactNode>[] {
  return isGrouped(items);
}

/**
 * A list of actions that a button opens beside it, in groups separated by a rule, for a user to
 * pick one.
 *
 * The `trigger`, a button, opens and closes the menu, and carries `aria-expanded` and
 * `aria-haspopup="menu"`; Arrow Down and Arrow Up on it open the menu on the first or the last
 * action. The menu is in the top layer, on the side that `placement` asks for and lined up with the
 * edge of the trigger that `align` names. It takes the focus and highlights an action, which the
 * arrows, Home, End and typed letters move. Enter, Space or a press picks the highlighted action,
 * which calls `onAction`, closes the menu and returns the focus to the trigger. Escape closes it
 * the same way; Tab, a press outside and the focus leaving close it too. A controlled menu follows
 * `open`, and `onOpenChange` reports each request.
 */
export function Menu({
  open,
  defaultOpen = false,
  options = [],
  size = 'medium',
  placement = 'bottom',
  align = 'start',
  label,
  trigger,
  onOpenChange,
  onAction,
  className,
  ref,
  ...rest
}: MenuProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isOpen = open ?? uncontrolledOpen;
  const [highlighted, setHighlighted] = useState(-1);
  const searchRef = useRef(EMPTY_TYPEAHEAD);
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const focusOnOpenRef = useRef(false);
  const generatedId = useId();
  const menuId = `${generatedId}-menu`;
  const itemId = (index: number) => `${menuId}-item-${String(index)}`;
  const items = flattenOptions(options);
  const menuSize = oneOf(size, specOptions.size.options, specOptions.size.default);

  const request = (next: boolean, reason: MenuOpenChangeReason, originalEvent: Event) => {
    if (next === isOpen) {
      return;
    }
    focusOnOpenRef.current = next && reason === 'trigger';
    searchRef.current = EMPTY_TYPEAHEAD;
    setUncontrolledOpen(next);
    onOpenChange?.(next, { reason, originalEvent });
    if (!next && (reason === 'escape' || reason === 'action')) {
      triggerRef.current?.focus();
    }
  };

  const openAt = (index: number, event: Event) => {
    setHighlighted(index);
    request(true, 'trigger', event);
  };

  const pick = (index: number, event: Event) => {
    const item = items[index];
    if (item === undefined || item.disabled === true) {
      return;
    }
    onAction?.(item.value, { originalEvent: event });
    request(false, 'action', event);
  };

  usePopup({
    open: isOpen,
    root: rootRef,
    anchor: triggerRef,
    popup: menuRef,
    placement: oneOf(placement, specOptions.placement.options, specOptions.placement.default),
    align: oneOf(align, specOptions.align.options, specOptions.align.default),
    onDismiss: (event) => {
      request(false, event.type === 'pointerdown' ? 'outside' : 'focus-out', event);
    },
  });

  useBrowserLayoutEffect(() => {
    if (!isOpen || !focusOnOpenRef.current) {
      return;
    }
    focusOnOpenRef.current = false;
    menuRef.current?.focus();
  }, [isOpen]);

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Tab') {
      // Tab leaves from the trigger, as if the menu were not there, and the focus leaving the
      // component closes the menu.
      triggerRef.current?.focus();
      return;
    }
    const action = menuKeyAction(items, highlighted, event.key);
    if (action === undefined) {
      const found = typeahead(searchRef.current, event.key, event.timeStamp, items, highlighted);
      if (found !== undefined) {
        event.preventDefault();
        searchRef.current = found.state;
        setHighlighted(found.index);
      }
      return;
    }
    switch (action.kind) {
      case 'highlight':
        event.preventDefault();
        setHighlighted(action.index);
        return;
      case 'activate':
        event.preventDefault();
        pick(highlighted, event.nativeEvent);
        return;
      case 'close':
        // A menu inside a modal closes first, and the modal stays open.
        event.preventDefault();
        event.stopPropagation();
        request(false, 'escape', event.nativeEvent);
        return;
    }
  };

  let index = 0;
  const renderItem = (item: MenuItem<ReactNode>) => {
    const at = index++;
    const disabled = item.disabled === true;
    return (
      <div
        key={`${String(at)}-${item.value}`}
        id={itemId(at)}
        className={classNames(
          'ui-menu__item',
          at === highlighted && 'ui-menu__item--highlighted',
          disabled && 'ui-menu__item--disabled',
        )}
        role="menuitem"
        data-index={at}
        aria-disabled={disabled || undefined}
      >
        {rendersContent(item.icon) && (
          <span className="ui-menu__item-icon" aria-hidden="true">
            {item.icon}
          </span>
        )}
        <span className="ui-menu__item-label">{item.label}</span>
      </div>
    );
  };

  const content = grouped(options)
    ? options.flatMap((group, groupIndex) => [
        ...(groupIndex > 0
          ? [
              <div
                key={`separator-${String(groupIndex)}`}
                className="ui-menu__separator"
                role="separator"
              />,
            ]
          : []),
        <div key={`group-${String(groupIndex)}`} className="ui-menu__group" role="group">
          {group.options.map(renderItem)}
        </div>,
      ])
    : options.map(renderItem);

  const triggerId =
    trigger !== undefined && isValidElement(trigger)
      ? (trigger.props.id ?? `${generatedId}-trigger`)
      : undefined;

  return (
    <span
      className={classNames('ui-menu', 'ui-menu__base', className)}
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
          id={triggerId}
          expanded={isOpen}
          onElement={(element) => {
            triggerRef.current = element;
          }}
          onPress={(event) => {
            if (isOpen) {
              request(false, 'trigger', event);
            } else {
              openAt(openingIndex(items, 'ArrowDown') ?? -1, event);
            }
          }}
          onKey={(event) => {
            if (isOpen && event.key === 'Escape') {
              event.preventDefault();
              event.stopPropagation();
              request(false, 'escape', event.nativeEvent);
              return;
            }
            const at = isOpen ? undefined : openingIndex(items, event.key);
            if (at !== undefined) {
              event.preventDefault();
              openAt(at, event.nativeEvent);
            }
          }}
        />
      )}
      <div
        ref={menuRef}
        id={menuId}
        className={`ui-menu__menu ui-menu__menu--${menuSize}`}
        popover="manual"
        role="menu"
        aria-label={label}
        aria-labelledby={label === undefined ? triggerId : undefined}
        aria-activedescendant={isOpen && highlighted >= 0 ? itemId(highlighted) : undefined}
        tabIndex={-1}
        onKeyDown={onMenuKeyDown}
        // The pointer keeps the focus on the menu, which names the highlighted action.
        onMouseDown={(event) => {
          event.preventDefault();
        }}
        onClick={(event) => {
          const at = enabledItemAt(event.nativeEvent);
          if (at !== undefined) {
            pick(at, event.nativeEvent);
          }
        }}
        onPointerMove={(event) => {
          const at = enabledItemAt(event.nativeEvent);
          if (at !== undefined && at !== highlighted) {
            setHighlighted(at);
          }
        }}
      >
        {content}
      </div>
    </span>
  );
}

/**
 * The page's own button, given the relationship to the menu, its press and its keys. It renders
 * through an element of its own, so that its element reaches both Menu and the page's ref.
 */
function Trigger({
  element,
  id,
  expanded,
  onElement,
  onPress,
  onKey,
}: {
  readonly element: ReactElement<TriggerProps>;
  readonly id: string | undefined;
  readonly expanded: boolean;
  readonly onElement: (element: HTMLElement | null) => void;
  readonly onPress: (event: Event) => void;
  readonly onKey: (event: KeyboardEvent<HTMLElement>) => void;
}) {
  const { onClick, onKeyDown, ref: pageRef } = element.props;
  // eslint-disable-next-line @eslint-react/no-clone-element -- a slot that takes one button
  return cloneElement(element, {
    id,
    'aria-expanded': expanded,
    'aria-haspopup': 'menu',
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
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      onKeyDown?.(event);
      if (!event.defaultPrevented) {
        onKey(event);
      }
    },
  });
}
