import { createElement, type ComponentType } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import './radio-field.js';

const meta: Meta = {
  title: 'Web Components/RadioField',
  // Tag-name string routes autodocs to the CEM extractor (see .storybook/preview.ts).
  component: 'ui-radio-field' as unknown as ComponentType,
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
    hint: '',
    checked: false,
    disabled: false,
  },
};

export default meta;
type Story = StoryObj;

type RadioArgs = {
  state?: string;
  label?: string;
  hint?: string;
  checked?: boolean;
  disabled?: boolean;
};

const radio = (props: RadioArgs = {}) =>
  createElement('ui-radio-field', {
    state: props.state,
    label: props.label,
    hint: props.hint || undefined,
    checked: props.checked || undefined,
    disabled: props.disabled || undefined,
  });

export const Default: Story = {
  args: {},
  render: (args: RadioArgs) => radio(args),
};

export const WithHint: Story = {
  args: { hint: 'Minimum of 8 characters' },
  render: (args: RadioArgs) => radio(args),
};

export const Checked: Story = {
  args: { checked: true },
  render: (args: RadioArgs) => radio(args),
};

export const Error: Story = {
  args: { state: 'error', hint: 'This field is required.' },
  render: (args: RadioArgs) => radio(args),
};

export const ErrorChecked: Story = {
  args: { state: 'error', checked: true, hint: 'This field is required.' },
  render: (args: RadioArgs) => radio(args),
};

export const Disabled: Story = {
  args: { state: 'disabled', hint: 'Minimum of 8 characters' },
  render: (args: RadioArgs) => radio(args),
};

export const DisabledChecked: Story = {
  args: { state: 'disabled', checked: true },
  render: (args: RadioArgs) => radio(args),
};

export const NoHint: Story = {
  args: { hint: '' },
  render: (args: RadioArgs) => radio(args),
};

export const AllStates: Story = {
  render: () =>
    createElement(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: '1.5rem' } },
      radio({ label: 'Default', hint: 'Hint text' }),
      radio({ label: 'Checked', hint: 'Hint text', checked: true }),
      radio({ label: 'Error', state: 'error', hint: 'This field is required.' }),
      radio({
        label: 'Error checked',
        state: 'error',
        checked: true,
        hint: 'This field is required.',
      }),
      radio({ label: 'Disabled', state: 'disabled', hint: 'Hint text' }),
      radio({ label: 'Disabled checked', state: 'disabled', checked: true }),
    ),
};
