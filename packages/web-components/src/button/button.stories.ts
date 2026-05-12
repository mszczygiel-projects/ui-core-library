import { createElement } from 'react';
import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { svgMap } from '@mszczygiel-projects/ui-core-icons';
import './button.js';

const iconOptions = Object.keys(svgMap) as Array<keyof typeof svgMap>;

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
    iconLeft: {
      control: 'select',
      options: ['', ...iconOptions],
    },
    iconRight: {
      control: 'select',
      options: ['', ...iconOptions],
    },
  },
  args: {
    variant: 'primary',
    size: 'default',
    loading: false,
    disabled: false,
    label: 'More information',
    iconLeft: '',
    iconRight: '',
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
  iconLeft?: keyof typeof svgMap | '';
  iconRight?: keyof typeof svgMap | '';
};

const btn = (text: string, props: ButtonArgs = {}, ...children: ReactNode[]) =>
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
    style: { display: 'inline-flex' },
    dangerouslySetInnerHTML: { __html: svgMap[name] },
  });

const iconChildren = ({ iconLeft, iconRight }: ButtonArgs) => {
  const children: ReactNode[] = [];

  if (iconLeft) {
    children.push(iconSpan('icon-left', iconLeft));
  }

  if (iconRight) {
    children.push(iconSpan('icon-right', iconRight));
  }

  return children;
};

export const Primary: Story = {
  render: ({ variant, size, loading, disabled, label, iconLeft, iconRight }: ButtonArgs) =>
    btn(
      label ?? 'More information',
      { variant, size, loading, disabled, label },
      ...iconChildren({ iconLeft, iconRight }),
    ),
};

export const Secondary: Story = {
  args: { variant: 'secondary' },
  render: ({ variant, size, loading, disabled, label, iconLeft, iconRight }: ButtonArgs) =>
    btn(
      label ?? 'More information',
      { variant, size, loading, disabled, label },
      ...iconChildren({ iconLeft, iconRight }),
    ),
};

export const Outline: Story = {
  args: { variant: 'outline' },
  render: ({ variant, size, loading, disabled, label, iconLeft, iconRight }: ButtonArgs) =>
    btn(
      label ?? 'More information',
      { variant, size, loading, disabled, label },
      ...iconChildren({ iconLeft, iconRight }),
    ),
};

export const Ghost: Story = {
  args: { variant: 'ghost' },
  render: ({ variant, size, loading, disabled, label, iconLeft, iconRight }: ButtonArgs) =>
    btn(
      label ?? 'More information',
      { variant, size, loading, disabled, label },
      ...iconChildren({ iconLeft, iconRight }),
    ),
};

export const Danger: Story = {
  args: { variant: 'danger' },
  render: ({ variant, size, loading, disabled, label, iconLeft, iconRight }: ButtonArgs) =>
    btn(
      label ?? 'More information',
      { variant, size, loading, disabled, label },
      ...iconChildren({ iconLeft, iconRight }),
    ),
};

export const WithIcons: Story = {
  args: {
    label: 'Buy tickets',
    iconLeft: 'icon-ticket',
    iconRight: 'icon-chevron-right',
  },
  render: ({ variant, size, loading, disabled, label, iconLeft, iconRight }: ButtonArgs) =>
    btn(
      label ?? 'Buy tickets',
      { variant, size, loading, disabled, label },
      ...iconChildren({ iconLeft, iconRight }),
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
