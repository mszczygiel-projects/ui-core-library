import { createElement } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import './password-input.js';

const meta: Meta = {
  title: 'Web Components/PasswordInput',
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
    showPassword: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    variant: 'outline',
    size: 'default',
    labelPlacement: 'top',
    state: 'default',
    label: 'Password',
    placeholder: 'Enter your password',
    showPassword: false,
    disabled: false,
  },
};

export default meta;
type Story = StoryObj;

type PasswordInputArgs = {
  variant?: string;
  size?: string;
  labelPlacement?: string;
  state?: string;
  label?: string;
  placeholder?: string;
  hint?: string;
  showPassword?: boolean;
  disabled?: boolean;
};

const input = (props: PasswordInputArgs = {}) =>
  createElement('ui-password-input', {
    variant: props.variant,
    'data-size': props.size,
    'label-placement': props.labelPlacement,
    state: props.state,
    label: props.label,
    placeholder: props.placeholder,
    hint: props.hint,
    'show-password': props.showPassword || undefined,
    disabled: props.disabled || undefined,
  });

export const Default: Story = {
  render: (args: PasswordInputArgs) => input(args),
};

export const ShowPassword: Story = {
  args: { showPassword: true },
  render: (args: PasswordInputArgs) => input(args),
};

export const Sizes: Story = {
  render: () =>
    createElement(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 320 } },
      input({ size: 'small', label: 'Small', placeholder: 'Small password input' }),
      input({ size: 'default', label: 'Default', placeholder: 'Default password input' }),
      input({ size: 'large', label: 'Large', placeholder: 'Large password input' }),
    ),
};

export const States: Story = {
  render: () =>
    createElement(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 320 } },
      input({ state: 'default', label: 'Default', placeholder: 'Default state' }),
      input({
        state: 'success',
        label: 'Success',
        placeholder: 'Success state',
        hint: 'Password is strong.',
      }),
      input({
        state: 'error',
        label: 'Error',
        placeholder: 'Error state',
        hint: 'Minimum of 8 characters.',
      }),
      input({ state: 'disabled', label: 'Disabled', placeholder: 'Disabled state' }),
    ),
};

export const WithHint: Story = {
  args: { hint: 'Minimum of 8 characters.' },
  render: (args: PasswordInputArgs) => input(args),
};

export const FloatingLabel: Story = {
  args: { labelPlacement: 'floating', placeholder: '' },
  render: (args: PasswordInputArgs) => input(args),
};
