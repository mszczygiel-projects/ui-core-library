import { Button, CheckboxField, Popover } from '@mszczygiel-projects/ui-core-react';
import { popover } from '@mszczygiel-projects/ui-core-shared/popover';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { onSurfaces } from '../decorators.tsx';

const { options } = popover;

const meta = {
  title: 'Components/Overlays/Popover/React',
  component: Popover,
  args: {
    label: 'Filters',
    placement: options.placement.default,
    showArrow: false,
    trigger: <Button size="small">Filters</Button>,
    children: (
      <div className="sb-stack">
        <CheckboxField label="In stock" />
        <CheckboxField label="On sale" />
      </div>
    ),
  },
  argTypes: {
    label: { control: 'text' },
    placement: { control: 'inline-radio', options: options.placement.options },
    showArrow: { control: 'boolean' },
    open: { control: false },
    trigger: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof Popover>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Placements: Story = {
  args: { showArrow: true },
  render: (args) => (
    <div className="sb-row">
      {options.placement.options.map((placement) => (
        <Popover
          key={placement}
          {...args}
          placement={placement}
          trigger={<Button size="small">{placement}</Button>}
        />
      ))}
    </div>
  ),
};

export const WithForm: Story = {
  render: function Render(args) {
    const [open, setOpen] = useState(false);
    const [applied, setApplied] = useState('none');
    return (
      <div className="sb-row">
        <Popover {...args} open={open} onOpenChange={setOpen}>
          <form
            className="sb-stack"
            onSubmit={(event) => {
              event.preventDefault();
              setApplied('in stock');
              setOpen(false);
            }}
          >
            <CheckboxField label="In stock" />
            <Button type="submit" size="small">
              Apply
            </Button>
          </form>
        </Popover>
        <span>Applied: {applied}</span>
      </div>
    );
  },
};

export const OnSurfaces: Story = { decorators: [onSurfaces] };
