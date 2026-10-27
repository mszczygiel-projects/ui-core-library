import { SearchField } from '@mszczygiel-projects/ui-core-react';
import { searchField } from '@mszczygiel-projects/ui-core-shared/search-field';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { onSurfaces } from '../decorators.tsx';

const { options } = searchField;
const variants = options.variant.options;

const meta = {
  title: 'Components/Inputs/SearchField/React',
  component: SearchField,
  args: {
    label: 'Search products',
    defaultValue: 'Running shoes',
    variant: 'outline',
    size: 'medium',
    labelPlacement: 'top',
    state: 'default',
    disabled: false,
    readOnly: false,
    required: false,
  },
  argTypes: {
    label: { control: 'text' },
    hint: { control: 'text' },
    placeholder: { control: 'text' },
    variant: { control: 'select', options: variants },
    size: { control: 'inline-radio', options: options.size.options },
    labelPlacement: { control: 'inline-radio', options: options.labelPlacement.options },
    state: { control: 'inline-radio', options: options.state.options },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    required: { control: 'boolean' },
    name: { control: 'text' },
    minLength: { control: 'number' },
    maxLength: { control: 'number' },
    autoComplete: { control: 'text' },
    defaultValue: { control: 'text' },
    value: { control: false },
    onValueChange: { control: false },
    pattern: { control: 'text' },
    clearLabel: { control: 'text' },
    onClear: { control: false },
  },
} satisfies Meta<typeof SearchField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="sb-row">
      {variants.map((variant) => (
        <SearchField key={variant} {...args} variant={variant} />
      ))}
    </div>
  ),
};

/** A search form inside the search landmark, which the page supplies, not the field. */
export const InForm: Story = {
  args: { name: 'q', 'aria-label': 'Search products', label: undefined },
  render: (args) => (
    <search>
      <form
        action=""
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <SearchField {...args} />
      </form>
    </search>
  ),
};

export const OnSurfaces: Story = { decorators: [onSurfaces], ...Variants };
