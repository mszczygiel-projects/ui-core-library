import { SelectField } from '@mszczygiel-projects/ui-core-react';
import { selectField } from '@mszczygiel-projects/ui-core-shared/select-field';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { onSurfaces } from '../decorators.tsx';

const { options } = selectField;

const COUNTRIES = [
  { value: 'cz', label: 'Czechia' },
  { value: 'de', label: 'Germany' },
  { value: 'lt', label: 'Lithuania', disabled: true },
  { value: 'pl', label: 'Poland' },
  { value: 'sk', label: 'Slovakia' },
];

const GROUPS = [
  {
    label: 'Europe',
    options: [
      { value: 'pl', label: 'Poland' },
      { value: 'pt', label: 'Portugal' },
    ],
  },
  {
    label: 'Asia',
    options: [
      { value: 'jp', label: 'Japan' },
      { value: 'kr', label: 'South Korea' },
    ],
  },
];

const meta = {
  title: 'Components/Selection/SelectField/React',
  component: SelectField,
  args: {
    label: 'Country',
    hint: 'Where the parcel goes',
    placeholder: 'Choose a country',
    options: COUNTRIES,
    variant: options.variant.default,
    size: options.size.default,
    labelPlacement: options.labelPlacement.default,
    state: options.state.default,
    disabled: false,
    required: false,
    clearable: false,
  },
  argTypes: {
    label: { control: 'text' },
    hint: { control: 'text' },
    placeholder: { control: 'text' },
    variant: { control: 'inline-radio', options: options.variant.options },
    size: { control: 'inline-radio', options: options.size.options },
    labelPlacement: { control: 'inline-radio', options: options.labelPlacement.options },
    state: { control: 'inline-radio', options: options.state.options },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    clearable: { control: 'boolean' },
    name: { control: 'text' },
    options: { control: false },
  },
} satisfies Meta<typeof SelectField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  args: { defaultValue: 'pl' },
  render: (args) => (
    <div className="sb-row">
      {options.variant.options.map((variant) => (
        <SelectField key={variant} {...args} variant={variant} />
      ))}
    </div>
  ),
};

export const Groups: Story = {
  args: { label: 'Destination', options: GROUPS, defaultValue: 'jp', clearable: true },
};

export const OnSurfaces: Story = { decorators: [onSurfaces], ...Variants };
