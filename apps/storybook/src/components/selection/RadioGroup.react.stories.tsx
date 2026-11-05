import { RadioField, RadioGroup } from '@mszczygiel-projects/ui-core-react';
import { radioGroup } from '@mszczygiel-projects/ui-core-shared/radio-group';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { onSurfaces } from '../decorators.tsx';

const { options } = radioGroup;

const DELIVERY = [
  { value: 'standard', label: 'Standard', hint: 'Three to five days' },
  { value: 'express', label: 'Express', hint: 'Next working day' },
  { value: 'pickup', label: 'Pick up in store' },
] as const;

const meta = {
  title: 'Components/Selection/RadioGroup/React',
  component: RadioGroup,
  args: {
    label: 'Delivery',
    orientation: options.orientation.default,
    state: options.state.default,
    defaultValue: 'standard',
    disabled: false,
    required: false,
  },
  argTypes: {
    label: { control: 'text' },
    hint: { control: 'text' },
    orientation: { control: 'inline-radio', options: options.orientation.options },
    state: { control: 'inline-radio', options: options.state.options },
    defaultValue: { control: 'inline-radio', options: DELIVERY.map((option) => option.value) },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    name: { control: 'text' },
  },
  render: (args) => (
    <RadioGroup {...args}>
      {DELIVERY.map((option) => (
        <RadioField key={option.value} {...option} />
      ))}
    </RadioGroup>
  ),
} satisfies Meta<typeof RadioGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Horizontal: Story = {
  args: { orientation: 'horizontal' },
  render: (args) => (
    <RadioGroup {...args} label="Size" defaultValue="m">
      {['S', 'M', 'L', 'XL'].map((size) => (
        <RadioField key={size} value={size.toLowerCase()} label={size} />
      ))}
    </RadioGroup>
  ),
};

export const InForm: Story = {
  args: { name: 'delivery', required: true, defaultValue: undefined },
  render: (args) => (
    <form
      className="sb-stack"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <RadioGroup {...args} hint="Choose how the order reaches you">
        {DELIVERY.map((option) => (
          <RadioField key={option.value} {...option} />
        ))}
      </RadioGroup>
      <RadioGroup {...args} name="gift" label="Gift wrap" state="error" hint="Choose one">
        <RadioField value="yes" label="Yes" />
        <RadioField value="no" label="No" />
      </RadioGroup>
    </form>
  ),
};

export const WithDisabledOption: Story = {
  render: (args) => (
    <RadioGroup {...args}>
      {DELIVERY.map((option) => (
        <RadioField key={option.value} {...option} disabled={option.value === 'pickup'} />
      ))}
    </RadioGroup>
  ),
};

export const OnSurfaces: Story = {
  decorators: [onSurfaces],
  render: (args) => (
    <div className="sb-stack">
      <RadioGroup {...args}>
        {DELIVERY.map((option) => (
          <RadioField key={option.value} {...option} />
        ))}
      </RadioGroup>
      <RadioGroup {...args} label="Disabled" disabled>
        <RadioField value="standard" label="Standard" />
      </RadioGroup>
    </div>
  ),
};
