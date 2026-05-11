import { createElement } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { svgMap } from '@mszczygiel-projects/icons';
import './icon-button.js';

const meta: Meta = {
  title: 'Web Components/IconButton',
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger'],
    },
    size: {
      control: 'select',
      options: ['small', 'default', 'large'],
    },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
  },
  args: {
    variant: 'primary',
    size: 'default',
    loading: false,
    disabled: false,
    label: 'Action',
  },
};

export default meta;
type Story = StoryObj;

type IconButtonArgs = {
  variant?: string;
  size?: string;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
};

const iconSpan = (name: keyof typeof svgMap) =>
  createElement('span', {
    style: { display: 'inline-flex' },
    dangerouslySetInnerHTML: { __html: svgMap[name] },
  });

const btn = (props: IconButtonArgs = {}) =>
  createElement(
    'ui-icon-button',
    {
      variant: props.variant,
      'data-size': props.size,
      loading: props.loading || undefined,
      disabled: props.disabled || undefined,
      label: props.label ?? 'Action',
    },
    iconSpan('icon-chevron-down'),
  );

export const Primary: Story = {
  render: ({ variant, size, loading, disabled, label }: IconButtonArgs) =>
    btn({ variant, size, loading, disabled, label }),
};

export const Secondary: Story = {
  args: { variant: 'secondary' },
  render: ({ variant, size, loading, disabled, label }: IconButtonArgs) =>
    btn({ variant, size, loading, disabled, label }),
};

export const Outline: Story = {
  args: { variant: 'outline' },
  render: ({ variant, size, loading, disabled, label }: IconButtonArgs) =>
    btn({ variant, size, loading, disabled, label }),
};

export const Ghost: Story = {
  args: { variant: 'ghost' },
  render: ({ variant, size, loading, disabled, label }: IconButtonArgs) =>
    btn({ variant, size, loading, disabled, label }),
};

export const Danger: Story = {
  args: { variant: 'danger' },
  render: ({ variant, size, loading, disabled, label }: IconButtonArgs) =>
    btn({ variant, size, loading, disabled, label }),
};

export const Sizes: Story = {
  render: () =>
    createElement(
      'div',
      { style: { display: 'flex', gap: '1rem', alignItems: 'center' } },
      btn({ size: 'small' }),
      btn({ size: 'default' }),
      btn({ size: 'large' }),
    ),
};

export const Loading: Story = {
  args: { loading: true },
  render: ({ variant, size }: IconButtonArgs) =>
    createElement(
      'div',
      { style: { display: 'flex', gap: '1rem', alignItems: 'center' } },
      btn({ variant: variant ?? 'primary', size, loading: true }),
      btn({ variant: 'secondary', size, loading: true }),
      btn({ variant: 'outline', size, loading: true }),
    ),
};

export const Disabled: Story = {
  args: { disabled: true },
  render: ({ size }: IconButtonArgs) =>
    createElement(
      'div',
      { style: { display: 'flex', gap: '1rem', alignItems: 'center' } },
      btn({ variant: 'primary', size, disabled: true }),
      btn({ variant: 'secondary', size, disabled: true }),
      btn({ variant: 'outline', size, disabled: true }),
      btn({ variant: 'ghost', size, disabled: true }),
      btn({ variant: 'danger', size, disabled: true }),
    ),
};

export const AllVariants: Story = {
  render: () =>
    createElement(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: '1rem' } },
      ...(['small', 'default', 'large'] as const).map((size) =>
        createElement(
          'div',
          { key: size, style: { display: 'flex', gap: '0.75rem', alignItems: 'center' } },
          ...(['primary', 'secondary', 'outline', 'ghost', 'danger'] as const).map((variant) =>
            btn({ variant, size }),
          ),
        ),
      ),
    ),
};
