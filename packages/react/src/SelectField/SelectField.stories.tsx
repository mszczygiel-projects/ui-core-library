import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SelectField } from './SelectField.js';

const FRUIT_OPTIONS = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'durian', label: 'Durian', disabled: true },
  { value: 'elderberry', label: 'Elderberry' },
];

const meta: Meta<typeof SelectField> = {
  title: 'React/SelectField',
  component: SelectField,
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
    label: { control: 'text' },
    hint: { control: 'text' },
    placeholder: { control: 'text' },
    clearable: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    variant: 'outline',
    size: 'default',
    state: 'default',
    label: 'Label',
    placeholder: 'Select option...',
    options: FRUIT_OPTIONS,
    clearable: false,
  },
};

export default meta;
type Story = StoryObj<typeof SelectField>;

export const Default: Story = {};

export const WithValue: Story = {
  args: { value: 'banana' },
};

export const WithHint: Story = {
  args: { hint: 'Choose your favourite fruit.' },
};

export const Clearable: Story = {
  args: { value: 'apple', clearable: true },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 320 }}>
      <SelectField size="small" label="Small" options={FRUIT_OPTIONS} />
      <SelectField size="default" label="Default" options={FRUIT_OPTIONS} />
      <SelectField size="large" label="Large" options={FRUIT_OPTIONS} />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 320 }}>
      <SelectField state="default" label="Default" options={FRUIT_OPTIONS} />
      <SelectField
        state="success"
        label="Success"
        hint="Great choice!"
        value="apple"
        options={FRUIT_OPTIONS}
      />
      <SelectField
        state="error"
        label="Error"
        hint="Please select an option."
        options={FRUIT_OPTIONS}
      />
      <SelectField state="disabled" label="Disabled" options={FRUIT_OPTIONS} />
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 320 }}>
      <SelectField variant="outline" label="Outline" options={FRUIT_OPTIONS} />
      <SelectField variant="filled" label="Filled" options={FRUIT_OPTIONS} />
      <SelectField variant="underlined" label="Underlined" options={FRUIT_OPTIONS} />
    </div>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 320 }}>
        <SelectField
          label="Fruit"
          value={value}
          options={FRUIT_OPTIONS}
          clearable
          onChange={setValue}
        />
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
          Value: <code>{JSON.stringify(value)}</code>
        </p>
      </div>
    );
  },
};

export const AllVariantsAndSizes: Story = {
  render: () => (
    <div
      style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', maxWidth: 800 }}
    >
      {(['outline', 'filled', 'underlined'] as const).map((variant) =>
        (['small', 'default', 'large'] as const).map((size) => (
          <SelectField
            key={`${variant}-${size}`}
            variant={variant}
            size={size}
            label={`${variant} / ${size}`}
            options={FRUIT_OPTIONS}
          />
        )),
      )}
    </div>
  ),
};
