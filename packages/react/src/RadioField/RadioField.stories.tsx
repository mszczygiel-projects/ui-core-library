import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { RadioField } from './RadioField.js';

const meta: Meta<typeof RadioField> = {
  title: 'React/RadioField',
  component: RadioField,
  argTypes: {
    state: {
      control: 'select',
      options: ['default', 'error', 'disabled'],
    },
    label: { control: 'text' },
    hint: { control: 'text' },
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    state: 'default',
    label: 'Remember me',
    checked: false,
  },
};

export default meta;
type Story = StoryObj<typeof RadioField>;

export const Default: Story = {};

export const WithHint: Story = {
  args: { hint: 'Minimum of 8 characters' },
};

export const Checked: Story = {
  args: { checked: true },
};

export const Error: Story = {
  args: { state: 'error', hint: 'This field is required.' },
};

export const ErrorChecked: Story = {
  args: { state: 'error', checked: true, hint: 'This field is required.' },
};

export const Disabled: Story = {
  args: { state: 'disabled', hint: 'Minimum of 8 characters' },
};

export const DisabledChecked: Story = {
  args: { state: 'disabled', checked: true },
};

export const NoHint: Story = {
  args: { hint: undefined },
};

export const Interactive: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return (
      <RadioField
        label="Accept terms and conditions"
        hint="You must accept to continue."
        checked={checked}
        onChange={setChecked}
      />
    );
  },
};

export const AllStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <RadioField label="Default" hint="Hint text" />
      <RadioField label="Checked" hint="Hint text" checked />
      <RadioField label="Error" state="error" hint="This field is required." />
      <RadioField label="Error checked" state="error" checked hint="This field is required." />
      <RadioField label="Disabled" state="disabled" hint="Hint text" />
      <RadioField label="Disabled checked" state="disabled" checked />
    </div>
  ),
};
