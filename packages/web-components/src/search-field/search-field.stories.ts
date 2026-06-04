import { createElement } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import './search-field.js';

const meta: Meta = {
  title: 'Web Components/SearchField',
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
    value: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  args: {
    variant: 'outline',
    size: 'default',
    labelPlacement: 'top',
    state: 'default',
    label: 'Search',
    placeholder: 'Search...',
    disabled: false,
  },
};

export default meta;
type Story = StoryObj;

type SearchFieldArgs = {
  variant?: string;
  size?: string;
  labelPlacement?: string;
  state?: string;
  label?: string;
  placeholder?: string;
  hint?: string;
  value?: string;
  disabled?: boolean;
};

const input = (props: SearchFieldArgs = {}) =>
  createElement('ui-search-field', {
    variant: props.variant,
    'data-size': props.size,
    'label-placement': props.labelPlacement,
    state: props.state,
    label: props.label,
    placeholder: props.placeholder,
    hint: props.hint,
    value: props.value,
    disabled: props.disabled || undefined,
  });

export const Outline: Story = {
  render: (args: SearchFieldArgs) => input(args),
};

export const Filled: Story = {
  args: { variant: 'filled' },
  render: (args: SearchFieldArgs) => input(args),
};

export const Underlined: Story = {
  args: { variant: 'underlined' },
  render: (args: SearchFieldArgs) => input(args),
};

export const OutlineInnerLabel: Story = {
  args: { labelPlacement: 'inner' },
  render: (args: SearchFieldArgs) => input(args),
};

export const FilledInnerLabel: Story = {
  args: { variant: 'filled', labelPlacement: 'inner' },
  render: (args: SearchFieldArgs) => input(args),
};

export const UnderlinedInnerLabel: Story = {
  args: { variant: 'underlined', labelPlacement: 'inner' },
  render: (args: SearchFieldArgs) => input(args),
};

export const OutlineFloatingLabel: Story = {
  args: { labelPlacement: 'floating', placeholder: '' },
  render: (args: SearchFieldArgs) => input(args),
};

export const FilledFloatingLabel: Story = {
  args: { variant: 'filled', labelPlacement: 'floating', placeholder: '' },
  render: (args: SearchFieldArgs) => input(args),
};

export const UnderlinedFloatingLabel: Story = {
  args: { variant: 'underlined', labelPlacement: 'floating', placeholder: '' },
  render: (args: SearchFieldArgs) => input(args),
};
