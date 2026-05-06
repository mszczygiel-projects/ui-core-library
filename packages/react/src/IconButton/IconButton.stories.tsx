import type { Meta, StoryObj } from '@storybook/react';
import { IconChevronDown } from '@ui-core/icons/react';
import { IconButton } from './IconButton.js';

const meta: Meta<typeof IconButton> = {
  title: 'React/IconButton',
  component: IconButton,
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
    'aria-label': { control: 'text' },
  },
  args: {
    variant: 'primary',
    size: 'default',
    loading: false,
    disabled: false,
    'aria-label': 'Action',
    icon: <IconChevronDown />,
  },
};

export default meta;
type Story = StoryObj<typeof IconButton>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: { variant: 'secondary' },
};

export const Outline: Story = {
  args: { variant: 'outline' },
};

export const Ghost: Story = {
  args: { variant: 'ghost' },
};

export const Danger: Story = {
  args: { variant: 'danger' },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <IconButton size="small" aria-label="Small" icon={<IconChevronDown />} />
      <IconButton size="default" aria-label="Default" icon={<IconChevronDown />} />
      <IconButton size="large" aria-label="Large" icon={<IconChevronDown />} />
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <IconButton loading aria-label="Loading" icon={<IconChevronDown />} />
      <IconButton variant="secondary" loading aria-label="Loading" icon={<IconChevronDown />} />
      <IconButton variant="outline" loading aria-label="Loading" icon={<IconChevronDown />} />
      <IconButton variant="ghost" loading aria-label="Loading" icon={<IconChevronDown />} />
      <IconButton variant="danger" loading aria-label="Loading" icon={<IconChevronDown />} />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <IconButton disabled aria-label="Disabled" icon={<IconChevronDown />} />
      <IconButton variant="secondary" disabled aria-label="Disabled" icon={<IconChevronDown />} />
      <IconButton variant="outline" disabled aria-label="Disabled" icon={<IconChevronDown />} />
      <IconButton variant="ghost" disabled aria-label="Disabled" icon={<IconChevronDown />} />
      <IconButton variant="danger" disabled aria-label="Disabled" icon={<IconChevronDown />} />
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {(['small', 'default', 'large'] as const).map((size) => (
        <div key={size} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {(['primary', 'secondary', 'outline', 'ghost', 'danger'] as const).map((variant) => (
            <IconButton
              key={variant}
              variant={variant}
              size={size}
              aria-label={variant}
              icon={<IconChevronDown />}
            />
          ))}
        </div>
      ))}
    </div>
  ),
};
