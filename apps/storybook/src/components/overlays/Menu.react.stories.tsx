import { iconDelete, iconMenu, iconShare } from '@mszczygiel-projects/ui-core-icons';
import { Button, IconButton, Menu, type MenuItems } from '@mszczygiel-projects/ui-core-react';
import { menu } from '@mszczygiel-projects/ui-core-shared/menu';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactNode, useState } from 'react';

import { onSurfaces } from '../decorators.tsx';

const { options } = menu;

/** An icon node, its SVG string from the icons package only. */
const icon = (svg: string) => <span dangerouslySetInnerHTML={{ __html: svg }} />;

const ACTIONS: MenuItems<ReactNode> = [
  { value: 'rename', label: 'Rename' },
  { value: 'duplicate', label: 'Duplicate' },
  { value: 'share', label: 'Share', icon: icon(iconShare) },
  { value: 'archive', label: 'Archive', disabled: true },
];

const GROUPS: MenuItems<ReactNode> = [
  {
    options: [
      { value: 'rename', label: 'Rename' },
      { value: 'duplicate', label: 'Duplicate' },
    ],
  },
  { options: [{ value: 'share', label: 'Share', icon: icon(iconShare) }] },
  { options: [{ value: 'delete', label: 'Delete', icon: icon(iconDelete) }] },
];

const meta = {
  title: 'Components/Overlays/Menu/React',
  component: Menu,
  args: {
    options: ACTIONS,
    size: options.size.default,
    placement: options.placement.default,
    align: options.align.default,
    trigger: <Button size="small">Actions</Button>,
  },
  argTypes: {
    size: { control: 'inline-radio', options: options.size.options },
    placement: { control: 'inline-radio', options: options.placement.options },
    align: { control: 'inline-radio', options: options.align.options },
    label: { control: 'text' },
    open: { control: false },
    options: { control: false },
    trigger: { control: false },
  },
} satisfies Meta<typeof Menu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: function Render(args) {
    const [picked, setPicked] = useState('none');
    return (
      <div className="sb-row">
        <Menu {...args} onAction={setPicked} />
        <span>Picked: {picked}</span>
      </div>
    );
  },
};

export const Groups: Story = {
  args: {
    options: GROUPS,
    label: 'Page actions',
    trigger: <IconButton size="small" label="Page actions" icon={icon(iconMenu)} />,
  },
};

export const Placements: Story = {
  render: (args) => (
    <div className="sb-row">
      {options.placement.options.map((placement) => (
        <Menu
          key={placement}
          {...args}
          placement={placement}
          trigger={<Button size="small">{placement}</Button>}
        />
      ))}
    </div>
  ),
};

export const OnSurfaces: Story = { decorators: [onSurfaces] };
