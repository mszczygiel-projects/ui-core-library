import {
  EMPTY_TYPEAHEAD,
  flattenOptions,
  isGrouped,
  typeahead,
  type TypeaheadState,
} from '@mszczygiel-projects/ui-core-shared/listbox-navigation';
import {
  menu,
  type MenuAlign,
  type MenuGroup,
  type MenuItem,
  type MenuItems,
  type MenuOpenChangeReason,
  type MenuPlacement,
  type MenuProps,
  type MenuSize,
} from '@mszczygiel-projects/ui-core-shared/menu';
import { menuKeyAction, openingIndex } from '@mszczygiel-projects/ui-core-shared/menu-navigation';
import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import {
  Component,
  Element,
  Event,
  type EventEmitter,
  h,
  Prop,
  State,
  type VNode,
} from '@stencil/core';

import { Popup } from '../internal/popup.ts';
import type { MenuAction, MenuOpenChange } from './events.ts';

const { options } = menu;

/** The items of a web component carry their icon as the SVG string of the icon package. */
export type WebMenuItems = MenuItems<string>;

function grouped(items: WebMenuItems): items is readonly MenuGroup<string>[] {
  return isGrouped(items);
}

/** The id of the item at `index`, which `aria-activedescendant` names. */
function itemId(index: number): string {
  return `item-${String(index)}`;
}

/** An element whose ARIA relationships the browser reflects as element references. */
interface ReflectedLabel {
  ariaLabelledByElements: readonly Element[] | null;
}

function reflectsLabel(element: Element): element is Element & ReflectedLabel {
  return 'ariaLabelledByElements' in element;
}

/**
 * A list of actions that a button opens beside it, in groups separated by a rule, for a user to
 * pick one.
 *
 * The element of the `trigger` slot, a button, opens and closes the menu, and carries
 * `aria-expanded` and `aria-haspopup="menu"`; Arrow Down and Arrow Up on it open the menu on the
 * first or the last action. The menu is in the top layer, on the side that `placement` asks for and
 * lined up with the edge of the trigger that `align` names, or on the opposite side when the window
 * has no room. It takes the focus and highlights an action, which the arrows, Home, End and typed
 * letters move. Enter, Space or a press picks the highlighted action, which dispatches
 * `ui-action`, closes the menu and returns the focus to the trigger. Escape closes it the same way;
 * Tab, a press outside and the focus leaving close it too. Each request to open or close
 * dispatches the cancelable `ui-open-change` first, and the reflected `open` attribute follows the
 * menu.
 *
 * @slot trigger - The button that opens the menu.
 * @part base - The wrapper of the trigger and the menu.
 * @part menu - The menu, with the role menu.
 * @part group - A group of actions.
 * @part separator - The rule before every group but the first.
 * @part item - An action.
 * @part item-icon - The decorative icon of an action.
 * @part item-label - The text of an action.
 */
@Component({ tag: 'ui-menu', styleUrl: 'menu.css', shadow: true })
export class UiMenu implements MenuProps<string> {
  @Element() host!: HTMLUiMenuElement;

  /** Whether the menu is open. The attribute supplies the initial state and follows the menu. */
  @Prop({ mutable: true, reflect: true }) open = false;

  /**
   * The actions, alone or in groups that a rule separates. An icon is the SVG string of an icon
   * of the icon package.
   */
  @Prop() options: WebMenuItems = [];

  /** The size of the items, which follows the density. */
  @Prop() size: MenuSize = 'medium';

  /** The side of the trigger on which the menu opens. */
  @Prop() placement: MenuPlacement = 'bottom';

  /** The edge of the trigger with which the menu lines up. */
  @Prop() align: MenuAlign = 'start';

  /** The accessible name of the menu, in place of the name of its trigger. */
  @Prop() label?: string;

  /** The user asked to open or close the menu; canceling it keeps the menu as it is. */
  @Event({ eventName: 'ui-open-change' }) openChange!: EventEmitter<MenuOpenChange>;

  /** The user picked an action. */
  @Event({ eventName: 'ui-action' }) action!: EventEmitter<MenuAction>;

  /** The index of the highlighted action among all actions, or -1. */
  @State() private highlighted = -1;

