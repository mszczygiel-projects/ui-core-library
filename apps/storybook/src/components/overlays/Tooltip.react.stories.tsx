import { Button, Tooltip } from '@mszczygiel-projects/ui-core-react';
import { tooltip } from '@mszczygiel-projects/ui-core-shared/tooltip';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { onSurfaces } from '../decorators.tsx';

const { options } = tooltip;

const meta = {
  title: 'Components/Overlays/Tooltip/React',
  component: Tooltip,
  args: {
    content: 'Copy link',
    placement: options.placement.default,
    showArrow: false,
    children: <Button size="small">Copy</Button>,
  },
  argTypes: {
    content: { control: 'text' },
    placement: { control: 'inline-radio', options: options.placement.options },
    showArrow: { control: 'boolean' },
    children: { control: false },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Placements: Story = {
  args: { showArrow: true },
  render: (args) => (
    <div className="sb-row">
      {options.placement.options.map((placement) => (
        <Tooltip key={placement} {...args} placement={placement}>
          <Button size="small">{placement}</Button>
        </Tooltip>
      ))}
    </div>
  ),
};

export const OnSurfaces: Story = { decorators: [onSurfaces] };
