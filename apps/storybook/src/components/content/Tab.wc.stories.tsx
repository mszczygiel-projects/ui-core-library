import '@mszczygiel-projects/ui-core-web-components/tabs';
import '@mszczygiel-projects/ui-core-web-components/tab';

import type { Meta, StoryObj } from '@storybook/react-vite';

import { forEachSurface } from '../decorators.tsx';
import { htmlOf } from '../html.ts';
import { type IconName, iconOptions, svgMap } from '../icons.ts';
import { TABS } from './tabs-content.ts';

interface TabArgs {
  readonly label: string;
  readonly icon: IconName | undefined;
  readonly disabled: boolean;
}

/** A Tabs whose second tab takes the args, since a Tab shows only inside one. */
function UiTabs({ surface, ...args }: TabArgs & { readonly surface?: string }) {
  return (
    <ui-tabs label={surface === undefined ? 'Product information' : `Product (${surface})`}>
      {TABS.map((item, index) =>
        index === 1 ? (
          <ui-tab
            key={item.value}
            value={item.value}
            label={args.label}
            icon={args.icon === undefined ? undefined : svgMap[args.icon]}
            disabled={args.disabled}
          >
            {item.content}
          </ui-tab>
        ) : (
          <ui-tab key={item.value} value={item.value} label={item.label}>
            {item.content}
          </ui-tab>
        ),
      )}
    </ui-tabs>
  );
}

const source = (args: TabArgs) =>
  htmlOf(
    'ui-tab',
    { value: TABS[1].value, label: args.label, disabled: args.disabled },
    TABS[1].content,
  );

const meta = {
  title: 'Components/Content/Tab/Web Component',
  tags: ['!manifest'],
  args: { label: TABS[1].label, icon: undefined, disabled: false },
  argTypes: {
    label: { control: 'text' },
    icon: { control: 'select', options: iconOptions },
    disabled: { control: 'boolean' },
  },
  render: (args) => <UiTabs {...args} />,
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: TabArgs }) => source(args),
      },
    },
  },
} satisfies Meta<TabArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

// Each list is named after its surface, so that the lists of one page differ.
export const OnSurfaces: Story = {
  render: (args) => forEachSurface((surface) => <UiTabs {...args} surface={surface} />),
};
