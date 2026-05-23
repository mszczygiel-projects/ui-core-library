import { createElement } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import './notification.js';

const DESCRIPTION =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent sit amet mollis sapien, eget posuere orci.';

const meta: Meta = {
  title: 'Web Components/Notification',
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
    hasCloseButton: { control: 'boolean' },
  },
  args: {
    status: 'info',
    variant: 'default',
    heading: 'Lorem ipsum dolor sit amet, consectet adipiscing elit.',
    hasCloseButton: true,
  },
};

export default meta;
type Story = StoryObj;

type Args = {
  status: string;
  variant: string;
  heading: string;
  hasCloseButton: boolean;
};

const el = ({ heading, hasCloseButton, ...rest }: Args, description?: string) =>
  createElement(
    'ui-notification',
    {
      ...rest,
      heading,
      'has-close-button': hasCloseButton || undefined,
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

const statuses = ['info', 'success', 'warning', 'error'] as const;
const variants = ['default', 'subtle'] as const;

export const AllCombinations: Story = {
  render: (args: Args) =>
    createElement(
      'div',
      { style: { display: 'grid', gridTemplateColumns: 'repeat(4, 300px)', gap: '1rem' } },
      ...variants.flatMap((variant) =>
        statuses.map((status) => el({ ...args, status, variant }, DESCRIPTION)),
      ),
    ),
};
