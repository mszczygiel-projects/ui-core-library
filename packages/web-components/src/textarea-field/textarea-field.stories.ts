import { createElement, type ComponentType } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import './textarea-field.js';

const meta: Meta = {
  title: 'Web Components/TextareaField',
  // Tag-name string routes autodocs to the CEM extractor (see .storybook/preview.ts).
  component: 'ui-textarea-field' as unknown as ComponentType,
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
    resize: {
      control: 'select',
      options: ['none', 'vertical', 'auto'],
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
    resize: 'vertical',
    label: 'Message',
    placeholder: 'Tell us what happened',
    hint: 'Max 500 characters',
    value: '',
    disabled: false,
  },
};

export default meta;
type Story = StoryObj;

type TextareaArgs = {
  variant?: string;
  size?: string;
  labelPlacement?: string;
  state?: string;
  resize?: string;
  label?: string;
  placeholder?: string;
  hint?: string;
  value?: string;
  disabled?: boolean;
};

const textarea = (props: TextareaArgs = {}) =>
  createElement('ui-textarea-field', {
    variant: props.variant,
    'data-size': props.size,
    'label-placement': props.labelPlacement,
    state: props.state,
    resize: props.resize,
    label: props.label,
    placeholder: props.placeholder,
    hint: props.hint,
    value: props.value || undefined,
    disabled: props.disabled || undefined,
  });

const renderTextarea = (args: TextareaArgs) => textarea(args);

export const Outline: Story = {
  args: {},
  render: renderTextarea,
};

export const Filled: Story = {
  args: { variant: 'filled' },
  render: renderTextarea,
};

export const Underlined: Story = {
  args: { variant: 'underlined' },
  render: renderTextarea,
};

export const InnerLabel: Story = {
  args: { labelPlacement: 'inner' },
  render: renderTextarea,
};

export const FloatingLabel: Story = {
  args: { labelPlacement: 'floating' },
  render: renderTextarea,
};

export const Sizes: Story = {
  render: (args: TextareaArgs) =>
    createElement(
      'div',
      { style: { display: 'grid', gap: '1.5rem', maxWidth: '28rem' } },
      textarea({ ...args, size: 'small', label: 'Small' }),
      textarea({ ...args, size: 'default', label: 'Default' }),
      textarea({ ...args, size: 'large', label: 'Large' }),
    ),
};

export const ResizeModes: Story = {
  render: (args: TextareaArgs) =>
    createElement(
      'div',
      { style: { display: 'grid', gap: '1.5rem', maxWidth: '28rem' } },
      textarea({
        ...args,
        resize: 'none',
        label: 'resize="none"',
        hint: 'Fixed height — no drag handle.',
      }),
      textarea({
        ...args,
        resize: 'vertical',
        label: 'resize="vertical"',
        hint: 'Drag the handle in the bottom-right corner.',
      }),
      textarea({
        ...args,
        resize: 'auto',
        label: 'resize="auto"',
        hint: 'Grows as you type — no maximum height.',
      }),
    ),
};

export const States: Story = {
  render: (args: TextareaArgs) =>
    createElement(
      'div',
      { style: { display: 'grid', gap: '1.5rem', maxWidth: '28rem' } },
      textarea({ ...args, state: 'default', label: 'Default' }),
      textarea({ ...args, state: 'success', label: 'Success', hint: 'Looks good.' }),
      textarea({ ...args, state: 'error', label: 'Error', hint: 'This field is required.' }),
      textarea({ ...args, state: 'disabled', label: 'Disabled' }),
    ),
};

export const OnSurfaces: Story = {
  render: (args: TextareaArgs) =>
    createElement(
      'div',
      { style: { display: 'grid', gap: '1rem' } },
      ...(['default', 'subtle', 'inverse', 'primary'] as const).map((surface) =>
        createElement(
          'div',
          {
            key: surface,
            'data-surface': surface === 'default' ? undefined : surface,
            style: {
              padding: '1.5rem',
              backgroundColor: 'var(--color-background-default)',
            },
          },
          textarea({ ...args, label: surface }),
        ),
      ),
    ),
};
