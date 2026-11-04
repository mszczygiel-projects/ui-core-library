import { Tab, Tabs } from '@mszczygiel-projects/ui-core-react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

import { forEachSurface } from '../decorators.tsx';
import { iconOptions, svgMap } from '../icons.ts';
import { TABS } from './tabs-content.ts';

/** Every icon as a node for the icon prop, its SVG string from the icons package only. */
const iconNodes = Object.fromEntries(
  iconOptions.map((name) => [
    name,
    <span key={name} dangerouslySetInnerHTML={{ __html: svgMap[name] }} />,
  ]),
);

/** A Tabs whose second tab takes the args, since a Tab shows only inside one. */
function Views({ surface, ...args }: ComponentProps<typeof Tab> & { readonly surface?: string }) {
  return (
    <Tabs label={surface === undefined ? 'Product information' : `Product (${surface})`}>
      {TABS.map((item, index) =>
        index === 1 ? (
          <Tab key={item.value} {...args} value={item.value}>
            {item.content}
          </Tab>
        ) : (
          <Tab key={item.value} value={item.value} label={item.label}>
            {item.content}
          </Tab>
        ),
      )}
    </Tabs>
  );
}

const meta = {
  title: 'Components/Content/Tab/React',
  component: Tab,
  args: { value: TABS[1].value, label: TABS[1].label, disabled: false },
  argTypes: {
    label: { control: 'text' },
    icon: { control: 'select', options: iconOptions, mapping: iconNodes },
    disabled: { control: 'boolean' },
  },
  render: (args) => <Views {...args} />,
} satisfies Meta<typeof Tab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

// Each list is named after its surface, so that the lists of one page differ.
export const OnSurfaces: Story = {
  render: (args) => forEachSurface((surface) => <Views {...args} surface={surface} />),
};
