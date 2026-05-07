import { createElement } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import './checkbox-field.js';

const meta: Meta = {
  title: 'Web Components/CheckboxField',
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
    hint: '',
    checked: false,
    indeterminate: false,
    disabled: false,
  },
};

export default meta;
type Story = StoryObj;

type CheckboxArgs = {
  state?: string;
  label?: string;
  hint?: string;
  checked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
};

const checkbox = (props: CheckboxArgs = {}) =>
  createElement('ui-checkbox-field', {
    state: props.state,
    label: props.label,
    hint: props.hint || undefined,
    checked: props.checked || undefined,
    indeterminate: props.indeterminate || undefined,
    disabled: props.disabled || undefined,
  });

export const Default: Story = {
  args: {},
  render: (args: CheckboxArgs) => checkbox(args),
};

export const WithHint: Story = {
  args: { hint: 'Minimum of 8 characters' },
  render: (args: CheckboxArgs) => checkbox(args),
};

export const Checked: Story = {
  args: { checked: true },
  render: (args: CheckboxArgs) => checkbox(args),
};

export const Indeterminate: Story = {
  args: { indeterminate: true },
  render: (args: CheckboxArgs) => checkbox(args),
};

export const Error: Story = {
  args: { state: 'error', hint: 'This field is required.' },
  render: (args: CheckboxArgs) => checkbox(args),
};

export const ErrorChecked: Story = {
  args: { state: 'error', checked: true, hint: 'This field is required.' },
  render: (args: CheckboxArgs) => checkbox(args),
};

export const Disabled: Story = {
  args: { state: 'disabled', hint: 'Minimum of 8 characters' },
  render: (args: CheckboxArgs) => checkbox(args),
};

export const DisabledChecked: Story = {
  args: { state: 'disabled', checked: true },
  render: (args: CheckboxArgs) => checkbox(args),
};

export const NoHint: Story = {
  args: { hint: '' },
  render: (args: CheckboxArgs) => checkbox(args),
};

export const AllStates: Story = {
  render: () =>
    createElement(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: '1.5rem' } },
      checkbox({ label: 'Default', hint: 'Hint text' }),
      checkbox({ label: 'Checked', hint: 'Hint text', checked: true }),
      checkbox({ label: 'Indeterminate', hint: 'Hint text', indeterminate: true }),
      checkbox({ label: 'Error', state: 'error', hint: 'This field is required.' }),
      checkbox({
        label: 'Error checked',
        state: 'error',
        checked: true,
        hint: 'This field is required.',
      }),
      checkbox({ label: 'Disabled', state: 'disabled', hint: 'Hint text' }),
      checkbox({ label: 'Disabled checked', state: 'disabled', checked: true }),
    ),
};
