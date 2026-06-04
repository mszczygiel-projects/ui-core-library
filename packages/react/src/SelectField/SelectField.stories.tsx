import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentProps } from 'react';
import { svgMap } from '@mszczygiel-projects/ui-core-icons';
import * as Icons from '@mszczygiel-projects/ui-core-icons/react';
import { SelectField } from './SelectField.js';

type IconName = keyof typeof svgMap;

const iconOptions = Object.keys(svgMap) as IconName[];

const FRUIT_OPTIONS = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'durian', label: 'Durian', disabled: true },
  { value: 'elderberry', label: 'Elderberry' },
];

type SelectFieldStoryArgs = Omit<ComponentProps<typeof SelectField>, 'leadingIcon'> & {
  leadingIcon?: IconName | '';
};

const toIconExportName = (name: IconName) =>
  name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

const renderIcon = (name?: IconName | '') => {
  if (!name) {
    return undefined;
  }

  const IconComponent = Icons[toIconExportName(name) as keyof typeof Icons];

  return IconComponent ? <IconComponent /> : undefined;
};

const renderSelectField = ({ leadingIcon, ...args }: SelectFieldStoryArgs) => (
  <SelectField {...args} leadingIcon={renderIcon(leadingIcon)} />
);

const meta: Meta<SelectFieldStoryArgs> = {
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
    labelPlacement: {
      control: 'select',
      options: ['top', 'inner'],
    },
    state: {
      control: 'select',
      options: ['default', 'success', 'error', 'disabled'],
    },
    label: { control: 'text' },
    placeholder: { control: 'text' },
    hint: { control: 'text' },
    clearable: { control: 'boolean' },
    disabled: { control: 'boolean' },
    leadingIcon: {
      control: 'select',
      options: ['', ...iconOptions],
    },
  },
  args: {
    variant: 'outline',
    size: 'default',
    labelPlacement: 'top',
    state: 'default',
    label: 'Fruit',
    placeholder: 'Select option...',
    options: FRUIT_OPTIONS,
    clearable: false,
    leadingIcon: '',
  },
};

export default meta;
type Story = StoryObj<SelectFieldStoryArgs>;

export const Outline: Story = {
  args: {},
  render: renderSelectField,
};

export const Filled: Story = {
  args: { variant: 'filled' },
  render: renderSelectField,
};

export const Underlined: Story = {
  args: { variant: 'underlined' },
  render: renderSelectField,
};

export const OutlineInnerLabel: Story = {
  args: { labelPlacement: 'inner' },
  render: renderSelectField,
};

export const FilledInnerLabel: Story = {
  args: { variant: 'filled', labelPlacement: 'inner' },
  render: renderSelectField,
};

export const UnderlinedInnerLabel: Story = {
  args: { variant: 'underlined', labelPlacement: 'inner' },
  render: renderSelectField,
};

export const Clearable: Story = {
  args: { value: 'apple', clearable: true },
  render: renderSelectField,
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
