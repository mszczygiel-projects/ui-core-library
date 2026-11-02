import '@mszczygiel-projects/ui-core-web-components/combobox';

import { combobox, type ComboboxFilterMode } from '@mszczygiel-projects/ui-core-shared/combobox';
import type {
  ListboxItems,
  ListboxOption,
  ListboxValue,
} from '@mszczygiel-projects/ui-core-shared/listbox';
import { filterItems } from '@mszczygiel-projects/ui-core-shared/listbox-navigation';
import type {
  TextFieldLabelPlacement,
  TextFieldSize,
  TextFieldState,
  TextFieldVariant,
} from '@mszczygiel-projects/ui-core-shared/text-field';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';

import { onSurfaces } from '../decorators.tsx';
import { htmlOf } from '../html.ts';

interface ComboboxArgs {
  readonly label: string;
  readonly hint?: string;
  readonly placeholder?: string;
  readonly variant: TextFieldVariant;
  readonly size: TextFieldSize;
  readonly labelPlacement: TextFieldLabelPlacement;
  readonly state: TextFieldState;
  readonly filterMode: ComboboxFilterMode;
  readonly disabled: boolean;
  readonly required: boolean;
  readonly multiple: boolean;
  readonly clearable: boolean;
  readonly loading: boolean;
  readonly allowCreate: boolean;
  readonly name?: string;
  readonly value?: ListboxValue;
  readonly options: ListboxItems;
}

const { options } = combobox;

const ANIMALS: readonly ListboxOption[] = [
  { value: 'badger', label: 'Badger' },
  { value: 'beaver', label: 'Beaver' },
  { value: 'bison', label: 'Bison' },
  { value: 'deer', label: 'Deer' },
  { value: 'elk', label: 'Elk', disabled: true },
  { value: 'fox', label: 'Fox' },
  { value: 'hedgehog', label: 'Hedgehog' },
  { value: 'lynx', label: 'Lynx' },
  { value: 'otter', label: 'Otter' },
  { value: 'wolf', label: 'Wolf' },
];

interface Handlers {
  readonly onQuery?: (query: string) => void;
  readonly onCreate?: (query: string) => void;
  readonly onValue?: (value: ListboxValue) => void;
}

function UiCombobox({ onQuery, onCreate, onValue, ...args }: ComboboxArgs & Handlers) {
  return (
    <ui-combobox
      label={args.label}
      hint={args.hint === '' ? undefined : args.hint}
      placeholder={args.placeholder === '' ? undefined : args.placeholder}
      variant={args.variant}
      size={args.size}
      labelPlacement={args.labelPlacement}
      state={args.state}
      filterMode={args.filterMode}
      disabled={args.disabled}
      required={args.required}
      multiple={args.multiple}
      clearable={args.clearable}
      loading={args.loading}
      allowCreate={args.allowCreate}
      name={args.name === '' ? undefined : args.name}
      value={args.value}
      options={args.options}
      onui-query-change={
        onQuery &&
        ((event) => {
          onQuery(event.detail.value);
        })
      }
      onui-create={
        onCreate &&
        ((event) => {
          onCreate(event.detail.value);
        })
      }
      onui-value-change={
        onValue &&
        ((event) => {
          onValue(event.detail.value);
        })
      }
    />
  );
}

/** A server that answers a query after a delay, and gives up when the request is aborted. */
function search(query: string, signal: AbortSignal): Promise<ListboxItems> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      resolve(filterItems(ANIMALS, query));
    }, 600);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('The query changed', 'AbortError'));
    });
  });
}

/** Waits until the user stops typing, aborts the request a newer query replaces and shows the loader. */
function RemoteCombobox(args: ComboboxArgs) {
  const [query, setQuery] = useState('');
  const [found, setFound] = useState<ListboxItems>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      search(query, controller.signal).then(
        (items) => {
          setFound(items);
          setLoading(false);
        },
        () => undefined,
      );
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);
  return (
    <UiCombobox
      {...args}
      filterMode="remote"
      options={found}
      loading={loading}
      onQuery={setQuery}
    />
  );
}