  private trigger: HTMLElement | null = null;

  private search: TypeaheadState = EMPTY_TYPEAHEAD;

  /** Moves the focus into the menu once it has rendered open. */
  private focusOnOpen = false;

  private readonly popup = new Popup({
    host: () => this.host,
    anchor: () => this.trigger,
    popup: () => this.menu(),
    placement: () => oneOf(this.placement, options.placement.options, options.placement.default),
    align: () => oneOf(this.align, options.align.options, options.align.default),
    onDismiss: (event) => {
      this.request(false, event.type === 'pointerdown' ? 'outside' : 'focus-out', event);
    },
  });

  connectedCallback(): void {
    this.host.addEventListener('click', this.onClick);
    this.host.addEventListener('keydown', this.onKeyDown);
  }

  disconnectedCallback(): void {
    this.host.removeEventListener('click', this.onClick);
    this.host.removeEventListener('keydown', this.onKeyDown);
    this.popup.hide();
  }

  componentDidRender(): void {
    this.trigger?.setAttribute('aria-expanded', String(this.open));
    const element = this.menu();
    if (element !== null && reflectsLabel(element)) {
      element.ariaLabelledByElements =
        this.label === undefined && this.trigger !== null ? [this.trigger] : null;
    }
    if (this.open) {
      this.popup.show();
      if (this.focusOnOpen) {
        this.focusOnOpen = false;
        element?.focus();
      }
      // The keys can highlight an action below or above the scrolled edge of a long menu.
      element
        ?.querySelector(`#${CSS.escape(itemId(this.highlighted))}`)
        ?.scrollIntoView({ block: 'nearest' });
    } else {
      this.popup.hide();
    }
  }

  render(): VNode {
    const size = oneOf(this.size, options.size.options, options.size.default);
    const items: VNode[] = [];
    let index = 0;
    const itemOf = (item: MenuItem<string>): VNode => {
      const at = index++;
      return this.renderItem(item, at);
    };
    if (grouped(this.options)) {
      this.options.forEach((group, groupIndex) => {
        if (groupIndex > 0) {
          items.push(<div part="separator" class="separator" role="separator" />);
        }
        items.push(
          <div part="group" class="group" role="group">
            {group.options.map(itemOf)}
          </div>,
        );
      });
    } else {
      items.push(...this.options.map(itemOf));
    }
    return (
      <span part="base" class="base">
        <slot name="trigger" onSlotchange={this.onTriggerChange} />
        <div
          part="menu"
          class={`menu ${size}`}
          popover="manual"
          hidden={typeof HTMLElement.prototype.showPopover !== 'function'}
          role="menu"
          aria-label={this.label}
          aria-activedescendant={this.highlighted >= 0 ? itemId(this.highlighted) : undefined}
          tabindex={-1}
        >
          {items}
        </div>
      </span>
    );
  }

  private renderItem(item: MenuItem<string>, index: number): VNode {
    const disabled = item.disabled === true;
    const classes = [
      'item',
      index === this.highlighted ? 'highlighted' : '',
      disabled ? 'disabled' : '',
    ]
      .filter((name) => name !== '')
      .join(' ');
    return (
      <div
        id={itemId(index)}
        part="item"
        class={classes}
        role="menuitem"
        aria-disabled={disabled ? 'true' : undefined}
        // The pointer keeps the focus on the menu, which names the highlighted action.
        onMouseDown={(event: MouseEvent) => {
          event.preventDefault();
        }}
        onClick={(event: MouseEvent) => {
          this.pick(index, event);
        }}
        onPointerMove={() => {
          if (!disabled && index !== this.highlighted) {
            this.highlighted = index;
          }
        }}
      >
        {item.icon === undefined ? null : (
          <span part="item-icon" class="item-icon" aria-hidden="true" innerHTML={item.icon} />
        )}
        <span part="item-label" class="item-label">
          {item.label}
        </span>
      </div>
    );
  }

  private menu(): HTMLElement | null {
    return this.host.shadowRoot?.querySelector<HTMLElement>('.menu') ?? null;
  }

  private items(): readonly MenuItem<string>[] {
    return flattenOptions(this.options);
  }

