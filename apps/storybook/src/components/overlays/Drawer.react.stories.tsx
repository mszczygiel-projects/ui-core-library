import { Button, CheckboxField, Drawer } from '@mszczygiel-projects/ui-core-react';
import { drawer } from '@mszczygiel-projects/ui-core-shared/drawer';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ComponentProps, useState } from 'react';

import { onSurfaces } from '../decorators.tsx';

const { options } = drawer;

type DemoProps = ComponentProps<typeof Drawer> & { readonly trigger?: string };

/** A button that opens the drawer, as a page does; the drawer closes when the user asks. */
function DrawerDemo({ trigger = 'Open drawer', children, ...args }: DemoProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        onClick={() => {
          setOpen(true);
        }}
      >
        {trigger}
      </Button>
      <Drawer {...args} open={open} onOpenChange={setOpen}>
        {children ?? (
          <div className="sb-stack">
            <CheckboxField label="In stock" />
            <CheckboxField label="On sale" />
            <CheckboxField label="Free delivery" />
          </div>
        )}
      </Drawer>
    </>
  );
}

const meta = {
  title: 'Components/Overlays/Drawer/React',
  component: Drawer,
  args: {
    label: 'Filters',
    placement: options.placement.default,
    hideCloseButton: false,
    dragToDismiss: false,
  },
  argTypes: {
    label: { control: 'text' },
    placement: { control: 'inline-radio', options: options.placement.options },
    hideCloseButton: { control: 'boolean' },
    closeLabel: { control: 'text' },
    dragToDismiss: { control: 'boolean' },
  },
  render: (args) => <DrawerDemo {...args} />,
} satisfies Meta<typeof Drawer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Placements: Story = {
  render: (args) => (
    <div className="sb-stack">
      {options.placement.options.map((placement) => (
        <DrawerDemo key={placement} {...args} placement={placement} trigger={placement} />
      ))}
    </div>
  ),
};

export const WithForm: Story = {
  render: function Render(args) {
    const [open, setOpen] = useState(false);
    const [applied, setApplied] = useState('none');
    return (
      <div className="sb-stack">
        <Button
          onClick={() => {
            setOpen(true);
          }}
        >
          Filters
        </Button>
        <span>Applied: {applied}</span>
        <Drawer
          {...args}
          open={open}
          onOpenChange={(next, { reason, returnValue }) => {
            setOpen(next);
            if (reason === 'form') {
              setApplied(returnValue);
            }
          }}
        >
          <form method="dialog" className="sb-stack">
            <CheckboxField label="In stock" />
            <Button type="submit" value="in stock">
              Apply
            </Button>
          </form>
        </Drawer>
      </div>
    );
  },
};

export const Draggable: Story = { args: { placement: 'bottom', dragToDismiss: true } };

export const OnSurfaces: Story = { decorators: [onSurfaces] };