/** Adds the option a user creates and chooses it. */
function CreatingCombobox(args: ComboboxArgs) {
  const [items, setItems] = useState<readonly ListboxOption[]>(ANIMALS);
  const [value, setValue] = useState<ListboxValue>(['fox']);
  return (
    <UiCombobox
      {...args}
      multiple
      allowCreate
      options={items}
      value={value}
      onValue={setValue}
      onCreate={(query) => {
        const created: ListboxOption = { value: query.toLowerCase(), label: query };
        setItems((current) => [...current, created]);
        setValue((current) => [...(typeof current === 'string' ? [] : current), created.value]);
      }}
    />
  );
}

/** The HTML of the component and the script that gives it its options, for the code panel. */
const source = (args: ComboboxArgs) =>
  `${htmlOf('ui-combobox', {
    label: args.label,
    hint: args.hint,
    placeholder: args.placeholder,
    variant: args.variant === options.variant.default ? undefined : args.variant,
    size: args.size === options.size.default ? undefined : args.size,
    'label-placement':
      args.labelPlacement === options.labelPlacement.default ? undefined : args.labelPlacement,
    state: args.state === options.state.default ? undefined : args.state,
    'filter-mode': args.filterMode === options.filterMode.default ? undefined : args.filterMode,
    disabled: args.disabled,
    required: args.required,
    multiple: args.multiple,
    clearable: args.clearable,
    loading: args.loading,
    'allow-create': args.allowCreate,
    name: args.name,
    value: typeof args.value === 'string' ? args.value : undefined,
  })}
<script>
  const combobox = document.querySelector('ui-combobox');
  combobox.options = ${JSON.stringify(args.options, null, 2).replaceAll('\n', '\n  ')};${
    Array.isArray(args.value) ? `\n  combobox.defaultValue = ${JSON.stringify(args.value)};` : ''
  }
</script>`;

const meta = {
  title: 'Components/Selection/Combobox/Web Component',
  tags: ['!manifest'],
  args: {
    label: 'Animal',
    hint: 'Type to filter the list',
    placeholder: 'Search animals',
    options: ANIMALS,
    variant: options.variant.default,
    size: options.size.default,
    labelPlacement: options.labelPlacement.default,
    state: options.state.default,
    filterMode: options.filterMode.default,
    disabled: false,
    required: false,
    multiple: false,
    clearable: false,
    loading: false,
    allowCreate: false,
  },
  argTypes: {
    label: { control: 'text' },
    hint: { control: 'text' },
    placeholder: { control: 'text' },
    variant: { control: 'inline-radio', options: options.variant.options },
    size: { control: 'inline-radio', options: options.size.options },
    labelPlacement: { control: 'inline-radio', options: options.labelPlacement.options },
    state: { control: 'inline-radio', options: options.state.options },
    filterMode: { control: 'inline-radio', options: options.filterMode.options },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    multiple: { control: 'boolean' },
    clearable: { control: 'boolean' },
    loading: { control: 'boolean' },
    allowCreate: { control: 'boolean' },
    name: { control: 'text' },
    options: { control: false },
  },
  render: (args) => <UiCombobox {...args} />,
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: ComboboxArgs }) => source(args),
      },
    },
  },
} satisfies Meta<ComboboxArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Multiple: Story = {
  args: {
    label: 'Animals',
    multiple: true,
    clearable: true,
    value: ['badger', 'otter'],
    hint: 'Choose any',
  },
};

export const RemoteFiltering: Story = {
  args: { hint: 'The list comes from a server as you type' },
  render: (args) => <RemoteCombobox {...args} />,
};

export const Create: Story = {
  args: { label: 'Animals', hint: 'Add an animal the list lacks' },
  render: (args) => <CreatingCombobox {...args} />,
};

export const OnSurfaces: Story = {
  decorators: [onSurfaces],
  args: { value: 'fox' },
  render: (args) => (
    <div className="sb-row">
      {options.variant.options.map((variant) => (
        <UiCombobox key={variant} {...args} variant={variant} />
      ))}
    </div>
  ),
};
