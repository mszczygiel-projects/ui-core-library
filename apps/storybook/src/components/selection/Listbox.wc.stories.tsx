import '@mszczygiel-projects/ui-core-web-components/listbox';

import type { ChoiceState } from '@mszczygiel-projects/ui-core-shared/checkbox-field';
import {
  listbox,
  type ListboxItems,
  type ListboxSize,
} from '@mszczygiel-projects/ui-core-shared/listbox';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { onSurfaces } from '../decorators.tsx';
import { htmlOf } from '../html.ts';

interface ListboxArgs {
  readonly label: string;
  readonly hint?: string;
  readonly size: ListboxSize;
  readonly state: ChoiceState;
  readonly multiple: boolean;
  readonly disabled: boolean;
  readonly required: boolean;
  readonly name?: string;
  readonly value?: string | readonly string[];
  readonly options: ListboxItems;
}

const { options } = listbox;

const TOPPINGS: ListboxItems = [
  { value: 'cheese', label: 'Extra cheese' },
  { value: 'mushrooms', label: 'Mushrooms' },
  { value: 'olives', label: 'Olives', disabled: true },
  { value: 'peppers', label: 'Peppers' },
  { value: 'onions', label: 'Red onions' },
];

const GROUPS: ListboxItems = [
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

function UiListbox(args: ListboxArgs) {
  return (
    <ui-listbox
      label={args.label}
      hint={args.hint === '' ? undefined : args.hint}
      size={args.size}
      state={args.state}
      multiple={args.multiple}
      disabled={args.disabled}
      required={args.required}
      name={args.name === '' ? undefined : args.name}
      options={args.options}
      value={args.value}
    />
  );
}

/** The HTML of the component and the script that gives it its options, for the code panel. */
const source = (args: ListboxArgs) =>
  `${htmlOf('ui-listbox', {
    label: args.label,
    hint: args.hint,
    size: args.size === options.size.default ? undefined : args.size,
    state: args.state === options.state.default ? undefined : args.state,
    multiple: args.multiple,
    disabled: args.disabled,
    required: args.required,
    name: args.name,
    value: typeof args.value === 'string' ? args.value : undefined,
  })}
<script>
  document.querySelector('ui-listbox').options = ${JSON.stringify(args.options, null, 2).replaceAll('\n', '\n  ')};
</script>`;

const meta = {
  title: 'Components/Selection/Listbox/Web Component',
  tags: ['!manifest'],
  args: {
    label: 'Topping',
    options: TOPPINGS,
    size: options.size.default,
    state: options.state.default,
    multiple: false,
    disabled: false,
    required: false,
    value: 'mushrooms',
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
    options: { control: false },
  },
  render: (args) => <UiListbox {...args} />,
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: ListboxArgs }) => source(args),
      },
    },
  },
} satisfies Meta<ListboxArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Multiple: Story = {
  args: { label: 'Toppings', multiple: true, value: ['cheese', 'peppers'], hint: 'Choose any' },
};

export const Groups: Story = {
  args: { label: 'Produce', options: GROUPS, value: 'carrot' },
};

export const OnSurfaces: Story = {
  decorators: [onSurfaces],
  render: (args) => (
    <div className="sb-stack">
      <UiListbox {...args} />
      <UiListbox {...args} label="Disabled" disabled />
    </div>
  ),
};
