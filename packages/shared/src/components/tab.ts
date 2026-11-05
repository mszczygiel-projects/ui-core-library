import { defineComponent } from './component.ts';
import { tabs } from './tabs.ts';

/** The specification of Tab. */
export const tab = defineComponent({
  name: 'Tab',
  tag: 'ui-tab',
  category: 'Content',
  status: 'in-progress',
  figma: '3225:158',
  partOf: 'Tabs',
  design: {
    flags: ['disabled'],
    booleans: [],
    codeOnly: ['value'],
    previews: {
      variant: {
        ...tabs.options.variant,
        note: 'Follows the variant of the Tabs that holds the tab.',
      },
      orientation: {
        ...tabs.options.orientation,
        note: 'Follows the orientation of the Tabs that holds the tab.',
      },
      selected: {
        options: ['false', 'true'],
        default: 'false',
        note: 'Previews the selected tab, which the value of Tabs chooses in code.',
      },
      hasIcon: {
        options: ['false', 'true'],
        default: 'false',
        note: 'Shows the icon, which code shows when icon is set. Choose it with the icon property.',
      },
      interaction: {
        options: ['rest', 'active', 'focus'],
        default: 'rest',
        note: 'Previews hover and press (active) and keyboard focus of the tab. Leave it at rest in a design.',
      },
    },
  },
  summary: 'One tab of Tabs: its label, an optional icon, and the content of its panel.',
  options: {},
  labels: [],
  parts: [],
  slots: [],
  events: [],
  stories: [],
  exceptions: [
    {
      items: ['parts'],
      reason:
        'Tab only holds the content of its panel. Tabs renders its tab and its panel, so the parts belong to Tabs.',
    },
    {
      items: ['icon'],
      reason:
        'The icon is an SVG string of the icon package in the web component and a React node in React, since Tabs renders it in its own list and a slot of a Tab cannot reach there.',
    },
  ],
});

/**
 * The props both implementations of Tab share. `Icon` is the type each implementation uses for a
 * decorative icon.
 */
export interface TabProps<Icon = unknown> {
  /** The value that selects the tab, unique among the tabs of a Tabs. */
  value: string;
  /** The text of the tab, which names the tab and its panel. */
  label: string;
  /** A decorative icon before the label. The label stays the name of the tab. */
  icon?: Icon;
  /**
   * Keeps the tab from being selected and takes it out of the arrow keys.
   * @default false
   */
  disabled?: boolean;
}
