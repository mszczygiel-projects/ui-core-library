import { Tab, Tabs } from '@mszczygiel-projects/ui-core-react';
import { tabs } from '@mszczygiel-projects/ui-core-shared/tabs';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

import { forEachSurface } from '../decorators.tsx';
import { svgMap } from '../icons.ts';
import { MANY_TABS, TABS } from './tabs-content.ts';

const { options } = tabs;

interface Extras {
  readonly items?: readonly (typeof MANY_TABS)[number][];
  readonly withIcons?: boolean;
  readonly disabledIndex?: number;
  readonly surface?: string;
}

function Views({
  items = TABS,
  withIcons,
  disabledIndex,
  surface,
  label,
  ...args
}: ComponentProps<typeof Tabs> & Extras) {
  return (
    <Tabs {...args} label={surface === undefined ? label : `${String(label)} (${surface})`}>
      {items.map((item, index) => (
        <Tab
          key={item.value}
          value={item.value}
          label={item.label}
          icon={
            withIcons === true ? (
              <span dangerouslySetInnerHTML={{ __html: svgMap[item.icon] }} />
            ) : undefined
          }
          disabled={index === disabledIndex}
        >
          {item.content}
        </Tab>
      ))}
    </Tabs>
  );
}

const meta = {
  title: 'Components/Content/Tabs/React',
  component: Tabs,
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
  render: (args) => <Views {...args} />,
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Segmented: Story = { args: { variant: 'segmented' } };

export const Vertical: Story = { args: { orientation: 'vertical' } };

export const WithIcons: Story = { render: (args) => <Views {...args} withIcons /> };

export const WithDisabledTab: Story = {
  render: (args) => <Views {...args} disabledIndex={1} />,
};

export const Overflow: Story = {
  render: (args) => (
    <div style={{ maxInlineSize: '20rem' }}>
      <Views {...args} items={MANY_TABS} />
    </div>
  ),
};

// Each list is named after its surface, so that the lists of one page differ.
export const OnSurfaces: Story = {
  render: (args) => forEachSurface((surface) => <Views {...args} surface={surface} />),
};
