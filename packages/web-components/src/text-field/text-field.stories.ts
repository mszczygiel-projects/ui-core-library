import { createElement } from 'react';
import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { svgMap } from '@mszczygiel-projects/ui-core-icons';
import './text-field.js';

const iconOptions = Object.keys(svgMap) as Array<keyof typeof svgMap>;

const meta: Meta = {
  title: 'Web Components/TextField',
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
    leadingIcon: {
      control: 'select',
      options: ['', ...iconOptions],
    },
    trailingIcon: {
      control: 'select',
      options: ['', ...iconOptions],
    },
  },
  args: {
    variant: 'outline',
    size: 'default',
    labelPlacement: 'top',
    state: 'default',
    label: 'Email address',
    placeholder: 'you@example.com',
    disabled: false,
    leadingIcon: '',
    trailingIcon: '',
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
  leadingIcon?: keyof typeof svgMap | '';
  trailingIcon?: keyof typeof svgMap | '';
};

const input = (props: InputArgs = {}, ...children: ReactNode[]) =>
  createElement(
    'ui-text-field',
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

const iconChildren = ({ leadingIcon, trailingIcon }: InputArgs) => {
  const children: ReactNode[] = [];

  if (leadingIcon) {
    children.push(iconSpan('leading-icon', leadingIcon));
  }

  if (trailingIcon) {
    children.push(iconSpan('trailing-icon', trailingIcon));
  }

  return children;
};

const renderInput = (args: InputArgs) => input(args, ...iconChildren(args));

export const Outline: Story = {
  args: {},
  render: renderInput,
};

export const Filled: Story = {
  args: { variant: 'filled' },
  render: renderInput,
};

export const Underlined: Story = {
  args: { variant: 'underlined' },
  render: renderInput,
};

export const OutlineInnerLabel: Story = {
  args: { labelPlacement: 'inner' },
  render: renderInput,
};

export const FilledInnerLabel: Story = {
  args: { variant: 'filled', labelPlacement: 'inner' },
  render: renderInput,
};

export const UnderlinedInnerLabel: Story = {
  args: { variant: 'underlined', labelPlacement: 'inner' },
  render: renderInput,
};

export const OutlineFloatingLabel: Story = {
  args: { labelPlacement: 'floating' },
  render: renderInput,
};

export const FilledFloatingLabel: Story = {
  args: { variant: 'filled', labelPlacement: 'floating' },
  render: renderInput,
};

export const UnderlinedFloatingLabel: Story = {
  args: { variant: 'underlined', labelPlacement: 'floating' },
  render: renderInput,
};
