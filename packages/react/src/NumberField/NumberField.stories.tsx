import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { NumberField } from './NumberField.js';

const meta: Meta<typeof NumberField> = {
  title: 'React/NumberField',
  component: NumberField,
  argTypes: {
    variant: { control: 'select', options: ['outline', 'filled', 'underlined'] },
    size: { control: 'select', options: ['small', 'default', 'large'] },
    controls: { control: 'select', options: ['none', 'inline'] },
    state: { control: 'select', options: ['default', 'success', 'error', 'disabled'] },
    labelPlacement: { control: 'select', options: ['top', 'floating', 'inner'] },
    label: { control: 'text' },
    hint: { control: 'text' },
    placeholder: { control: 'text' },
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    precision: { control: 'number' },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
  },
  args: {
    variant: 'outline',
    size: 'default',
    controls: 'none',
    state: 'default',
    labelPlacement: 'top',
    label: 'Quantity',
    hint: 'Between 1 and 99',
    min: 1,
    max: 99,
    step: 1,
    precision: 0,
  },
};

export default meta;
type Story = StoryObj<typeof NumberField>;

export const Default: Story = {};

export const InlineControls: Story = {
  args: { controls: 'inline', defaultValue: 12 },
};

/** No label and no hint — the component renders as a bare input with no chrome. */
export const Bare: Story = {
  args: { controls: 'inline', label: undefined, hint: undefined, defaultValue: 1 },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 16, justifyItems: 'start' }}>
      {(['small', 'default', 'large'] as const).map((size) => (
        <NumberField key={size} {...args} size={size} label={size} />
      ))}
    </div>
  ),
  args: { controls: 'inline', defaultValue: 12 },
};

export const Variants: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 16, justifyItems: 'start' }}>
      {(['outline', 'filled', 'underlined'] as const).map((variant) => (
        <NumberField key={variant} {...args} variant={variant} label={variant} />
      ))}
    </div>
  ),
  args: { controls: 'inline', defaultValue: 12 },
};

export const States: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 16, justifyItems: 'start' }}>
      {(['default', 'success', 'error', 'disabled'] as const).map((state) => (
        <NumberField key={state} {...args} state={state} label={state} />
      ))}
    </div>
  ),
  args: { controls: 'inline', defaultValue: 12 },
};

/** `precision` allows decimals; typing "1." mid-edit is not fought, only rounded on commit. */
export const Decimals: Story = {
  args: {
    controls: 'inline',
    precision: 2,
    step: 0.1,
    min: 0,
    max: 10,
    defaultValue: 2.5,
    label: 'Weight (kg)',
    hint: 'Two decimal places',
  },
};

function Controlled(args: React.ComponentProps<typeof NumberField>) {
  const [value, setValue] = useState<number | null>(12);
  return <NumberField {...args} value={value} onValueChange={setValue} />;
}

export const ControlledValue: Story = {
  render: (args) => <Controlled {...args} />,
  args: { controls: 'inline' },
};

export const OnSurfaces: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 16 }}>
      {([undefined, 'subtle', 'inverse', 'primary'] as const).map((surface) => (
        <div
          key={surface ?? 'default'}
          data-surface={surface}
          style={{ padding: 16, backgroundColor: 'var(--color-background-default)' }}
        >
          <NumberField {...args} />
        </div>
      ))}
    </div>
  ),
  args: { controls: 'inline', defaultValue: 12 },
};
