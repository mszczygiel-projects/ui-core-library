import '@mszczygiel-projects/ui-core-web-components/tabs';
import '@mszczygiel-projects/ui-core-web-components/tab';

import { tabs } from '@mszczygiel-projects/ui-core-shared/tabs';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { forEachSurface } from '../decorators.tsx';
import { htmlOf } from '../html.ts';
import { svgMap } from '../icons.ts';
import { MANY_TABS, TABS } from './tabs-content.ts';

const { options } = tabs;

interface TabsArgs {
  readonly variant: (typeof options.variant.options)[number];
  readonly orientation: (typeof options.orientation.options)[number];
  readonly label: string;
}

interface Extras {
  readonly items?: readonly (typeof MANY_TABS)[number][];
  readonly withIcons?: boolean;
  readonly disabledIndex?: number;
  readonly surface?: string;
}

function UiTabs({ items = TABS, withIcons, disabledIndex, surface, ...args }: TabsArgs & Extras) {
  return (
    <ui-tabs {...args} label={surface === undefined ? args.label : `${args.label} (${surface})`}>
      {items.map((item, index) => (
        <ui-tab
          key={item.value}
          value={item.value}
          label={item.label}
          icon={withIcons === true ? svgMap[item.icon] : undefined}
          disabled={index === disabledIndex}
        >
          {item.content}
        </ui-tab>
      ))}
    </ui-tabs>
  );
}

const source = (args: TabsArgs) =>
  htmlOf(
    'ui-tabs',
    {
      label: args.label,
      variant: args.variant === options.variant.default ? undefined : args.variant,
      orientation: args.orientation === options.orientation.default ? undefined : args.orientation,
    },
    TABS.map((item) =>
      htmlOf('ui-tab', { value: item.value, label: item.label }, item.content),
    ).join(''),
  );

const meta = {
  title: 'Components/Content/Tabs/Web Component',
  tags: ['!manifest'],
  args: {
    variant: options.variant.default,
    orientation: options.orientation.default,
    label: 'Product information',
  },
  argTypes: {
    variant: { control: 'inline-radio', options: options.variant.options },
    orientation: { control: 'inline-radio', options: options.orientation.options },
    label: { control: 'text' },
  },
  render: (args) => <UiTabs {...args} />,
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: TabsArgs }) => source(args),
      },
    },
  },
} satisfies Meta<TabsArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Segmented: Story = { args: { variant: 'segmented' } };

export const Vertical: Story = { args: { orientation: 'vertical' } };

export const WithIcons: Story = { render: (args) => <UiTabs {...args} withIcons /> };

export const WithDisabledTab: Story = {
  render: (args) => <UiTabs {...args} disabledIndex={1} />,
};

export const Overflow: Story = {
  render: (args) => (
    <div style={{ maxInlineSize: '20rem' }}>
      <UiTabs {...args} items={MANY_TABS} />
    </div>
  ),
};

// Each list is named after its surface, so that the lists of one page differ.
export const OnSurfaces: Story = {
  render: (args) => forEachSurface((surface) => <UiTabs {...args} surface={surface} />),
};
