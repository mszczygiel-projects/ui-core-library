import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { PasswordInput } from './PasswordInput.js';

const meta: Meta<typeof PasswordInput> = {
  title: 'React/PasswordInput',
  component: PasswordInput,
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
type Story = StoryObj<typeof PasswordInput>;

export const Default: Story = {};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 320 }}>
      <PasswordInput size="small" label="Small" placeholder="Small password input" />
      <PasswordInput size="default" label="Default" placeholder="Default password input" />
      <PasswordInput size="large" label="Large" placeholder="Large password input" />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 320 }}>
      <PasswordInput state="default" label="Default" placeholder="Default state" />
      <PasswordInput state="success" label="Success" placeholder="Success state" hint="Password is strong." />
      <PasswordInput state="error" label="Error" placeholder="Error state" hint="Minimum of 8 characters." />
      <PasswordInput state="disabled" label="Disabled" placeholder="Disabled state" />
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
      <PasswordInput
        label="Password"
        placeholder="Enter your password"
        hint="Controlled show/hide state."
        showPassword={showPassword}
        onToggleVisibility={() => setShowPassword((prev) => !prev)}
      />
    );
  },
};
