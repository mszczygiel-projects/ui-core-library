import { createElement, type ComponentType } from 'react';
import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { svgMap } from '@mszczygiel-projects/ui-core-icons';
import './link-button.js';

const iconOptions = Object.keys(svgMap) as Array<keyof typeof svgMap>;

const meta: Meta = {
  title: 'Web Components/LinkButton',
  // Tag-name string routes autodocs to the CEM extractor (see .storybook/preview.ts).
  component: 'ui-link-button' as unknown as ComponentType,
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger'],
    },
    size: {
      control: 'select',
      options: ['small', 'default', 'large'],
    },
    href: { control: 'text' },
    target: {
      control: 'select',
      options: ['', '_self', '_blank', '_parent', '_top'],
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
    variant: 'primary',
    size: 'default',
    href: 'https://example.com',
    target: '_self',
    loading: false,
    disabled: false,
    label: 'More information',
    iconLeft: '',
    iconRight: '',
    leadingIcon: '',
    trailingIcon: '',
  },
};

export default meta;
type Story = StoryObj;

type LinkButtonArgs = {
  variant?: string;
  size?: string;
  href?: string;
  target?: string;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
  iconLeft?: keyof typeof svgMap | '';
  iconRight?: keyof typeof svgMap | '';
  leadingIcon?: keyof typeof svgMap | '';
  trailingIcon?: keyof typeof svgMap | '';
};

const lbtn = (text: string, props: LinkButtonArgs = {}, ...children: ReactNode[]) =>
  createElement(
    'ui-link-button',
    {
      variant: props.variant,
      'data-size': props.size,
      href: props.href ?? 'https://example.com',
      target: props.target || undefined,
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

const iconBoxSpan = (slot: 'leading-icon' | 'trailing-icon', name: keyof typeof svgMap) =>
  createElement('span', {
    slot,
    style: { display: 'inline-flex' },
    dangerouslySetInnerHTML: { __html: svgMap[name] },
  });

const lbtnWithIconBoxes = (text: string, props: LinkButtonArgs = {}) => {
  const children: ReactNode[] = [];
  if (props.leadingIcon) children.push(iconBoxSpan('leading-icon', props.leadingIcon));
  if (props.trailingIcon) children.push(iconBoxSpan('trailing-icon', props.trailingIcon));
  children.push(...iconChildren({ iconLeft: props.iconLeft, iconRight: props.iconRight }));

  return createElement(
    'ui-link-button',
    {
      variant: props.variant,
      'data-size': props.size,
      href: props.href ?? '#',
      target: props.target || undefined,
      loading: props.loading || undefined,
      disabled: props.disabled || undefined,
      label: props.label,
      'has-leading-icon': props.leadingIcon ? true : undefined,
      'has-trailing-icon': props.trailingIcon ? true : undefined,
    },
    ...children,
    text,
  );
};

const iconChildren = ({ iconLeft, iconRight }: LinkButtonArgs) => {
  const children: ReactNode[] = [];
  if (iconLeft) children.push(iconSpan('icon-left', iconLeft));
  if (iconRight) children.push(iconSpan('icon-right', iconRight));
  return children;
};

export const Primary: Story = {
  render: ({
    variant,
    size,
    href,
    target,
    loading,
    disabled,
    label,
    iconLeft,
    iconRight,
  }: LinkButtonArgs) =>
    lbtn(
      label ?? 'More information',
      { variant, size, href, target, loading, disabled, label },
      ...iconChildren({ iconLeft, iconRight }),
    ),
};

export const Secondary: Story = {
  args: { variant: 'secondary' },
  render: ({
    variant,
    size,
    href,
    target,
    loading,
    disabled,
    label,
    iconLeft,
    iconRight,
  }: LinkButtonArgs) =>
    lbtn(
      label ?? 'More information',
      { variant, size, href, target, loading, disabled, label },
      ...iconChildren({ iconLeft, iconRight }),
    ),
};

export const Outline: Story = {
  args: { variant: 'outline' },
  render: ({
    variant,
    size,
    href,
    target,
    loading,
    disabled,
    label,
    iconLeft,
    iconRight,
  }: LinkButtonArgs) =>
    lbtn(
      label ?? 'More information',
      { variant, size, href, target, loading, disabled, label },
      ...iconChildren({ iconLeft, iconRight }),
    ),
};

export const Ghost: Story = {
  args: { variant: 'ghost' },
  render: ({
    variant,
    size,
    href,
    target,
    loading,
    disabled,
    label,
    iconLeft,
    iconRight,
  }: LinkButtonArgs) =>
    lbtn(
      label ?? 'More information',
      { variant, size, href, target, loading, disabled, label },
      ...iconChildren({ iconLeft, iconRight }),
    ),
};

export const Danger: Story = {
  args: { variant: 'danger' },
  render: ({
    variant,
    size,
    href,
    target,
    loading,
    disabled,
    label,
    iconLeft,
    iconRight,
  }: LinkButtonArgs) =>
    lbtn(
      label ?? 'More information',
      { variant, size, href, target, loading, disabled, label },
      ...iconChildren({ iconLeft, iconRight }),
    ),
};

export const WithIcons: Story = {
  args: {
    label: 'Buy tickets',
    iconLeft: 'icon-ticket',
    iconRight: 'icon-chevron-right',
  },
  render: ({
    variant,
    size,
    href,
    target,
    loading,
    disabled,
    label,
    iconLeft,
    iconRight,
  }: LinkButtonArgs) =>
    lbtn(
      label ?? 'Buy tickets',
      { variant, size, href, target, loading, disabled, label },
      ...iconChildren({ iconLeft, iconRight }),
    ),
};

export const ExternalLink: Story = {
  args: {
    href: 'https://example.com',
    target: '_blank',
    label: 'Open in new tab',
  },
  render: ({ variant, size, href, target, loading, disabled, label }: LinkButtonArgs) =>
    lbtn(label ?? 'Open in new tab', { variant, size, href, target, loading, disabled, label }),
};

export const WithIconBoxes: Story = {
  args: {
    label: 'Kup bilet',
    leadingIcon: 'icon-ticket',
    trailingIcon: 'icon-chevron-right',
  },
  render: ({
    variant,
    size,
    href,
    target,
    loading,
    disabled,
    label,
    iconLeft,
    iconRight,
    leadingIcon,
    trailingIcon,
  }: LinkButtonArgs) =>
    lbtnWithIconBoxes(label ?? 'Kup bilet', {
      variant,
      size,
      href,
      target,
      loading,
      disabled,
      iconLeft,
      iconRight,
      leadingIcon,
      trailingIcon,
    }),
};
