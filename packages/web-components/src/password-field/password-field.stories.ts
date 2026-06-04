import { createElement } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import './password-field.js';

const meta: Meta = {
  title: 'Web Components/PasswordField',
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

type PasswordFieldArgs = {
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

const input = (props: PasswordFieldArgs = {}) =>
  createElement('ui-password-field', {
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

export const Outline: Story = {
  render: (args: PasswordFieldArgs) => input(args),
};

export const Filled: Story = {
  args: { variant: 'filled' },
  render: (args: PasswordFieldArgs) => input(args),
};

export const Underlined: Story = {
  args: { variant: 'underlined' },
  render: (args: PasswordFieldArgs) => input(args),
};

export const ShowPassword: Story = {
  args: { showPassword: true },
  render: (args: PasswordFieldArgs) => input(args),
};

export const OutlineInnerLabel: Story = {
  args: { labelPlacement: 'inner' },
  render: (args: PasswordFieldArgs) => input(args),
};

export const FilledInnerLabel: Story = {
  args: { variant: 'filled', labelPlacement: 'inner' },
  render: (args: PasswordFieldArgs) => input(args),
};

export const UnderlinedInnerLabel: Story = {
  args: { variant: 'underlined', labelPlacement: 'inner' },
  render: (args: PasswordFieldArgs) => input(args),
};

export const OutlineFloatingLabel: Story = {
  args: { labelPlacement: 'floating', placeholder: '' },
  render: (args: PasswordFieldArgs) => input(args),
};

export const FilledFloatingLabel: Story = {
  args: { variant: 'filled', labelPlacement: 'floating', placeholder: '' },
  render: (args: PasswordFieldArgs) => input(args),
};

export const UnderlinedFloatingLabel: Story = {
  args: { variant: 'underlined', labelPlacement: 'floating', placeholder: '' },
  render: (args: PasswordFieldArgs) => input(args),
};
