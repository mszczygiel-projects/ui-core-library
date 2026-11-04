import { Calendar } from '@mszczygiel-projects/ui-core-react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { onSurfaces } from '../decorators.tsx';

const meta = {
  title: 'Components/Inputs/Calendar/React',
  component: Calendar,
  args: {
    defaultValue: '2026-07-08',
    range: false,
    locale: 'en-US',
    // A fixed today keeps the stories and their visual baselines the same on every day.
    today: '2026-07-19',
  },
  argTypes: {
    defaultValue: { control: 'text' },
    range: { control: 'boolean' },
    defaultMonth: { control: 'text' },
    min: { control: 'text' },
    max: { control: 'text' },
    locale: { control: 'text' },
    firstDayOfWeek: { control: { type: 'number', min: 1, max: 7 } },
    today: { control: 'text' },
    disabledDates: { control: false },
    getChooseMonthLabel: { control: false },
    getChooseYearLabel: { control: false },
  },
} satisfies Meta<typeof Calendar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Range: Story = {
  args: { range: true, defaultValue: '2026-07-08/2026-07-14' },
};

export const WithConstraints: Story = {
  args: {
    min: '2026-07-05',
    max: '2026-08-20',
    disabledDates: ['2026-07-10', '2026-07-11'],
  },
};

export const WithLocale: Story = {
  render: (args) => (
    <div className="sb-row">
      {['pl-PL', 'en-US', 'ar-EG'].map((locale) => (
        <Calendar key={locale} {...args} locale={locale} />
      ))}
    </div>
  ),
};

export const OnSurfaces: Story = { decorators: [onSurfaces], ...Range };
