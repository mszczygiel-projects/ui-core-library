import { createElement } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import './search-input.js';

const meta: Meta = {
  title: 'Web Components/SearchInput',
  argTypes: {
    variant: {
      control: 'select',
      options: ['outline', 'filled', 'underlined'],
    },
    size: {
      control: 'select',
      options: ['small', 'default', 'large'],
    },
    state: {
      control: 'select',
      options: ['default', 'success', 'error', 'disabled'],
    },
    placeholder: { control: 'text' },
    hint: { control: 'text' },
    value: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  args: {
    variant: 'outline',
    size: 'default',
    state: 'default',
    placeholder: 'Search...',
    disabled: false,
  },
};

export default meta;
type Story = StoryObj;

type SearchInputArgs = {
  variant?: string;
  size?: string;
  state?: string;
  placeholder?: string;
  hint?: string;
  value?: string;
  disabled?: boolean;
};

const input = (props: SearchInputArgs = {}) =>
  createElement('ui-search-input', {
    variant: props.variant,
    'data-size': props.size,
    state: props.state,
    placeholder: props.placeholder,
    hint: props.hint,
    value: props.value,
    disabled: props.disabled || undefined,
  });

export const Default: Story = {
  render: (args: SearchInputArgs) => input(args),
};

export const WithValue: Story = {
  args: { value: 'Szczygieł Tartt' },
  render: (args: SearchInputArgs) => input(args),
};

export const WithHint: Story = {
  args: { hint: 'Minimum of 8 characters.' },
  render: (args: SearchInputArgs) => input(args),
};

export const Sizes: Story = {
  render: () =>
    createElement(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 320 } },
      input({ size: 'small', placeholder: 'Search...' }),
      input({ size: 'default', placeholder: 'Search...' }),
      input({ size: 'large', placeholder: 'Search...' }),
    ),
};

export const AllSizes: Story = {
  args: {
    variant: 'outline',
  },

  render: () =>
    createElement(
      'div',
      { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: 480 } },
      input({ size: 'small', placeholder: 'Search...' }),
      input({ size: 'small', value: 'Szczygieł Tartt' }),
      input({ size: 'default', placeholder: 'Search...' }),
      input({ size: 'default', value: 'Szczygieł Tartt' }),
      input({ size: 'large', placeholder: 'Search...' }),
      input({ size: 'large', value: 'Szczygieł Tartt' }),
    ),
};

export const States: Story = {
  render: () =>
    createElement(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 320 } },
      input({ state: 'default', placeholder: 'Default state' }),
      input({ state: 'success', placeholder: 'Success state', hint: 'Results found.' }),
      input({ state: 'error', placeholder: 'Error state', hint: 'No results found.' }),
      input({ state: 'disabled', placeholder: 'Disabled state' }),
    ),
};
