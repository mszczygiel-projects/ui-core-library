import { createElement, type ComponentType } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { UiNotification } from './notification.js';
import './notification.js';

const DESCRIPTION =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent sit amet mollis sapien, eget posuere orci.';

const meta: Meta = {
  title: 'Web Components/Notification',
  // Tag-name string routes autodocs to the CEM extractor (see .storybook/preview.ts).
  component: 'ui-notification' as unknown as ComponentType,
  argTypes: {
    status: {
      control: 'select',
      options: ['info', 'success', 'warning', 'error'],
    },
    variant: {
      control: 'select',
      options: ['default', 'subtle'],
    },
    heading: { control: 'text' },
    hasLeadingIcon: { control: 'boolean' },
    hasCloseButton: { control: 'boolean' },
  },
  args: {
    status: 'info',
    variant: 'default',
    heading: 'Lorem ipsum dolor sit amet, consectet adipiscing elit.',
    hasLeadingIcon: true,
    hasCloseButton: true,
  },
};

export default meta;
type Story = StoryObj;

type Args = {
  status: string;
  variant: string;
  heading: string;
  hasLeadingIcon: boolean;
  hasCloseButton: boolean;
};

const el = (
  { heading, hasLeadingIcon, hasCloseButton, ...rest }: Args,
  description?: string,
  key?: string,
) =>
  createElement(
    'ui-notification',
    {
      ...rest,
      key,
      heading,
      // Both booleans default to `true`, so an absent attribute cannot express
      // `false` — set them as properties instead.
      ref: (node: UiNotification | null) => {
        if (!node) return;
        node.hasLeadingIcon = hasLeadingIcon;
        node.hasCloseButton = hasCloseButton;
      },
    },
    description ?? null,
  );

export const Default: Story = {
  render: (args: Args) => el(args, DESCRIPTION),
};

export const Subtle: Story = {
  args: { variant: 'subtle' },
  render: (args: Args) => el(args, DESCRIPTION),
};

export const NoDescription: Story = {
  render: (args: Args) => el(args),
};

export const NoCloseButton: Story = {
  args: { hasCloseButton: false },
  render: (args: Args) => el(args, DESCRIPTION),
};

export const NoLeadingIcon: Story = {
  args: { hasLeadingIcon: false },
  render: (args: Args) => el(args, DESCRIPTION),
};

const statuses = ['info', 'success', 'warning', 'error'] as const;
const variants = ['default', 'subtle'] as const;

export const AllCombinations: Story = {
  render: (args: Args) =>
    createElement(
      'div',
      { style: { display: 'grid', gridTemplateColumns: 'repeat(4, 300px)', gap: '1rem' } },
      ...variants.flatMap((variant) =>
        statuses.map((status) =>
          el({ ...args, status, variant }, DESCRIPTION, `${variant}-${status}`),
        ),
      ),
    ),
};

export const OnSurfaces: Story = {
  render: (args: Args) =>
    createElement(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
      ...['default', 'subtle', 'inverse', 'primary'].map((surface) =>
        createElement(
          'div',
          {
            key: surface,
            'data-surface': surface === 'default' ? undefined : surface,
            style: {
              backgroundColor: 'var(--color-background-default)',
              padding: 16,
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 300px)',
              gap: 8,
            },
          },
          ...variants.map((variant) =>
            el({ ...args, variant }, DESCRIPTION, `${surface}-${variant}`),
          ),
        ),
      ),
    ),
};
