import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DateField } from './DateField.js';
import type { DateFieldChangeDetail } from './DateField.js';

const meta: Meta<typeof DateField> = {
  title: 'React/DateField',
  component: DateField,
  argTypes: {
    mode: { control: 'select', options: ['single', 'range'] },
    variant: { control: 'select', options: ['outline', 'filled', 'underlined'] },
    size: { control: 'select', options: ['small', 'default', 'large'] },
    labelPlacement: { control: 'select', options: ['top', 'floating', 'inner'] },
    state: { control: 'select', options: ['default', 'success', 'error', 'disabled'] },
    locale: { control: 'text' },
  },
  args: {
    mode: 'single',
    variant: 'outline',
    size: 'default',
    state: 'default',
    locale: 'pl-PL',
    today: '2026-07-19',
    label: 'Date',
    placeholder: 'Pick or type a date',
  },
};

export default meta;
type Story = StoryObj<typeof DateField>;

export const Playground: Story = {
  render: (args) => (
    <div style={{ paddingBottom: 420, width: 320 }}>
      <DateField {...args} defaultStartDate="2026-07-05" />
    </div>
  ),
};

export const RangeMode: Story = {
  render: (args) => {
    const Demo = () => {
      const [range, setRange] = useState<DateFieldChangeDetail>({
        startDate: '2026-07-05',
        endDate: '2026-07-12',
      });
      return (
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 460, width: 360 }}
        >
          <DateField
            {...args}
            mode="range"
            label="Date range"
            startDate={range.startDate}
            endDate={range.endDate}
            onChange={setRange}
            hint='Wpisz "5 lip 2026 – 12 lip 2026" albo wybierz w kalendarzu'
          />
          <code>{`start: ${range.startDate ?? '—'}  end: ${range.endDate ?? '—'}`}</code>
        </div>
      );
    };
    return <Demo />;
  },
};

export const ValidationBounds: Story = {
  render: (args) => (
    <div style={{ paddingBottom: 420, width: 360 }}>
      <DateField
        {...args}
        minDate="2026-07-05"
        maxDate="2026-07-25"
        hint="Dozwolone: 2026-07-05 … 2026-07-25 — wpisz datę spoza zakresu"
      />
    </div>
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
            width: 360,
          }}
        >
          <DateField
            {...args}
            mode="range"
            label="Date range"
            defaultStartDate="2026-07-05"
            defaultEndDate="2026-07-12"
          />
        </div>
      ))}
    </div>
  ),
};
