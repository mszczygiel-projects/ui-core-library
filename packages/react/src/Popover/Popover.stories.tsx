import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Popover } from './Popover.js';
import type { PopoverPlacement, PopoverProps } from './Popover.js';
import { Button } from '../Button/Button.js';

const PLACEMENTS: PopoverPlacement[] = [
  'top-start',
  'top',
  'top-end',
  'left-start',
  'right-start',
  'left',
  'right',
  'left-end',
  'right-end',
  'bottom-start',
  'bottom',
  'bottom-end',
];

const meta: Meta<typeof Popover> = {
  title: 'React/Popover',
  component: Popover,
  argTypes: {
    placement: { control: 'select', options: PLACEMENTS },
    trigger: { control: 'select', options: ['click', 'hover', 'manual'] },
    dismissOn: { control: 'select', options: ['outside-click', 'escape', 'both'] },
    trapFocus: { control: 'boolean' },
    arrow: { control: 'boolean' },
    offset: { control: 'number' },
  },
  args: {
    placement: 'bottom',
    trigger: 'click',
    dismissOn: 'both',
    trapFocus: false,
    arrow: false,
  },
};

export default meta;
type Story = StoryObj<typeof Popover>;

const DemoContent = () => (
  <div style={{ maxWidth: 240, display: 'flex', flexDirection: 'column', gap: 8 }}>
    <strong>Popover content</strong>
    <span>Sizes to its content — no size variants.</span>
  </div>
);

/** Stories own the open state — the component is fully controlled. */
const ControlledPopover = ({
  triggerLabel = 'Toggle popover',
  initialOpen = false,
  children,
  ...args
}: PopoverProps & { triggerLabel?: string; initialOpen?: boolean }) => {
  const [open, setOpen] = useState(initialOpen);
  return (
    <Popover
      {...args}
      open={open}
      onOpenChange={(detail) => setOpen(detail.open)}
      anchor={<Button variant="secondary">{triggerLabel}</Button>}
    >
      {children ?? <DemoContent />}
    </Popover>
  );
};

export const Playground: Story = {
  render: (args) => <ControlledPopover {...args} />,
};

/** All 12 placements, statically open (flip/shift disabled to show true placement). */
export const Placements: Story = {
  render: ({ arrow }) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, max-content)',
        gap: 140,
        padding: 120,
        justifyContent: 'center',
      }}
    >
      {PLACEMENTS.map((placement) => (
        <Popover
          key={placement}
          open
          placement={placement}
          trigger="manual"
          flip={false}
          shift={false}
          arrow={arrow}
          anchor={
            <span
              style={{
                display: 'inline-block',
                padding: 8,
                border: '1px dashed var(--color-border-default)',
              }}
            >
              {placement}
            </span>
          }
        >
          <span style={{ whiteSpace: 'nowrap' }}>{placement}</span>
        </Popover>
      ))}
    </div>
  ),
};

export const WithArrow: Story = {
  args: { arrow: true, placement: 'top' },
  render: (args) => <ControlledPopover {...args} initialOpen />,
};

export const TrapFocus: Story = {
  args: { trapFocus: true },
  render: (args) => (
    <ControlledPopover {...args}>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="secondary">First</Button>
        <Button variant="secondary">Second</Button>
      </div>
    </ControlledPopover>
  ),
};

export const HoverTrigger: Story = {
  args: { trigger: 'hover', arrow: true, placement: 'top' },
  render: (args) => <ControlledPopover {...args} triggerLabel="Hover me" />,
};

export const OnSurfaces: Story = {
  render: ({ arrow }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {(['default', 'subtle', 'inverse', 'primary'] as const).map((surface) => (
        <div
          key={surface}
          data-surface={surface === 'default' ? undefined : surface}
          style={{
            backgroundColor: 'var(--color-background-default)',
            color: 'var(--color-text-primary)',
            padding: 24,
            paddingBottom: 160,
          }}
        >
          <Popover
            open
            placement="bottom-start"
            trigger="manual"
            arrow={arrow}
            anchor={<Button variant="secondary">{surface}</Button>}
          >
            <DemoContent />
          </Popover>
        </div>
      ))}
    </div>
  ),
};
