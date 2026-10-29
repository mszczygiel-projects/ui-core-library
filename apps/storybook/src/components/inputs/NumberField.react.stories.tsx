import { NumberField } from '@mszczygiel-projects/ui-core-react';
import { numberField } from '@mszczygiel-projects/ui-core-shared/number-field';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { onSurfaces } from '../decorators.tsx';

const { options } = numberField;

const meta = {
  title: 'Components/Inputs/NumberField/React',
  component: NumberField,
  args: {
    label: 'Quantity',
    defaultValue: 12,
    locale: 'en-US',
    variant: options.variant.default,
    size: options.size.default,
    labelPlacement: options.labelPlacement.default,
    state: options.state.default,
    disabled: false,
    readOnly: false,
    required: false,
    controls: options.controls.default,
    step: 1,
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
    defaultValue: { control: 'number' },
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    precision: { control: 'number' },
    controls: { control: 'inline-radio', options: options.controls.options },
    getValidationMessageLabel: { control: false },
  },
} satisfies Meta<typeof NumberField>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="sb-row">
      {options.variant.options.map((variant) => (
        <NumberField key={variant} {...args} variant={variant} />
      ))}
    </div>
  ),
};

export const WithControls: Story = {
  args: { controls: 'inline', min: 0, max: 20 },
  render: (args) => (
    <div className="sb-row">
      {options.labelPlacement.options.map((labelPlacement) => (
        <NumberField key={labelPlacement} {...args} labelPlacement={labelPlacement} />
      ))}
    </div>
  ),
};
export const WithDecimals: Story = {
  args: {
    defaultValue: 12.5,
    step: 0.1,
    precision: 2,
    hint: 'Steps of 0.1; at most two decimal places',
  },
};

export const WithLocale: Story = {
  args: { defaultValue: 12.5, step: 0.1 },
  render: (args) => (
    <div className="sb-row">
      {['pl-PL', 'en-US', 'ar-EG'].map((locale) => (
        <NumberField key={locale} {...args} locale={locale} label={locale} />
      ))}
    </div>
  ),
};

export const InForm: Story = {
  args: { name: 'quantity', required: true },
  render: (args) => (
    <form
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <NumberField {...args} />
    </form>
  ),
};
export const OnSurfaces: Story = { decorators: [onSurfaces], ...Variants };
