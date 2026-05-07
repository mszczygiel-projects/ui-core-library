import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CheckboxField } from './CheckboxField.js';

const meta: Meta<typeof CheckboxField> = {
  title: 'React/CheckboxField',
  component: CheckboxField,
  argTypes: {
    state: {
      control: 'select',
      options: ['default', 'error', 'disabled'],
    },
    label: { control: 'text' },
    hint: { control: 'text' },
    checked: { control: 'boolean' },
    indeterminate: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    state: 'default',
    label: 'Remember me',
    checked: false,
    indeterminate: false,
  },
};

export default meta;
type Story = StoryObj<typeof CheckboxField>;

export const Default: Story = {};

export const WithHint: Story = {
  args: { hint: 'Minimum of 8 characters' },
};

export const Checked: Story = {
  args: { checked: true },
};

export const Indeterminate: Story = {
  args: { indeterminate: true },
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
      <CheckboxField
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
      <CheckboxField label="Default" hint="Hint text" />
      <CheckboxField label="Checked" hint="Hint text" checked />
      <CheckboxField label="Indeterminate" hint="Hint text" indeterminate />
      <CheckboxField label="Error" state="error" hint="This field is required." />
      <CheckboxField label="Error checked" state="error" checked hint="This field is required." />
      <CheckboxField label="Disabled" state="disabled" hint="Hint text" />
      <CheckboxField label="Disabled checked" state="disabled" checked />
    </div>
  ),
};
