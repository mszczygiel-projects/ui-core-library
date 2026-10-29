import '@mszczygiel-projects/ui-core-web-components/number-field';

import type { NumberFieldProps } from '@mszczygiel-projects/ui-core-shared/number-field';
import { numberField } from '@mszczygiel-projects/ui-core-shared/number-field';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { onSurfaces } from '../decorators.tsx';
import { htmlOf } from '../html.ts';

const { options } = numberField;

function UiNumberField(args: NumberFieldProps) {
  return <ui-number-field {...args} />;
}

const source = (args: NumberFieldProps) =>
  htmlOf('ui-number-field', {
    label: args.label,
    hint: args.hint,
    name: args.name,
    value: args.value ?? '',
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
    step: args.step,
    precision: args.precision,
    controls: args.controls === 'none' ? undefined : args.controls,
  });

const meta = {
  title: 'Components/Inputs/NumberField/Web Component',
  tags: ['!manifest'],
  args: {
    label: 'Quantity',
    value: 12,
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
    value: { control: 'number' },
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    precision: { control: 'number' },
    controls: { control: 'inline-radio', options: options.controls.options },
    getValidationMessageLabel: { control: false },
  },
  render: (args) => <UiNumberField {...args} />,
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: NumberFieldProps }) => source(args),
      },
    },
  },
} satisfies Meta<NumberFieldProps>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="sb-row">
      {options.variant.options.map((variant) => (
        <UiNumberField key={variant} {...args} variant={variant} />
      ))}
    </div>
  ),
};

export const WithControls: Story = {
  args: { controls: 'inline', min: 0, max: 20 },
  render: (args) => (
    <div className="sb-row">
      {options.labelPlacement.options.map((labelPlacement) => (
        <UiNumberField key={labelPlacement} {...args} labelPlacement={labelPlacement} />
      ))}
    </div>
  ),
};
export const WithDecimals: Story = {
  args: { value: 12.5, step: 0.1, precision: 2, hint: 'Steps of 0.1; at most two decimal places' },
};

export const WithLocale: Story = {
  args: { value: 12.5, step: 0.1 },
  render: (args) => (
    <div className="sb-row">
      {['pl-PL', 'en-US', 'ar-EG'].map((locale) => (
        <UiNumberField key={locale} {...args} locale={locale} label={locale} />
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
      <UiNumberField {...args} />
    </form>
  ),
};
export const OnSurfaces: Story = { decorators: [onSurfaces], ...Variants };
