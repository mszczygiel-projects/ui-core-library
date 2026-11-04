import { defineComponent, type OptionOf } from './component.ts';

/** The specification of Tabs. */
export const tabs = defineComponent({
  name: 'Tabs',
  tag: 'ui-tabs',
  category: 'Content',
  status: 'in-progress',
  figma: '3226:82',
  design: { flags: [], booleans: [], codeOnly: ['value', 'label'], previews: {} },
  summary: 'A list of tabs, each of which shows its own panel of content in place of the others.',
  options: {
    variant: { options: ['underline', 'segmented'], default: 'underline' },
    orientation: { options: ['horizontal', 'vertical'], default: 'horizontal' },
  },
  labels: [],
  parts: ['base', 'list', 'tab', 'tab-icon', 'tab-label', 'panel'],
  slots: [],
  events: ['ui-value-change'],
  stories: [
    'Playground',
    'Segmented',
    'Vertical',
    'WithIcons',
    'WithDisabledTab',
    'Overflow',
    'OnSurfaces',
  ],
  exceptions: [
    {
      items: ['orientation'],
      reason:
        'Tabs are a row above their content in most pages, so the default orientation is horizontal, unlike the groups of options, which stack.',
    },
    {
      items: ['defaultValue'],
      reason:
        'React uses defaultValue for an uncontrolled initial tab. The web component uses its value attribute for that, and its property for the current tab.',
    },
    {
      items: ['ui-value-change'],
      reason:
        'The arrow keys select the tab they move to, as the pattern of WAI-ARIA recommends when the panels are already in the page. Find in page and a link to a text fragment select the tab of a match with the reason find, since the browser has already revealed it. The event cannot be canceled: a controlled React parent keeps the tab by not changing value.',
    },
    {
      items: ['tab', 'tab-icon', 'tab-label', 'panel'],
      reason:
        'Tabs renders the tab of each Tab and the panel around its content, so that the tabs, the list and the panels that name one another are in one tree. Their parts belong to Tabs.',
    },
  ],
});

/** How the tabs look: a line under the selected tab, or a filled tab in a frame. */
export type TabsVariant = OptionOf<typeof tabs, 'variant'>;

/** The direction in which the tabs follow each other. */
export type TabsOrientation = OptionOf<typeof tabs, 'orientation'>;

/**
 * What selected a tab: a press or a key on the tab, or find in page or a link to a text fragment
 * in its hidden panel.
 */
export type TabsValueChangeReason = 'trigger' | 'find';

/**
 * What accompanies a new tab. The package knows no browser types, so each implementation names the
 * type of the event.
 */
export interface TabsValueChangeDetails<OriginalEvent> {
  readonly reason: TabsValueChangeReason;
  /** The click, the key press or the `beforematch` event. */
  readonly originalEvent: OriginalEvent;
}

/** The detail of `ui-value-change`: the value of the selected tab and what selected it. */
export interface TabsValueChangeDetail<
  OriginalEvent,
> extends TabsValueChangeDetails<OriginalEvent> {
  readonly value: string;
}

/** The props both implementations of Tabs share. */
export interface TabsProps {
  /**
   * The value of the selected tab. A value that no tab has selects the first enabled tab.
   */
  value?: string;
  /**
   * How the tabs look: a line under the selected tab, or a filled tab in a frame.
   * @default 'underline'
   */
  variant?: TabsVariant;
  /**
   * The direction in which the tabs follow each other, which also sets the arrow keys that move
   * between them.
   * @default 'horizontal'
   */
  orientation?: TabsOrientation;
  /**
   * The accessible name of the list of tabs. Leave it out when a heading before the tabs names
   * them.
   */
  label?: string;
}
