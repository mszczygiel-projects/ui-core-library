import { RadioField, RadioGroup } from '@mszczygiel-projects/ui-core-react';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Components/Selection/RadioField/React',
  component: RadioField,
  args: { value: 'express', label: 'Express', disabled: false },
  argTypes: {
    value: { control: 'text' },
    label: { control: 'text' },
    hint: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  render: (args) => (
    <RadioGroup label="Delivery" defaultValue="express">
      <RadioField value="standard" label="Standard" />
      <RadioField {...args} />
    </RadioGroup>
  ),
} satisfies Meta<typeof RadioField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithHint: Story = { args: { hint: 'Next working day' } };

export const Disabled: Story = { args: { disabled: true } };
