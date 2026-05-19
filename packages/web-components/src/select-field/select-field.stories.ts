import { createElement, useRef, useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { SelectOption } from './select-field.js';
import './select-field.js';

const FRUIT_OPTIONS: SelectOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'durian', label: 'Durian', disabled: true },
  { value: 'elderberry', label: 'Elderberry' },
];

type SelectFieldArgs = {
  variant?: string;
  size?: string;
  state?: string;
  label?: string;
  hint?: string;
  placeholder?: string;
  value?: string;
  clearable?: boolean;
  disabled?: boolean;
  options?: SelectOption[];
};

function SelectFieldWC(props: SelectFieldArgs) {
  const ref = useRef<HTMLElement & { options: SelectOption[] }>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.options = props.options ?? FRUIT_OPTIONS;
    }
  }, [props.options]);

  return createElement('ui-select-field', {
    ref,
    variant: props.variant,
    'data-size': props.size,
    state: props.state,
    label: props.label,
    hint: props.hint,
    placeholder: props.placeholder,
    value: props.value,
    clearable: props.clearable || undefined,
    disabled: props.disabled || undefined,
  });
}

const meta: Meta<SelectFieldArgs> = {
  title: 'Web Components/SelectField',
  component: SelectFieldWC,
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
    label: { control: 'text' },
    hint: { control: 'text' },
    placeholder: { control: 'text' },
    clearable: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    variant: 'outline',
    size: 'default',
    state: 'default',
    label: 'Label',
    placeholder: 'Select option...',
    clearable: false,
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<SelectFieldArgs>;

export const Default: Story = {};

export const WithValue: Story = {
  args: { value: 'banana' },
};

export const WithHint: Story = {
  args: { hint: 'Choose your favourite fruit.' },
};

export const Clearable: Story = {
  args: { value: 'apple', clearable: true },
};

export const Sizes: Story = {
  render: () =>
    createElement(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 320 } },
      createElement(SelectFieldWC, { size: 'small', label: 'Small' }),
      createElement(SelectFieldWC, { size: 'default', label: 'Default' }),
      createElement(SelectFieldWC, { size: 'large', label: 'Large' }),
    ),
};

export const States: Story = {
  render: () =>
    createElement(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 320 } },
      createElement(SelectFieldWC, { state: 'default', label: 'Default' }),
      createElement(SelectFieldWC, {
        state: 'success',
        label: 'Success',
        hint: 'Great choice!',
        value: 'apple',
      }),
      createElement(SelectFieldWC, {
        state: 'error',
        label: 'Error',
        hint: 'Please select an option.',
      }),
      createElement(SelectFieldWC, { state: 'disabled', label: 'Disabled' }),
    ),
};

export const Variants: Story = {
  render: () =>
    createElement(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 320 } },
      createElement(SelectFieldWC, { variant: 'outline', label: 'Outline' }),
      createElement(SelectFieldWC, { variant: 'filled', label: 'Filled' }),
      createElement(SelectFieldWC, { variant: 'underlined', label: 'Underlined' }),
    ),
};
