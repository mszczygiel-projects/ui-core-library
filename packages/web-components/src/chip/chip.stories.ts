import { createElement, type ComponentType } from 'react';
import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { svgMap } from '@mszczygiel-projects/ui-core-icons';
import './chip.js';

const iconOptions = Object.keys(svgMap) as Array<keyof typeof svgMap>;

const meta: Meta = {
  title: 'Web Components/Chip',
  // Tag-name string routes autodocs to the CEM extractor (see .storybook/preview.ts).
  component: 'ui-chip' as unknown as ComponentType,
  argTypes: {
    variant: {
      control: 'select',
      options: ['neutral', 'brand', 'success', 'warning', 'error', 'info'],
    },
    appearance: {
      control: 'select',
      options: ['solid', 'subtle', 'outline'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium'],
    },
    selected: { control: 'boolean' },
    disabled: { control: 'boolean' },
    dismissible: { control: 'boolean' },
    label: { control: 'text' },
    icon: {
      control: 'select',
      options: ['', ...iconOptions],
    },
  },
  args: {
    variant: 'neutral',
    appearance: 'solid',
    size: 'small',
    selected: false,
    disabled: false,
    dismissible: false,
    label: 'Chip',
    icon: '',
  },
};

export default meta;
type Story = StoryObj;

type ChipArgs = {
  variant?: string;
  appearance?: string;
  size?: string;
  selected?: boolean;
  disabled?: boolean;
  dismissible?: boolean;
  label?: string;
  icon?: keyof typeof svgMap | '';
};

const iconSpan = (name: keyof typeof svgMap) =>
  createElement('span', {
    slot: 'icon',
    style: { display: 'inline-flex' },
    dangerouslySetInnerHTML: { __html: svgMap[name] },
  });

const chip = (args: ChipArgs, text?: string): ReactNode =>
  createElement(
    'ui-chip',
    {
      variant: args.variant,
      appearance: args.appearance,
      'data-size': args.size,
      selected: args.selected || undefined,
      disabled: args.disabled || undefined,
      dismissible: args.dismissible || undefined,
    },
    ...(args.icon ? [iconSpan(args.icon)] : []),
    text ?? args.label ?? 'Chip',
  );

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
  render: (args: ChipArgs) => chip(args),
};

export const SolidVariants: Story = {
  render: ({ size, dismissible }: ChipArgs) =>
    row(
      ...variants.map((v) => chip({ variant: v, appearance: 'solid', size, dismissible }, cap(v))),
    ),
};

export const SubtleVariants: Story = {
  render: ({ size, dismissible }: ChipArgs) =>
    row(
      ...variants.map((v) => chip({ variant: v, appearance: 'subtle', size, dismissible }, cap(v))),
    ),
};

export const OutlineVariants: Story = {
  render: ({ size, dismissible }: ChipArgs) =>
    row(
      ...variants.map((v) =>
        chip({ variant: v, appearance: 'outline', size, dismissible }, cap(v)),
      ),
    ),
};

export const Sizes: Story = {
  render: ({ variant, appearance }: ChipArgs) =>
    row(
      chip({ variant, appearance, size: 'small' }, 'Small'),
      chip({ variant, appearance, size: 'medium' }, 'Medium'),
    ),
};

export const WithIcon: Story = {
  args: { icon: 'icon-star' },
  render: (args: ChipArgs) => row(...variants.map((v) => chip({ ...args, variant: v }, cap(v)))),
};

export const Selected: Story = {
  render: ({ size }: ChipArgs) =>
    column(
      ...['solid', 'subtle', 'outline'].map((appearance) =>
        row(
          ...variants.map((v) => chip({ variant: v, appearance, size, selected: true }, cap(v))),
        ),
      ),
    ),
};

export const Dismissible: Story = {
  args: { dismissible: true },
  render: ({ size, appearance }: ChipArgs) =>
    row(
      ...variants.map((v) => chip({ variant: v, appearance, size, dismissible: true }, cap(v))),
    ),
};

export const SelectedDismissible: Story = {
  name: 'Selected + dismissible',
  render: ({ size }: ChipArgs) =>
    column(
      ...['solid', 'subtle', 'outline'].map((appearance) =>
        row(
          ...variants.map((v) =>
            chip({ variant: v, appearance, size, selected: true, dismissible: true }, cap(v)),
          ),
        ),
      ),
    ),
};

export const Disabled: Story = {
  render: ({ size }: ChipArgs) =>
    column(
      ...['solid', 'subtle', 'outline'].map((appearance) =>
        row(
          ...variants.map((v) =>
            // dismissible stays set — the dismiss button must disappear while disabled
            chip({ variant: v, appearance, size, disabled: true, dismissible: true }, cap(v)),
          ),
        ),
      ),
    ),
};

export const OnSurfaces: Story = {
  render: ({ size }: ChipArgs) =>
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
          ...['solid', 'subtle', 'outline'].map((appearance) =>
            row(...variants.map((v) => chip({ variant: v, appearance, size }, cap(v)))),
          ),
        ),
      ),
    ),
};
