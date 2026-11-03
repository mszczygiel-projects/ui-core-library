import { defineComponent, type OptionOf } from './component.ts';

/** The specification of Breadcrumbs. */
export const breadcrumbs = defineComponent({
  name: 'Breadcrumbs',
  tag: 'ui-breadcrumbs',
  category: 'Navigation',
  status: 'in-progress',
  figma: '2334:2878',
  design: {
    flags: [],
    booleans: [],
    codeOnly: ['items', 'label'],
    previews: {
      collapsed: {
        options: ['false', 'true'],
        default: 'false',
        note: 'Previews a container narrower than breakpoint/sm, where the items before the last two hide behind an ellipsis. Code collapses from the width of the container.',
      },
    },
  },
  summary: 'A trail of links from the top of a site down to the current page.',
  options: {
    size: { options: ['small', 'medium'], default: 'medium' },
    separator: { options: ['chevron', 'slash'], default: 'chevron' },
  },
  labels: ['label'],
  parts: [
    'base',
    'list',
    'item',
    'link',
    'text',
    'current',
    'item-icon',
    'item-label',
    'separator',
    'ellipsis',
  ],
  slots: [],
  events: ['ui-navigate'],
  stories: ['Playground', 'Sizes', 'Separators', 'Collapsed', 'OnSurfaces'],
  exceptions: [
    {
      items: ['size'],
      reason:
        'A trail sits in running text or a page header, so it has the small and medium sizes of body text and no large one.',
    },
    {
      items: ['items'],
      reason:
        'The trail is data, like the options of a list, so that its last item is always the current page. The icon of an item is an SVG string of the icon package in the web component and a React node in React, since data cannot carry a slot.',
    },
  ],
});

/** The sizes of a trail, each following the density. */
export type BreadcrumbsSize = OptionOf<typeof breadcrumbs, 'size'>;

/** The mark between two items. It follows the direction of the text. */
export type BreadcrumbsSeparator = OptionOf<typeof breadcrumbs, 'separator'>;

/** One step of the trail. `Icon` is the type each implementation uses for a decorative icon. */
export interface BreadcrumbsItem<Icon = never> {
  /** The text of the item, which also names its link. */
  readonly label: string;
  /** The address of the page. An item without one is text, and the last item never links. */
  readonly href?: string;
  /** A decorative icon before the label, such as a home icon on the first item. */
  readonly icon?: Icon;
}

/**
 * What accompanies a press on a link: the item, its index and the native event. The package knows
 * no browser types, so each implementation names the type of the event.
 */
export interface BreadcrumbsNavigateDetails<OriginalEvent, Icon = never> {
  readonly item: BreadcrumbsItem<Icon>;
  readonly index: number;
  readonly originalEvent: OriginalEvent;
}

/** The detail of `ui-navigate`. */
export type BreadcrumbsNavigateDetail<OriginalEvent, Icon = never> = BreadcrumbsNavigateDetails<
  OriginalEvent,
  Icon
>;

/**
 * The props both implementations of Breadcrumbs share. `Icon` is the type of the icons of the
 * items, which each implementation names.
 */
export interface BreadcrumbsProps<Icon = unknown> {
  /** The steps from the top of the site to the current page, which is the last one. */
  items?: readonly BreadcrumbsItem<Icon>[];
  /** The accessible name of the navigation, falling back to `labels.breadcrumbs.label`. */
  label?: string;
  /**
   * The size of the text, which follows the density.
   * @default 'medium'
   */
  size?: BreadcrumbsSize;
  /**
   * The mark between two items.
   * @default 'chevron'
   */
  separator?: BreadcrumbsSeparator;
}
