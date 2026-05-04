import type { Meta, StoryObj } from '@storybook/react';
import { IconSearch } from '@ui-core/icons/react';
import { IconDanger } from '@ui-core/icons/react';
import { TextInput } from './TextInput.js';

const meta: Meta<typeof TextInput> = {
  title: 'React/TextInput',
  component: TextInput,
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
type Story = StoryObj<typeof TextInput>;

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
      <TextInput size="small" label="Small" placeholder="Small input" />
      <TextInput size="default" label="Default" placeholder="Default input" />
      <TextInput size="large" label="Large" placeholder="Large input" />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 320 }}>
      <TextInput state="default" label="Default" placeholder="Default state" />
      <TextInput state="success" label="Success" placeholder="Success state" hint="Looks good!" />
      <TextInput
        state="error"
        label="Error"
        placeholder="Error state"
        hint="This field is required."
        trailingIcon={<IconDanger />}
      />
      <TextInput state="disabled" label="Disabled" placeholder="Disabled state" />
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

export const AllVariants: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1.5rem',
        maxWidth: 720,
      }}
    >
      {(['small', 'default', 'large'] as const).flatMap((size) =>
        (['outline', 'filled', 'underlined'] as const).map((variant) => (
          <TextInput
            key={`${variant}-${size}`}
            variant={variant}
            size={size}
            labelPlacement={variant === 'underlined' ? 'floating' : 'top'}
            label={`${variant} / ${size}`}
            placeholder="Placeholder"
          />
        )),
      )}
    </div>
  ),
};