  /** Asks to open or close the menu, unless the page cancels the request. */
  private request(
    open: boolean,
    reason: MenuOpenChangeReason,
    originalEvent: globalThis.Event,
  ): void {
    if (this.open === open) {
      return;
    }
    const event = this.openChange.emit({ value: open, reason, originalEvent });
    if (event.defaultPrevented) {
      return;
    }
    this.focusOnOpen = open && reason === 'trigger';
    this.search = EMPTY_TYPEAHEAD;
    if (!open) {
      this.highlighted = -1;
    }
    this.open = open;
    if (!open && (reason === 'escape' || reason === 'action')) {
      this.trigger?.focus();
    }
  }

  /** Opens the menu with the action at `index` highlighted, -1 for none. */
  private openAt(index: number, event: globalThis.Event): void {
    this.highlighted = index;
    this.request(true, 'trigger', event);
    if (!this.open) {
      this.highlighted = -1;
    }
  }

  private pick(index: number, event: globalThis.Event): void {
    const item = this.items()[index];
    if (item === undefined || item.disabled === true) {
      return;
    }
    this.action.emit({ value: item.value, originalEvent: event });
    this.request(false, 'action', event);
  }

  /** The first element of the trigger slot is the button, which names the menu it opens. */
  private readonly onTriggerChange = (event: globalThis.Event): void => {
    const slot = event.target;
    if (!(slot instanceof HTMLSlotElement)) {
      return;
    }
    const [element] = slot.assignedElements();
    if (this.trigger !== null && this.trigger !== element) {
      this.trigger.removeAttribute('aria-expanded');
      this.trigger.removeAttribute('aria-haspopup');
    }
    this.trigger = element instanceof HTMLElement ? element : null;
    this.trigger?.setAttribute('aria-haspopup', 'menu');
    this.trigger?.setAttribute('aria-expanded', String(this.open));
    const menuElement = this.menu();
    if (menuElement !== null && reflectsLabel(menuElement)) {
      menuElement.ariaLabelledByElements =
        this.label === undefined && this.trigger !== null ? [this.trigger] : null;
    }
    // A menu that starts open waits for its trigger, which places it.
    if (this.open) {
      this.popup.show();
    }
  };

  private readonly onClick = (event: MouseEvent): void => {
    if (this.trigger === null || !event.composedPath().includes(this.trigger)) {
      return;
    }
    if (this.open) {
      this.request(false, 'trigger', event);
    } else {
      this.openAt(openingIndex(this.items(), 'ArrowDown') ?? -1, event);
    }
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    const path = event.composedPath();
    const element = this.menu();
    if (this.open && element !== null && path.includes(element)) {
      this.onMenuKeyDown(event);
      return;
    }
    if (this.trigger === null || !path.includes(this.trigger)) {
      return;
    }
    if (this.open && event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.request(false, 'escape', event);
      return;
    }
    const index = this.open ? undefined : openingIndex(this.items(), event.key);
    if (index !== undefined) {
      event.preventDefault();
      this.openAt(index, event);
    }
  };

  private onMenuKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Tab') {
      // Tab leaves from the trigger, as if the menu were not there, and the focus leaving the
      // component closes the menu; a top-layer menu would otherwise send it back to the trigger.
      this.trigger?.focus();
      return;
    }
    const items = this.items();
    const action = menuKeyAction(items, this.highlighted, event.key);
    if (action === undefined) {
      const found = typeahead(this.search, event.key, event.timeStamp, items, this.highlighted);
      if (found !== undefined) {
        event.preventDefault();
        this.search = found.state;
        this.highlighted = found.index;
      }
      return;
    }
    switch (action.kind) {
      case 'highlight':
        event.preventDefault();
        this.highlighted = action.index;
        return;
      case 'activate':
        event.preventDefault();
        this.pick(this.highlighted, event);
        return;
      case 'close':
        // A menu inside a modal closes first, and the modal stays open.
        event.preventDefault();
        event.stopPropagation();
        this.request(false, 'escape', event);
        return;
    }
  }
}

/**
 * Every prop of the specification is a prop of the component. `implements` alone accepts a class
 * that leaves out an optional prop, so a prop added to the specification would go unnoticed.
 */
type _DeclaresEveryProp = Pick<UiMenu, keyof MenuProps>;
