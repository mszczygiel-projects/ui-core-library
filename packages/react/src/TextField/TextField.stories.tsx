import type { Meta, StoryObj } from '@storybook/react';
import { IconSearch } from '@mszczygiel-projects/icons/react';
import { IconDanger } from '@mszczygiel-projects/icons/react';
import { TextField } from './TextField.js';

const meta: Meta<typeof TextField> = {
  title: 'React/TextField',
  component: TextField,
  argTypes: {
    variant: {
      control: 'select',
      options: ['outline', 'filled', 'underlined'],
    },
    size: {
      control: 'select',
      options: ['small', 'default', 'large'],
    },
    labelPlacement: {
      control: 'select',
      options: ['top', 'floating'],
    },
    state: {
      control: 'select',
      options: ['default', 'success', 'error', 'disabled'],
    },
    label: { control: 'text' },
    placeholder: { control: 'text' },
    hint: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  args: {
    variant: 'outline',
    size: 'default',
    labelPlacement: 'top',
    state: 'default',
    label: 'Email address',
    placeholder: 'you@example.com',
  },
};

export default meta;
type Story = StoryObj<typeof TextField>;

export const Outline: Story = {};

export const Filled: Story = {
  args: { variant: 'filled' },
};

export const Underlined: Story = {
  args: { variant: 'underlined', labelPlacement: 'floating' },
};

export const FloatingLabel: Story = {
  args: { labelPlacement: 'floating', label: 'Email address', placeholder: '' },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 320 }}>
      <TextField size="small" label="Small" placeholder="Small input" />
      <TextField size="default" label="Default" placeholder="Default input" />
      <TextField size="large" label="Large" placeholder="Large input" />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 320 }}>
      <TextField state="default" label="Default" placeholder="Default state" />
      <TextField state="success" label="Success" placeholder="Success state" hint="Looks good!" />
      <TextField
        state="error"
        label="Error"
        placeholder="Error state"
        hint="This field is required."
      />
      <TextField state="disabled" label="Disabled" placeholder="Disabled state" />
    </div>
  ),
};

export const WithHint: Story = {
  args: { hint: 'We will never share your email.' },
};

export const WithLeadingIcon: Story = {
  args: { label: 'Search', placeholder: 'Search…', leadingIcon: <IconSearch /> },
};

export const WithTrailingIcon: Story = {
  args: {
    state: 'error',
    label: 'Email',
    placeholder: 'you@example.com',
    hint: 'Invalid email.',
    trailingIcon: <IconDanger />,
  },
};
