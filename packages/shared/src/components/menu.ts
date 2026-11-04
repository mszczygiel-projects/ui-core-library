import { defineComponent, type OptionOf } from './component.ts';
import { listbox, type ListboxOption } from './listbox.ts';
import { popupPlacements } from './popover.ts';

/** The edges of its trigger with which a menu lines up, in the direction of the text. */
export const menuAlignments = ['start', 'end'] as const;

/** The specification of Menu. */
export const menu = defineComponent({
  name: 'Menu',
  tag: 'ui-menu',
  category: 'Overlays',
  status: 'in-progress',
  figma: '3202:130',
  design: {
    flags: [],
    booleans: [],
    codeOnly: ['open', 'placement', 'align', 'label', 'options'],
    previews: {},
  },
  summary:
    'A list of actions that a button opens beside it, in groups separated by a rule, for a user to pick one.',
  options: {
    size: listbox.options.size,
    placement: { options: popupPlacements, default: 'bottom' },
    align: { options: menuAlignments, default: 'start' },
  },
  labels: [],
  parts: ['base', 'menu', 'group', 'separator', 'item', 'item-icon', 'item-label'],
  slots: ['trigger'],
  events: ['ui-action', 'ui-open-change'],
  stories: ['Playground', 'Groups', 'Placements', 'OnSurfaces'],
  exceptions: [
    {
      items: ['placement'],
      reason:
        'A popup beside its trigger also opens above it, so placement adds top to the edges of the vocabulary. start and end follow the direction of the text.',
    },
    {
      items: ['align'],
      reason:
        'A menu lines up with an edge of its trigger instead of centring on it, so that a menu at the end of a row stays under the button that opened it.',
    },
    {
      items: ['defaultOpen'],
      reason:
        'React uses defaultOpen for an uncontrolled initial state. The web component uses its open attribute for that, and its property for the current state.',
    },
    {
      items: ['ui-open-change'],
      reason:
        'The web component dispatches the event before it opens or closes, and an author may cancel it. React keeps a controlled menu as it is instead.',
    },
    {
      items: ['trigger'],
      reason:
        'The menu writes aria-expanded and aria-haspopup on the element of its trigger slot, which the page gives it, so that the button announces the menu it opens.',
    },
    {
      items: ['icon'],
      reason:
        'The icon of an item is an SVG string of the icon package in the web component and a React node in React, since data cannot carry a slot.',
    },
  ],
});

/** The sizes of the items of a menu, each following the density. */
export type MenuSize = OptionOf<typeof menu, 'size'>;

/** The side of its trigger on which a menu opens. */
export type MenuPlacement = OptionOf<typeof menu, 'placement'>;

/** The edge of its trigger with which a menu lines up. */
export type MenuAlign = OptionOf<typeof menu, 'align'>;

/**
 * One action of a menu. `value` identifies the action that a pick reports, and `label` names it.
 * `Icon` is the type each implementation uses for a decorative icon.
 */
export type MenuItem<Icon = never> = ListboxOption<Icon>;

/** Actions that belong together; a rule separates a group from the one before it. */
export interface MenuGroup<Icon = never> {
  readonly options: readonly MenuItem<Icon>[];
}

/** The actions of a menu: all of them alone or all of them in groups, never both. */
export type MenuItems<Icon = never> = readonly MenuItem<Icon>[] | readonly MenuGroup<Icon>[];

/**
 * What opened or closed a menu: a press on its trigger, Escape, a press outside it and its trigger,
 * the focus leaving both, or the pick of an action.
 */
export type MenuOpenChangeReason = 'trigger' | 'escape' | 'outside' | 'focus-out' | 'action';

/**
 * What accompanies a menu that opens or closes at the request of the user. The package knows no
 * browser types, so each implementation names the type of the event.
 */
export interface MenuOpenChangeDetails<OriginalEvent> {
  readonly reason: MenuOpenChangeReason;
  /** The pointer, key or focus event that asked the menu to open or close. */
  readonly originalEvent: OriginalEvent;
}

/** The detail of `ui-open-change`: the new state and what asked for it. */
export interface MenuOpenChangeDetail<OriginalEvent> extends MenuOpenChangeDetails<OriginalEvent> {
  readonly value: boolean;
}

/** What accompanies the pick of an action: the key or pointer event that picked it. */
export interface MenuActionDetails<OriginalEvent> {
  readonly originalEvent: OriginalEvent;
}

/** The detail of `ui-action`: the value of the picked action and the event that picked it. */
export interface MenuActionDetail<OriginalEvent> extends MenuActionDetails<OriginalEvent> {
  readonly value: string;
}

/**
 * The props both implementations of Menu share. `Icon` is the type of the icons of the items,
 * which each implementation names.
 */
export interface MenuProps<Icon = unknown> {
  /**
   * Whether the menu is open. A press on the trigger opens and closes it; Escape, a pick, a press
   * outside and the focus leaving close it.
   * @default false
   */
  open?: boolean;
  /** The actions, alone or in groups that a rule separates. */
  options?: MenuItems<Icon>;
  /**
   * The size of the items, which follows the density.
   * @default 'medium'
   */
  size?: MenuSize;
  /**
   * The side of the trigger on which the menu opens. It opens on the opposite side when the window
   * has no room, and stays inside the window.
   * @default 'bottom'
   */
  placement?: MenuPlacement;
  /**
   * The edge of the trigger with which the menu lines up.
   * @default 'start'
   */
  align?: MenuAlign;
  /** The accessible name of the menu, in place of the name of its trigger. */
  label?: string;
}
