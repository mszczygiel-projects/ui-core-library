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
    labelPlacement: {
      control: 'select',
      options: ['top', 'floating', 'inner'],
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
    label: 'Search',
    placeholder: 'Search...',
  },
};

export default meta;
type Story = StoryObj<typeof SearchField>;

export const Outline: Story = {};

export const Filled: Story = {
  args: { variant: 'filled' },
};

export const Underlined: Story = {
  args: { variant: 'underlined' },
};

export const OutlineInnerLabel: Story = {
  args: { labelPlacement: 'inner' },
};

export const FilledInnerLabel: Story = {
  args: { variant: 'filled', labelPlacement: 'inner' },
};

export const UnderlinedInnerLabel: Story = {
  args: { variant: 'underlined', labelPlacement: 'inner' },
};

export const OutlineFloatingLabel: Story = {
  args: { labelPlacement: 'floating', placeholder: '' },
};

export const FilledFloatingLabel: Story = {
  args: { variant: 'filled', labelPlacement: 'floating', placeholder: '' },
};

export const UnderlinedFloatingLabel: Story = {
  args: { variant: 'underlined', labelPlacement: 'floating', placeholder: '' },
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
