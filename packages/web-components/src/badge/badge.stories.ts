import { createElement } from 'react';
import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { svgMap } from '@mszczygiel-projects/ui-core-icons';
import './badge.js';

const iconOptions = Object.keys(svgMap) as Array<keyof typeof svgMap>;

const meta: Meta = {
  title: 'Web Components/Badge',
  argTypes: {
    variant: {
      control: 'select',
      options: ['neutral', 'brand', 'success', 'warning', 'error', 'info'],
    },
    appearance: {
      control: 'select',
      options: ['solid', 'subtle'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium'],
    },
    shape: {
      control: 'select',
      options: ['rounded', 'square'],
    },
    label: { control: 'text' },
    icon: {
      control: 'select',
      options: ['', ...iconOptions],
    },
    iconOnly: { control: 'boolean' },
  },
  args: {
    variant: 'neutral',
    appearance: 'solid',
    size: 'small',
    shape: 'rounded',
    label: 'Badge',
    icon: '',
    iconOnly: false,
  },
};

export default meta;
type Story = StoryObj;

type BadgeArgs = {
  variant?: string;
  appearance?: string;
  size?: string;
  shape?: string;
  label?: string;
  icon?: keyof typeof svgMap | '';
  iconOnly?: boolean;
};

const iconSpan = (name: keyof typeof svgMap) =>
  createElement('span', {
    slot: 'icon',
    style: { display: 'inline-flex' },
    dangerouslySetInnerHTML: { __html: svgMap[name] },
  });

const badge = (args: BadgeArgs, text?: string): ReactNode => {
  const iconName = args.icon || (args.iconOnly ? 'icon-info' : '');
  return createElement(
    'ui-badge',
    {
      variant: args.variant,
      appearance: args.appearance,
      'data-size': args.size,
      shape: args.shape,
      'icon-only': args.iconOnly || undefined,
      label: args.iconOnly ? (args.label ?? 'Badge') : undefined,
    },
    ...(iconName ? [iconSpan(iconName)] : []),
    ...(args.iconOnly ? [] : [text ?? args.label ?? 'Badge']),
  );
};

const variants = ['neutral', 'brand', 'success', 'warning', 'error', 'info'];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const row = (...children: ReactNode[]) =>
  createElement(
    'div',
    { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' } },
    ...children,
  );

const column = (...children: ReactNode[]) =>
  createElement(
    'div',
    { style: { display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' } },
    ...children,
  );

export const Playground: Story = {
  render: (args: BadgeArgs) => badge(args),
};

export const SolidVariants: Story = {
  render: ({ size, shape }: BadgeArgs) =>
    row(...variants.map((v) => badge({ variant: v, appearance: 'solid', size, shape }, cap(v)))),
};

export const SubtleVariants: Story = {
  render: ({ size, shape }: BadgeArgs) =>
    row(...variants.map((v) => badge({ variant: v, appearance: 'subtle', size, shape }, cap(v)))),
};

export const Sizes: Story = {
  render: ({ variant, appearance, shape }: BadgeArgs) =>
    row(
      badge({ variant, appearance, size: 'small', shape }, 'Small'),
      badge({ variant, appearance, size: 'medium', shape }, 'Medium'),
    ),
};

export const Shapes: Story = {
  render: ({ variant, appearance, size }: BadgeArgs) =>
    row(
      badge({ variant, appearance, size, shape: 'rounded' }, 'Rounded'),
      badge({ variant, appearance, size, shape: 'square' }, 'Square'),
    ),
};

export const WithIcon: Story = {
  args: { icon: 'icon-info' },
  render: (args: BadgeArgs) =>
    row(...variants.map((v) => badge({ ...args, variant: v }, cap(v)))),
};

export const IconOnly: Story = {
  args: { iconOnly: true, icon: 'icon-info' },
  render: (args: BadgeArgs) => row(...variants.map((v) => badge({ ...args, variant: v }))),
};

export const OnSurfaces: Story = {
  render: ({ size, shape }: BadgeArgs) =>
    column(
      ...['default', 'subtle', 'inverse', 'primary'].map((surface) =>
        createElement(
          'div',
          {
            'data-surface': surface === 'default' ? undefined : surface,
            style: {
              backgroundColor: 'var(--color-background-default)',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            },
          },
          row(
            ...variants.map((v) => badge({ variant: v, appearance: 'solid', size, shape }, cap(v))),
          ),
          row(
            ...variants.map((v) =>
              badge({ variant: v, appearance: 'subtle', size, shape }, cap(v)),
            ),
          ),
        ),
      ),
    ),
};
