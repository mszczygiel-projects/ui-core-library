import { createElement } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { svgMap } from '@ui-core/icons';
import './button.js';

const meta: Meta = {
  title: 'Web Components/Button',
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
  },
};

export default meta;
type Story = StoryObj;

type ButtonArgs = {
  variant?: string;
  size?: string;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
};

const btn = (text: string, props: ButtonArgs = {}, ...children: unknown[]) =>
  createElement(
    'ui-button',
    {
      variant: props.variant,
      'data-size': props.size,
      loading: props.loading || undefined,
      disabled: props.disabled || undefined,
      label: props.label,
    },
    ...children,
    text,
  );

const iconSpan = (slot: 'icon-left' | 'icon-right', name: keyof typeof svgMap) =>
  createElement('span', {
    slot,
    style: { display: 'inline-flex', width: '1.25rem', height: '1.25rem' },
    dangerouslySetInnerHTML: { __html: svgMap[name] },
  });

export const Primary: Story = {
  render: ({ variant, size, loading, disabled }: ButtonArgs) =>
    btn('Click me', { variant, size, loading, disabled }),
};

export const Secondary: Story = {
  args: { variant: 'secondary' },
  render: ({ variant, size, loading, disabled }: ButtonArgs) =>
    btn('Click me', { variant, size, loading, disabled }),
};

export const Outline: Story = {
  args: { variant: 'outline' },
  render: ({ variant, size, loading, disabled }: ButtonArgs) =>
    btn('Click me', { variant, size, loading, disabled }),
};

export const Ghost: Story = {
  args: { variant: 'ghost' },
  render: ({ variant, size, loading, disabled }: ButtonArgs) =>
    btn('Click me', { variant, size, loading, disabled }),
};

export const Danger: Story = {
  args: { variant: 'danger' },
  render: ({ variant, size, loading, disabled }: ButtonArgs) =>
    btn('Click me', { variant, size, loading, disabled }),
};

export const Sizes: Story = {
  render: () =>
    createElement(
      'div',
      { style: { display: 'flex', gap: '1rem', alignItems: 'center' } },
      btn('Small', { size: 'small' }),
      btn('Default', { size: 'default' }),
      btn('Large', { size: 'large' }),
    ),
};

export const WithIcons: Story = {
  render: () =>
    createElement(
      'div',
      { style: { display: 'flex', gap: '1rem', alignItems: 'center' } },
      createElement(
        'ui-button',
        {},
        iconSpan('icon-left', 'icon-search'),
        'Search',
        iconSpan('icon-right', 'icon-chevron-right'),
      ),
      createElement(
        'ui-button',
        { variant: 'outline' },
        iconSpan('icon-left', 'icon-cart'),
        'Outline',
      ),
    ),
};

export const Loading: Story = {
  args: { loading: true },
  render: ({ variant, size }: ButtonArgs) =>
    createElement(
      'div',
      { style: { display: 'flex', gap: '1rem', alignItems: 'center' } },
      btn('Saving…', { variant: variant ?? 'primary', size, loading: true }),
      btn('Saving…', { variant: 'secondary', size, loading: true }),
      btn('Saving…', { variant: 'outline', size, loading: true }),
    ),
};

export const Disabled: Story = {
  args: { disabled: true },
  render: ({ size }: ButtonArgs) =>
    createElement(
      'div',
      { style: { display: 'flex', gap: '1rem', alignItems: 'center' } },
      btn('Primary', { variant: 'primary', size, disabled: true }),
      btn('Secondary', { variant: 'secondary', size, disabled: true }),
      btn('Outline', { variant: 'outline', size, disabled: true }),
      btn('Ghost', { variant: 'ghost', size, disabled: true }),
      btn('Danger', { variant: 'danger', size, disabled: true }),
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
            btn(variant, { variant, size }),
          ),
        ),
      ),
    ),
};
