import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { PasswordField } from './PasswordField.js';

const meta: Meta<typeof PasswordField> = {
  title: 'React/PasswordField',
  component: PasswordField,
  argTypes: {
    variant: {
      control: 'select',
      options: ['outline', 'filled', 'underlined'],
    },
    size: {
      control: 'select',
      options: ['small', 'default', 'large'],
    },
    labelPlacement: {
      control: 'select',
      options: ['top', 'floating'],
    },
    state: {
      control: 'select',
      options: ['default', 'success', 'error', 'disabled'],
    },
    label: { control: 'text' },
    placeholder: { control: 'text' },
    hint: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  args: {
    variant: 'outline',
    size: 'default',
    labelPlacement: 'top',
    state: 'default',
    label: 'Password',
    placeholder: 'Enter your password',
  },
};

export default meta;
type Story = StoryObj<typeof PasswordField>;

export const Default: Story = {};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 320 }}>
      <PasswordField size="small" label="Small" placeholder="Small password input" />
      <PasswordField size="default" label="Default" placeholder="Default password input" />
      <PasswordField size="large" label="Large" placeholder="Large password input" />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 320 }}>
      <PasswordField state="default" label="Default" placeholder="Default state" />
      <PasswordField
        state="success"
        label="Success"
        placeholder="Success state"
        hint="Password is strong."
      />
      <PasswordField
        state="error"
        label="Error"
        placeholder="Error state"
        hint="Minimum of 8 characters."
      />
      <PasswordField state="disabled" label="Disabled" placeholder="Disabled state" />
    </div>
  ),
};

export const WithHint: Story = {
  args: { hint: 'Minimum of 8 characters.' },
};

export const FloatingLabel: Story = {
  args: { labelPlacement: 'floating', placeholder: '' },
};

export const Controlled: Story = {
  render: () => {
    const [showPassword, setShowPassword] = useState(false);
    return (
      <PasswordField
        label="Password"
        placeholder="Enter your password"
        hint="Controlled show/hide state."
        showPassword={showPassword}
        onToggleVisibility={() => setShowPassword((prev) => !prev)}
      />
    );
  },
};
