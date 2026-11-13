import { DateTimeField } from '@mszczygiel-projects/ui-core-react';
import { dateTimeField } from '@mszczygiel-projects/ui-core-shared/date-time-field';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { onSurfaces } from '../decorators.tsx';

const { options } = dateTimeField;

const meta = {
  title: 'Components/Inputs/DateTimeField/React',
  component: DateTimeField,
  args: {
    label: 'Delivery date and time',
    timeLabel: 'Delivery time',
    defaultValue: '2026-12-31T09:30',
    locale: 'en-US',
    variant: options.variant.default,
    size: options.size.default,
    labelPlacement: options.labelPlacement.default,
    state: options.state.default,
    disabled: false,
    readOnly: false,
    required: false,
    hideCalendarButton: false,
  },
  argTypes: {
    label: { control: 'text' },
    hint: { control: 'text' },
    placeholder: { control: 'text' },
    locale: { control: 'text' },
    name: { control: 'text' },
    variant: { control: 'select', options: options.variant.options },
    size: { control: 'inline-radio', options: options.size.options },
    labelPlacement: { control: 'inline-radio', options: options.labelPlacement.options },
    state: { control: 'inline-radio', options: options.state.options },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    required: { control: 'boolean' },
    defaultValue: { control: 'text' },
    min: { control: 'text' },
    max: { control: 'text' },
    disabledDates: { control: false },
    hideCalendarButton: { control: 'boolean' },
    defaultOpen: { control: 'boolean' },
    firstDayOfWeek: { control: { type: 'number', min: 1, max: 7 } },
    today: { control: 'text' },
    openCalendarLabel: { control: 'text' },
    getFormatHintLabel: { control: false },
    getValidationMessageLabel: { control: false },
    onOpenChange: { control: false },
  },
} satisfies Meta<typeof DateTimeField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="sb-row">
      {options.variant.options.map((variant) => (
        <DateTimeField key={variant} {...args} variant={variant} />
      ))}
    </div>
  ),
};

export const WithLocale: Story = {
  args: { defaultValue: '2026-12-31T09:30' },
  render: (args) => (
    <div className="sb-row">
      {['pl-PL', 'en-US', 'ar-EG'].map((locale) => (
        <DateTimeField key={locale} {...args} locale={locale} label={locale} />
      ))}
    </div>
  ),
};
export const WithConstraints: Story = {
  args: {
    min: '2026-01-01T09:00',
    max: '2026-12-31T17:00',
    disabledDates: ['2026-12-25'],
    hint: 'Choose a date and time in 2026, excluding 25 December.',
  },
};

export const OnSurfaces: Story = { decorators: [onSurfaces], ...Variants };
