import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Calendar } from './Calendar.js';
import type { CalendarDateSelectDetail } from './Calendar.js';

const meta: Meta<typeof Calendar> = {
  title: 'React/Calendar',
  component: Calendar,
  argTypes: {
    selectionMode: { control: 'select', options: ['single', 'range'] },
    startDate: { control: 'text' },
    endDate: { control: 'text' },
    minDate: { control: 'text' },
    maxDate: { control: 'text' },
    firstDayOfWeek: { control: { type: 'number', min: 1, max: 7 } },
    locale: { control: 'text' },
  },
  args: {
    selectionMode: 'single',
    startDate: '2026-07-08',
    locale: 'pl-PL',
    today: '2026-07-19',
  },
};

export default meta;
type Story = StoryObj<typeof Calendar>;

export const Playground: Story = {};

export const RangeSelection: Story = {
  args: {
    selectionMode: 'range',
    startDate: '2026-07-08',
    endDate: '2026-07-14',
  },
};

export const MinMaxAndDisabled: Story = {
  args: {
    minDate: '2026-07-05',
    maxDate: '2026-07-25',
    disabledDates: ['2026-07-15', '2026-07-16'],
  },
};

/**
 * Reaching a distant date: the heading zooms out to a month grid, then to a
 * 24-year page — October 1987 is four clicks away instead of 470 chevrons.
 */
export const MonthAndYearPicker: Story = {
  args: {
    startDate: '1987-10-12',
  },
};

export const Locales: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
      {['pl-PL', 'en-US', 'de-DE'].map((locale) => (
        <div key={locale}>
          <p style={{ marginBottom: 8 }}>{locale}</p>
          <Calendar
            selectionMode="range"
            startDate="2026-07-08"
            endDate="2026-07-14"
            locale={locale}
            today="2026-07-19"
          />
        </div>
      ))}
    </div>
  ),
};

/** Full controlled loop: onDateSelect proposals are applied back as props. */
export const ControlledRange: Story = {
  render: (args) => {
    const Demo = () => {
      const [range, setRange] = useState<{ start: string | null; end: string | null }>({
        start: '2026-07-08',
        end: '2026-07-14',
      });
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Calendar
            selectionMode="range"
            startDate={range.start ?? undefined}
            endDate={range.end ?? undefined}
            locale={args.locale}
            today="2026-07-19"
            onDateSelect={(d: CalendarDateSelectDetail) =>
              setRange({ start: d.startDate, end: d.endDate })
            }
          />
          <code>{`start: ${range.start ?? '—'}  end: ${range.end ?? '—'}`}</code>
        </div>
      );
    };
    return <Demo />;
  },
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
          }}
        >
          <Calendar
            selectionMode="range"
            startDate="2026-07-08"
            endDate="2026-07-14"
            locale={args.locale}
            today="2026-07-19"
          />
        </div>
      ))}
    </div>
  ),
};
