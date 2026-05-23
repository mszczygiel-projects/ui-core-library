import type { Meta, StoryObj } from '@storybook/react';
import { Notification } from './Notification.js';
import type { NotificationStatus, NotificationVariant } from './Notification.js';

const DESCRIPTION =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent sit amet mollis sapien, eget posuere orci.';

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
type Story = StoryObj<typeof Notification>;

export const Default: Story = {
  render: (args) => <Notification {...args}>{DESCRIPTION}</Notification>,
};

export const Subtle: Story = {
  args: { variant: 'subtle' },
  render: (args) => <Notification {...args}>{DESCRIPTION}</Notification>,
};

export const NoDescription: Story = {
  render: (args) => <Notification {...args} />,
};

export const NoCloseButton: Story = {
  args: { hasCloseButton: false },
  render: (args) => <Notification {...args}>{DESCRIPTION}</Notification>,
};

const statuses: NotificationStatus[] = ['info', 'success', 'warning', 'error'];
const variants: NotificationVariant[] = ['default', 'subtle'];

export const AllCombinations: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 300px)', gap: '1rem' }}>
      {variants.map((variant) =>
        statuses.map((status) => (
          <Notification key={`${variant}-${status}`} {...args} status={status} variant={variant}>
            {DESCRIPTION}
          </Notification>
        )),
      )}
    </div>
  ),
};
