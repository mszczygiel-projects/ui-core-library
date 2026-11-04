import '@mszczygiel-projects/ui-core-web-components/calendar';

import type { CalendarProps } from '@mszczygiel-projects/ui-core-shared/calendar';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { onSurfaces } from '../decorators.tsx';
import { htmlOf } from '../html.ts';

/** The HTML of the component, which the code panel shows. */
const source = (args: CalendarProps) =>
  htmlOf('ui-calendar', {
    value: args.value === '' ? undefined : args.value,
    range: args.range,
    month: args.month,
    min: args.min,
    max: args.max,
    locale: args.locale,
    'first-day-of-week': args.firstDayOfWeek,
    today: args.today,
  });

const meta = {
  title: 'Components/Inputs/Calendar/Web Component',
  tags: ['!manifest'],
  args: {
    value: '2026-07-08',
    range: false,
    locale: 'en-US',
    // A fixed today keeps the stories and their visual baselines the same on every day.
    today: '2026-07-19',
  },
  argTypes: {
    value: { control: 'text' },
    range: { control: 'boolean' },
    month: { control: 'text' },
    min: { control: 'text' },
    max: { control: 'text' },
    locale: { control: 'text' },
    firstDayOfWeek: { control: { type: 'number', min: 1, max: 7 } },
    today: { control: 'text' },
    disabledDates: { control: false },
    getChooseMonthLabel: { control: false },
    getChooseYearLabel: { control: false },
  },
  render: (args) => <ui-calendar {...args} />,
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: CalendarProps }) => source(args),
      },
    },
  },
} satisfies Meta<CalendarProps>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Range: Story = {
  args: { range: true, value: '2026-07-08/2026-07-14' },
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
        <ui-calendar key={locale} {...args} locale={locale} />
      ))}
    </div>
  ),
};

export const OnSurfaces: Story = { decorators: [onSurfaces], ...Range };
