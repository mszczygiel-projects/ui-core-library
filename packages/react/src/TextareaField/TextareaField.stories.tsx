import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentProps } from 'react';
import { TextareaField } from './TextareaField.js';

type TextareaFieldStoryArgs = ComponentProps<typeof TextareaField>;

const meta: Meta<TextareaFieldStoryArgs> = {
  title: 'React/TextareaField',
  component: TextareaField,
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
    resize: {
      control: 'select',
      options: ['none', 'vertical', 'auto'],
    },
    label: { control: 'text' },
    placeholder: { control: 'text' },
    hint: { control: 'text' },
  },
  args: {
    variant: 'outline',
    size: 'default',
    labelPlacement: 'top',
    state: 'default',
    resize: 'vertical',
    label: 'Message',
    placeholder: 'Tell us what happened',
    hint: 'Max 500 characters',
  },
};

export default meta;
type Story = StoryObj<TextareaFieldStoryArgs>;

export const Outline: Story = {};

export const Filled: Story = {
  args: { variant: 'filled' },
};

export const Underlined: Story = {
  args: { variant: 'underlined' },
};

export const InnerLabel: Story = {
  args: { labelPlacement: 'inner' },
};

export const FloatingLabel: Story = {
  args: { labelPlacement: 'floating' },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '28rem' }}>
      <TextareaField {...args} size="small" label="Small" />
      <TextareaField {...args} size="default" label="Default" />
      <TextareaField {...args} size="large" label="Large" />
    </div>
  ),
};

export const ResizeModes: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '28rem' }}>
      <TextareaField
        {...args}
        resize="none"
        label='resize="none"'
        hint="Fixed height — no drag handle."
      />
      <TextareaField
        {...args}
        resize="vertical"
        label='resize="vertical"'
        hint="Drag the handle in the bottom-right corner."
      />
      <TextareaField
        {...args}
        resize="auto"
        label='resize="auto"'
        hint="Grows as you type — no maximum height."
      />
    </div>
  ),
};

export const States: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '28rem' }}>
      <TextareaField {...args} state="default" label="Default" />
      <TextareaField {...args} state="success" label="Success" hint="Looks good." />
      <TextareaField {...args} state="error" label="Error" hint="This field is required." />
      <TextareaField {...args} state="disabled" label="Disabled" />
    </div>
  ),
};

export const OnSurfaces: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {(['default', 'subtle', 'inverse', 'primary'] as const).map((surface) => (
        <div
          key={surface}
          data-surface={surface === 'default' ? undefined : surface}
          style={{ padding: '1.5rem', backgroundColor: 'var(--color-background-default)' }}
        >
          <TextareaField {...args} label={surface} />
        </div>
      ))}
    </div>
  ),
};
