import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SearchInput } from './SearchInput.js';

const meta: Meta<typeof SearchInput> = {
  title: 'React/SearchInput',
  component: SearchInput,
  argTypes: {
    variant: {
      control: 'select',
      options: ['outline', 'filled', 'underlined'],
    },
    size: {
      control: 'select',
      options: ['small', 'default', 'large'],
    },
    state: {
      control: 'select',
      options: ['default', 'success', 'error', 'disabled'],
    },
    placeholder: { control: 'text' },
    hint: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  args: {
    variant: 'outline',
    size: 'default',
    state: 'default',
    placeholder: 'Search...',
  },
};

export default meta;
type Story = StoryObj<typeof SearchInput>;

export const Default: Story = {};

export const WithValue: Story = {
  args: { value: 'Szczygieł Tartt' },
};

export const WithHint: Story = {
  args: { hint: 'Minimum of 8 characters.' },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 320 }}>
      <SearchInput size="small" placeholder="Search..." />
      <SearchInput size="default" placeholder="Search..." />
      <SearchInput size="large" placeholder="Search..." />
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: 480 }}>
      <SearchInput size="small" placeholder="Search..." />
      <SearchInput size="small" value="Szczygieł Tartt" />
      <SearchInput size="default" placeholder="Search..." />
      <SearchInput size="default" value="Szczygieł Tartt" />
      <SearchInput size="large" placeholder="Search..." />
      <SearchInput size="large" value="Szczygieł Tartt" />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 320 }}>
      <SearchInput state="default" placeholder="Default state" />
      <SearchInput state="success" placeholder="Success state" hint="Results found." />
      <SearchInput state="error" placeholder="Error state" hint="No results found." />
      <SearchInput state="disabled" placeholder="Disabled state" />
    </div>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 320 }}>
        <SearchInput
          value={value}
          placeholder="Search..."
          onChange={setValue}
          onClear={() => setValue('')}
        />
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
          Value: <code>{JSON.stringify(value)}</code>
        </p>
      </div>
    );
  },
};
