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
      options: ['top', 'inner', 'inline'],
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

const GROUPED_OPTIONS = [
  { label: 'Citrus', options: [{ value: 'lemon', label: 'Lemon' }] },
  {
    label: 'Berries',
    options: [
      { value: 'strawberry', label: 'Strawberry' },
      { value: 'raspberry', label: 'Raspberry' },
      { value: 'blueberry', label: 'Blueberry' },
    ],
  },
  {
    label: 'Stone fruit',
    options: [
      { value: 'peach', label: 'Peach' },
      { value: 'plum', label: 'Plum' },
    ],
  },
];

/** Compact filter-bar row: label and value share one line. */
export const InlineLabel: StoryObj<SelectFieldStoryArgs> = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      {(['outline', 'filled', 'underlined'] as const).map((variant) => (
        <SelectField
          key={variant}
          variant={variant}
          labelPlacement="inline"
          label="Season"
          defaultValue="apple"
          options={FRUIT_OPTIONS}
        />
      ))}
    </div>
  ),
};

/** Group headers stick to the top of the panel while their group scrolls. */
export const GroupedOptions: StoryObj<SelectFieldStoryArgs> = {
  args: { label: 'Fruit', options: GROUPED_OPTIONS },
  render: renderSelectField,
};

/** A value set up front renders instead of the placeholder. */
export const WithDefaultValue: StoryObj<SelectFieldStoryArgs> = {
  args: { label: 'Fruit', defaultValue: 'banana', options: FRUIT_OPTIONS },
  render: renderSelectField,
};

/** The panel flips above the field when there is no room below. */
export const PlacementTop: StoryObj<SelectFieldStoryArgs> = {
  args: { label: 'Fruit', placement: 'top-start', options: FRUIT_OPTIONS },
  render: renderSelectField,
};

export const OnSurfaces: StoryObj<SelectFieldStoryArgs> = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {(['default', 'subtle', 'inverse', 'primary'] as const).map((surface) => (
        <div
          key={surface}
          data-surface={surface === 'default' ? undefined : surface}
          style={{ backgroundColor: 'var(--color-background-default)', padding: 16 }}
        >
          <SelectField label="Fruit" defaultValue="apple" options={FRUIT_OPTIONS} />
        </div>
      ))}
    </div>
  ),
};
