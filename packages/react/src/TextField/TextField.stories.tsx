import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentProps } from 'react';
import { svgMap } from '@mszczygiel-projects/ui-core-icons';
import * as Icons from '@mszczygiel-projects/ui-core-icons/react';
import { TextField } from './TextField.js';

type IconName = keyof typeof svgMap;

const iconOptions = Object.keys(svgMap) as IconName[];

type TextFieldStoryArgs = Omit<ComponentProps<typeof TextField>, 'leadingIcon' | 'trailingIcon'> & {
  leadingIcon?: IconName | '';
  trailingIcon?: IconName | '';
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

const renderTextField = ({ leadingIcon, trailingIcon, ...args }: TextFieldStoryArgs) => (
  <TextField
    {...args}
    leadingIcon={renderIcon(leadingIcon)}
    trailingIcon={renderIcon(trailingIcon)}
  />
);

const meta: Meta<TextFieldStoryArgs> = {
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
    leadingIcon: {
      control: 'select',
      options: ['', ...iconOptions],
    },
    trailingIcon: {
      control: 'select',
      options: ['', ...iconOptions],
    },
  },
  args: {
    variant: 'outline',
    size: 'default',
    labelPlacement: 'top',
    state: 'default',
    label: 'Email address',
    placeholder: 'you@example.com',
    leadingIcon: '',
    trailingIcon: '',
  },
};

export default meta;
type Story = StoryObj<TextFieldStoryArgs>;

export const Outline: Story = {
  args: {},
  render: renderTextField,
};

export const Filled: Story = {
  args: { variant: 'filled' },
  render: renderTextField,
};

export const Underlined: Story = {
  args: { variant: 'underlined' },
  render: renderTextField,
};

export const OutlineInnerLabel: Story = {
  args: { labelPlacement: 'inner' },
  render: renderTextField,
};

export const FilledInnerLabel: Story = {
  args: { variant: 'filled', labelPlacement: 'inner' },
  render: renderTextField,
};

export const UnderlinedInnerLabel: Story = {
  args: { variant: 'underlined', labelPlacement: 'inner' },
  render: renderTextField,
};

export const OutlineFloatingLabel: Story = {
  args: { labelPlacement: 'floating' },
  render: renderTextField,
};

export const FilledFloatingLabel: Story = {
  args: { variant: 'filled', labelPlacement: 'floating' },
  render: renderTextField,
};

export const UnderlinedFloatingLabel: Story = {
  args: { variant: 'underlined', labelPlacement: 'floating' },
  render: renderTextField,
};
