import { Listbox } from '@mszczygiel-projects/ui-core-react';
import { listbox } from '@mszczygiel-projects/ui-core-shared/listbox';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { onSurfaces } from '../decorators.tsx';

const { options } = listbox;

const TOPPINGS = [
  { value: 'cheese', label: 'Extra cheese' },
  { value: 'mushrooms', label: 'Mushrooms' },
  { value: 'olives', label: 'Olives', disabled: true },
  { value: 'peppers', label: 'Peppers' },
  { value: 'onions', label: 'Red onions' },
];

const GROUPS = [
  {
    label: 'Fruit',
    options: [
      { value: 'apple', label: 'Apple' },
      { value: 'pear', label: 'Pear' },
    ],
  },
  {
    label: 'Vegetables',
    options: [
      { value: 'carrot', label: 'Carrot' },
      { value: 'leek', label: 'Leek' },
    ],
  },
  { options: [{ value: 'none', label: 'None of these' }] },
];

const meta = {
  title: 'Components/Selection/Listbox/React',
  component: Listbox,
  args: {
    label: 'Topping',
    options: TOPPINGS,
    size: options.size.default,
    state: options.state.default,
    multiple: false,
    disabled: false,
    required: false,
    defaultValue: 'mushrooms',
  },
  argTypes: {
    label: { control: 'text' },
    hint: { control: 'text' },
    size: { control: 'inline-radio', options: options.size.options },
    state: { control: 'inline-radio', options: options.state.options },
    multiple: { control: 'boolean' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    name: { control: 'text' },
    emptyLabel: { control: 'text' },
    options: { control: false },
  },
} satisfies Meta<typeof Listbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Multiple: Story = {
  args: {
    label: 'Toppings',
    multiple: true,
    defaultValue: ['cheese', 'peppers'],
    hint: 'Choose any',
  },
};

export const Groups: Story = {
  args: { label: 'Produce', options: GROUPS, defaultValue: 'carrot' },
};

export const OnSurfaces: Story = {
  decorators: [onSurfaces],
  render: (args) => (
    <div className="sb-stack">
      <Listbox {...args} />
      <Listbox {...args} label="Disabled" disabled />
    </div>
  ),
};
