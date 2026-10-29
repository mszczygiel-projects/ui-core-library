import '@mszczygiel-projects/ui-core-web-components/select-field';

import type { ListboxItems } from '@mszczygiel-projects/ui-core-shared/listbox';
import { selectField } from '@mszczygiel-projects/ui-core-shared/select-field';
import type {
  TextFieldLabelPlacement,
  TextFieldSize,
  TextFieldState,
  TextFieldVariant,
} from '@mszczygiel-projects/ui-core-shared/text-field';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { onSurfaces } from '../decorators.tsx';
import { htmlOf } from '../html.ts';

interface SelectFieldArgs {
  readonly label: string;
  readonly hint?: string;
  readonly placeholder?: string;
  readonly variant: TextFieldVariant;
  readonly size: TextFieldSize;
  readonly labelPlacement: TextFieldLabelPlacement;
  readonly state: TextFieldState;
  readonly disabled: boolean;
  readonly required: boolean;
  readonly clearable: boolean;
  readonly name?: string;
  readonly value?: string;
  readonly options: ListboxItems;
}

const { options } = selectField;

const COUNTRIES: ListboxItems = [
  { value: 'cz', label: 'Czechia' },
  { value: 'de', label: 'Germany' },
  { value: 'lt', label: 'Lithuania', disabled: true },
  { value: 'pl', label: 'Poland' },
  { value: 'sk', label: 'Slovakia' },
];

const GROUPS: ListboxItems = [
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

function UiSelectField(args: SelectFieldArgs) {
  return (
    <ui-select-field
      label={args.label}
      hint={args.hint === '' ? undefined : args.hint}
      placeholder={args.placeholder === '' ? undefined : args.placeholder}
      variant={args.variant}
      size={args.size}
      labelPlacement={args.labelPlacement}
      state={args.state}
      disabled={args.disabled}
      required={args.required}
      clearable={args.clearable}
      name={args.name === '' ? undefined : args.name}
      value={args.value}
      options={args.options}
    />
  );
}

/** The HTML of the component and the script that gives it its options, for the code panel. */
const source = (args: SelectFieldArgs) =>
  `${htmlOf('ui-select-field', {
    label: args.label,
    hint: args.hint,
    placeholder: args.placeholder,
    variant: args.variant === options.variant.default ? undefined : args.variant,
    size: args.size === options.size.default ? undefined : args.size,
    'label-placement':
      args.labelPlacement === options.labelPlacement.default ? undefined : args.labelPlacement,
    state: args.state === options.state.default ? undefined : args.state,
    disabled: args.disabled,
    required: args.required,
    clearable: args.clearable,
    name: args.name,
    value: args.value,
  })}
<script>
  document.querySelector('ui-select-field').options = ${JSON.stringify(args.options, null, 2).replaceAll('\n', '\n  ')};
</script>`;

const meta = {
  title: 'Components/Selection/SelectField/Web Component',
  tags: ['!manifest'],
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
  render: (args) => <UiSelectField {...args} />,
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: SelectFieldArgs }) => source(args),
      },
    },
  },
} satisfies Meta<SelectFieldArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  args: { value: 'pl' },
  render: (args) => (
    <div className="sb-row">
      {options.variant.options.map((variant) => (
        <UiSelectField key={variant} {...args} variant={variant} />
      ))}
    </div>
  ),
};

export const Groups: Story = {
  args: { label: 'Destination', options: GROUPS, value: 'jp', clearable: true },
};

export const OnSurfaces: Story = { decorators: [onSurfaces], ...Variants };
