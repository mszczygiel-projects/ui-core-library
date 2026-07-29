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
      options: ['top', 'floating', 'inner'],
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

export const Outline: Story = {};

export const Filled: Story = {
  args: { variant: 'filled' },
};

export const Underlined: Story = {
  args: { variant: 'underlined' },
};

export const OutlineInnerLabel: Story = {
  args: { labelPlacement: 'inner' },
};

export const FilledInnerLabel: Story = {
  args: { variant: 'filled', labelPlacement: 'inner' },
};

export const UnderlinedInnerLabel: Story = {
  args: { variant: 'underlined', labelPlacement: 'inner' },
};

export const OutlineFloatingLabel: Story = {
  args: { labelPlacement: 'floating', placeholder: '' },
};

export const FilledFloatingLabel: Story = {
  args: { variant: 'filled', labelPlacement: 'floating', placeholder: '' },
};

export const UnderlinedFloatingLabel: Story = {
  args: { variant: 'underlined', labelPlacement: 'floating', placeholder: '' },
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
