import type { Meta, StoryObj } from '@storybook/react';
import { Notification } from './Notification.js';
import type { NotificationStatus, NotificationVariant } from './Notification.js';

const meta: Meta<typeof Notification> = {
  title: 'React/Notification',
  component: Notification,
  argTypes: {
    status: {
      control: 'select',
      options: ['info', 'success', 'warning', 'error'] satisfies NotificationStatus[],
    },
    variant: {
      control: 'select',
      options: ['default', 'subtle'] satisfies NotificationVariant[],
    },
    title: { control: 'text' },
    description: { control: 'text' },
    hasCloseButton: { control: 'boolean' },
  },
  args: {
    status: 'info',
    variant: 'default',
    title: 'Lorem ipsum dolor sit amet, consectet adipiscing elit.',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent sit amet mollis sapien, eget posuere orci.',
    hasCloseButton: true,
  },
};

export default meta;
type Story = StoryObj<typeof Notification>;

export const Default: Story = {};

export const Subtle: Story = {
  args: { variant: 'subtle' },
};

export const NoDescription: Story = {
  args: { description: undefined },
};

export const NoCloseButton: Story = {
  args: { hasCloseButton: false },
};

const statuses: NotificationStatus[] = ['info', 'success', 'warning', 'error'];

export const Statuses: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 300px)', gap: '1rem' }}>
      {statuses.map((status) => (
        <Notification key={status} {...args} status={status} variant="default" />
      ))}
    </div>
  ),
};

export const StatusesSubtle: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 300px)', gap: '1rem' }}>
      {statuses.map((status) => (
        <Notification key={status} {...args} status={status} variant="subtle" />
      ))}
    </div>
  ),
};

const variants: NotificationVariant[] = ['default', 'subtle'];

export const AllCombinations: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 300px)', gap: '1rem' }}>
      {variants.map((variant) =>
        statuses.map((status) => (
          <Notification key={`${variant}-${status}`} {...args} status={status} variant={variant} />
        )),
      )}
    </div>
  ),
};
