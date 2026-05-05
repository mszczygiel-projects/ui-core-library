import { createElement } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { svgMap } from '@ui-core/icons';
import './text-input.js';

const meta: Meta = {
  title: 'Web Components/TextInput',
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
    label: 'Email address',
    placeholder: 'you@example.com',
    disabled: false,
  },
};

export default meta;
type Story = StoryObj;

type InputArgs = {
  variant?: string;
  size?: string;
  labelPlacement?: string;
  state?: string;
  label?: string;
  placeholder?: string;
  hint?: string;
  disabled?: boolean;
};

const input = (props: InputArgs = {}, ...children: unknown[]) =>
  createElement(
    'ui-text-input',
    {
      variant: props.variant,
      'data-size': props.size,
      'label-placement': props.labelPlacement,
      state: props.state,
      label: props.label,
      placeholder: props.placeholder,
      hint: props.hint,
      disabled: props.disabled || undefined,
    },
    ...children,
  );

const iconSpan = (slot: 'leading-icon' | 'trailing-icon', name: keyof typeof svgMap) =>
  createElement('span', {
    slot,
    style: { display: 'inline-flex' },
    dangerouslySetInnerHTML: { __html: svgMap[name] },
  });

export const Outline: Story = {
  args: {
  },
  render: (args: InputArgs) => input(args),
};

export const Filled: Story = {
  args: { variant: 'filled' },
  render: (args: InputArgs) => input(args),
};

export const Underlined: Story = {
  args: { variant: 'underlined', labelPlacement: 'floating' },
  render: (args: InputArgs) => input(args),
};

export const FloatingLabel: Story = {
  args: { labelPlacement: 'floating', label: 'Email address', placeholder: '' },
  render: (args: InputArgs) => input(args),
};

export const Sizes: Story = {
  render: () =>
    createElement(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 320 } },
      input({ size: 'small', label: 'Small', placeholder: 'Small input' }),
      input({ size: 'default', label: 'Default', placeholder: 'Default input' }),
      input({ size: 'large', label: 'Large', placeholder: 'Large input' }),
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
        hint: 'Looks good!',
      }),
      input({
        state: 'error',
        label: 'Error',
        placeholder: 'Error state',
        hint: 'This field is required.',
      }),
      input({ state: 'disabled', label: 'Disabled', placeholder: 'Disabled state' }),
    ),
};

export const WithHint: Story = {
  args: { hint: 'We will never share your email.' },
  render: (args: InputArgs) => input(args),
};

export const WithLeadingIcon: Story = {
  args: { label: 'Search', placeholder: 'Search…' },
  render: (args: InputArgs) => input(args, iconSpan('leading-icon', 'icon-search')),
};

export const WithTrailingIcon: Story = {
  args: { state: 'error', label: 'Email', placeholder: 'you@example.com', hint: 'Invalid email.' },
  render: (args: InputArgs) => input(args, iconSpan('trailing-icon', 'icon-danger')),
};

