import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SearchField } from './SearchField.js';

const meta: Meta<typeof SearchField> = {
  title: 'React/SearchField',
  component: SearchField,
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
type Story = StoryObj<typeof SearchField>;

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
      <SearchField size="small" placeholder="Search..." />
      <SearchField size="default" placeholder="Search..." />
      <SearchField size="large" placeholder="Search..." />
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: 480 }}>
      <SearchField size="small" placeholder="Search..." />
      <SearchField size="small" value="Szczygieł Tartt" />
      <SearchField size="default" placeholder="Search..." />
      <SearchField size="default" value="Szczygieł Tartt" />
      <SearchField size="large" placeholder="Search..." />
      <SearchField size="large" value="Szczygieł Tartt" />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 320 }}>
      <SearchField state="default" placeholder="Default state" />
      <SearchField state="success" placeholder="Success state" hint="Results found." />
      <SearchField state="error" placeholder="Error state" hint="No results found." />
      <SearchField state="disabled" placeholder="Disabled state" />
    </div>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 320 }}>
        <SearchField
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
