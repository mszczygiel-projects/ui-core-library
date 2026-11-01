import '@mszczygiel-projects/ui-core-web-components/date-field';

import type { DateFieldProps } from '@mszczygiel-projects/ui-core-shared/date-field';
import { dateField } from '@mszczygiel-projects/ui-core-shared/date-field';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { onSurfaces } from '../decorators.tsx';
import { htmlOf } from '../html.ts';

const { options } = dateField;

function UiDateField(args: DateFieldProps) {
  return <ui-date-field {...args} />;
}

const source = (args: DateFieldProps) =>
  htmlOf('ui-date-field', {
    label: args.label,
    hint: args.hint,
    name: args.name,
    value: args.value,
    locale: args.locale,
    min: args.min,
    max: args.max,
    variant: args.variant === 'outline' ? undefined : args.variant,
    size: args.size === 'medium' ? undefined : args.size,
    'label-placement': args.labelPlacement === 'top' ? undefined : args.labelPlacement,
    state: args.state === 'default' ? undefined : args.state,
    disabled: args.disabled,
    readonly: args.readOnly,
    required: args.required,
  });

const meta = {
  title: 'Components/Inputs/DateField/Web Component',
  tags: ['!manifest'],
  args: {
    label: 'Delivery date',
    value: '2026-12-31',
    locale: 'en-US',
    variant: options.variant.default,
    size: options.size.default,
    labelPlacement: options.labelPlacement.default,
    state: options.state.default,
    disabled: false,
    readOnly: false,
    required: false,
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
    value: { control: 'text' },
    min: { control: 'text' },
    max: { control: 'text' },
    disabledDates: { control: false },
    getFormatHintLabel: { control: false },
    getValidationMessageLabel: { control: false },
  },
  render: (args) => <UiDateField {...args} />,
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: DateFieldProps }) => source(args),
      },
    },
  },
} satisfies Meta<DateFieldProps>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="sb-row">
      {options.variant.options.map((variant) => (
        <UiDateField key={variant} {...args} variant={variant} />
      ))}
    </div>
  ),
};

export const WithLocale: Story = {
  args: { value: '2026-12-31' },
  render: (args) => (
    <div className="sb-row">
      {['pl-PL', 'en-US', 'ar-EG'].map((locale) => (
        <UiDateField key={locale} {...args} locale={locale} label={locale} />
      ))}
    </div>
  ),
};
export const WithConstraints: Story = {
  args: {
    min: '2026-01-01',
    max: '2026-12-31',
    disabledDates: ['2026-12-25'],
    hint: 'Choose a day in 2026, excluding 25 December.',
  },
};

export const OnSurfaces: Story = { decorators: [onSurfaces], ...Variants };
