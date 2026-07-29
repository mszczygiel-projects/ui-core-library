import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DatePicker } from './DatePicker.js';
import { Button } from '../Button/Button.js';

const meta: Meta<typeof DatePicker> = {
  title: 'React/DatePicker',
  component: DatePicker,
  argTypes: {
    selectionMode: { control: 'select', options: ['single', 'range'] },
    placement: {
      control: 'select',
      options: ['bottom-start', 'bottom', 'bottom-end', 'top-start', 'top', 'top-end'],
    },
    locale: { control: 'text' },
  },
  args: {
    selectionMode: 'single',
    placement: 'bottom-start',
    locale: 'pl-PL',
    today: '2026-07-19',
  },
};

export default meta;
type Story = StoryObj<typeof DatePicker>;

/** Fully controlled demo: open + committed dates live in story state. */
const ControlledDemo = (props: {
  selectionMode: 'single' | 'range';
  placement?: Story['args'] extends { placement?: infer P } ? P : never;
  locale?: string;
}) => {
  const [open, setOpen] = useState(true);
  const [single, setSingle] = useState<string | null>('2026-07-08');
  const [range, setRange] = useState<{ start: string | null; end: string | null }>({
    start: '2026-07-08',
    end: '2026-07-14',
  });
  const isRange = props.selectionMode === 'range';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 380 }}>
      <DatePicker
        selectionMode={props.selectionMode}
        placement={props.placement}
        locale={props.locale}
        today="2026-07-19"
        open={open}
        startDate={(isRange ? range.start : single) ?? undefined}
        endDate={(isRange ? range.end : undefined) ?? undefined}
        anchor={
          <Button variant="secondary" onClick={() => setOpen((o) => !o)}>
            Pick date
          </Button>
        }
        onDateChange={(d) => setSingle(d.date)}
        onRangeChange={(d) => setRange({ start: d.startDate, end: d.endDate })}
        onOpenChange={(d) => setOpen(d.open)}
      />
      <code>
        {isRange
          ? `start: ${range.start ?? '—'}  end: ${range.end ?? '—'}`
          : `date: ${single ?? '—'}`}
      </code>
    </div>
  );
};

export const SingleAutoCommit: Story = {
  render: (args) => (
    <ControlledDemo selectionMode="single" placement={args.placement} locale={args.locale} />
  ),
};

export const RangeWithFooter: Story = {
  render: (args) => (
    <ControlledDemo selectionMode="range" placement={args.placement} locale={args.locale} />
  ),
};

export const OnSurfaces: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      {['default', 'subtle', 'inverse', 'primary'].map((surface) => (
        <div
          key={surface}
          data-surface={surface === 'default' ? undefined : surface}
          style={{
            backgroundColor: 'var(--color-background-default)',
            color: 'var(--color-text-primary)',
            padding: 24,
            paddingBottom: 440,
          }}
        >
          <DatePicker
            selectionMode="range"
            open
            locale={args.locale}
            today="2026-07-19"
            startDate="2026-07-08"
            endDate="2026-07-14"
            anchor={<Button variant="secondary">Pick date</Button>}
          />
        </div>
      ))}
    </div>
  ),
};
