import '@mszczygiel-projects/ui-core-web-components/search-field';

import { searchField } from '@mszczygiel-projects/ui-core-shared/search-field';
import type {
  TextFieldLabelPlacement,
  TextFieldSize,
  TextFieldState,
  TextFieldVariant,
} from '@mszczygiel-projects/ui-core-shared/text-field';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { onSurfaces } from '../decorators.tsx';
import { htmlOf } from '../html.ts';

interface SearchFieldArgs {
  readonly variant: TextFieldVariant;
  readonly size: TextFieldSize;
  readonly labelPlacement: TextFieldLabelPlacement;
  readonly state: TextFieldState;
  readonly label?: string;
  readonly hint?: string;
  readonly placeholder?: string;
  readonly value?: string;
  readonly name?: string;
  readonly required: boolean;
  readonly disabled: boolean;
  readonly readOnly: boolean;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly autoComplete?: string;
  readonly pattern?: string;
  readonly clearLabel?: string;
}

const { options } = searchField;

function UiSearchField(args: SearchFieldArgs) {
  return (
    <ui-search-field
      value={args.value}
      variant={args.variant}
      size={args.size}
      labelPlacement={args.labelPlacement}
      state={args.state}
      label={args.label}
      hint={args.hint}
      placeholder={args.placeholder}
      name={args.name}
      required={args.required}
      disabled={args.disabled}
      readOnly={args.readOnly}
      minLength={args.minLength}
      maxLength={args.maxLength}
      autoComplete={args.autoComplete}
      pattern={args.pattern}
      clearLabel={args.clearLabel}
    />
  );
}

const source = (args: SearchFieldArgs) =>
  htmlOf('ui-search-field', {
    variant: args.variant === options.variant.default ? undefined : args.variant,
    size: args.size === options.size.default ? undefined : args.size,
    'label-placement':
      args.labelPlacement === options.labelPlacement.default ? undefined : args.labelPlacement,
    state: args.state === options.state.default ? undefined : args.state,
    label: args.label,
    hint: args.hint,
    placeholder: args.placeholder,
    value: args.value,
    name: args.name,
    'min-length': args.minLength,
    'max-length': args.maxLength,
    'auto-complete': args.autoComplete,
    pattern: args.pattern,
    'clear-label': args.clearLabel,
    disabled: args.disabled,
    readonly: args.readOnly,
    required: args.required,
  });

const meta = {
  title: 'Components/Inputs/SearchField/Web Component',
  tags: ['!manifest'],
  args: {
    label: 'Search products',
    value: 'Running shoes',
    variant: options.variant.default,
    size: options.size.default,
    labelPlacement: options.labelPlacement.default,
    state: options.state.default,
    disabled: false,
    readOnly: false,
    required: false,
  },
  argTypes: {
    label: { control: 'text' },
    hint: { control: 'text' },
    placeholder: { control: 'text' },
    variant: { control: 'select', options: options.variant.options },
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
    value: { control: 'text' },
    pattern: { control: 'text' },
    clearLabel: { control: 'text' },
  },
  render: (args) => <UiSearchField {...args} />,
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: SearchFieldArgs }) => source(args),
      },
    },
  },
} satisfies Meta<SearchFieldArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="sb-row">
      {options.variant.options.map((variant) => (
        <UiSearchField key={variant} {...args} variant={variant} />
      ))}
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: options.variant.options
          .map((variant) => source({ ...meta.args, variant }))
          .join('\n'),
      },
    },
  },
};

/** A search form inside the search landmark, which the page supplies, not the field. */
export const InForm: Story = {
  args: { name: 'q', label: 'Search products' },
  render: (args) => (
    <search>
      <form
        action=""
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <UiSearchField {...args} />
      </form>
    </search>
  ),
};

export const OnSurfaces: Story = { decorators: [onSurfaces], ...Variants };
