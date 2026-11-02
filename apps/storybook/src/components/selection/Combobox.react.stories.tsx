import { Combobox, type ComboboxProps } from '@mszczygiel-projects/ui-core-react';
import { combobox } from '@mszczygiel-projects/ui-core-shared/combobox';
import type {
  ListboxItems,
  ListboxOption,
  ListboxValue,
} from '@mszczygiel-projects/ui-core-shared/listbox';
import { filterItems } from '@mszczygiel-projects/ui-core-shared/listbox-navigation';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';

import { onSurfaces } from '../decorators.tsx';

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
function RemoteCombobox(args: ComboboxProps) {
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
    <Combobox
      {...args}
      filterMode="remote"
      options={found}
      loading={loading}
      onQueryChange={setQuery}
    />
  );
}

/** Adds the option a user creates and chooses it. */
function CreatingCombobox(args: ComboboxProps) {
  const [items, setItems] = useState<readonly ListboxOption[]>(ANIMALS);
  const [value, setValue] = useState<ListboxValue>(['fox']);
  return (
    <Combobox
      {...args}
      multiple
      allowCreate
      options={items}
      value={value}
      onValueChange={setValue}
      onCreate={(query) => {
        const created: ListboxOption = { value: query.toLowerCase(), label: query };
        setItems((current) => [...current, created]);
        setValue((current) => [...(typeof current === 'string' ? [] : current), created.value]);
      }}
    />
  );
}

const meta = {
  title: 'Components/Selection/Combobox/React',
  component: Combobox,
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
} satisfies Meta<typeof Combobox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Multiple: Story = {
  args: {
    label: 'Animals',
    multiple: true,
    clearable: true,
    defaultValue: ['badger', 'otter'],
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
  args: { defaultValue: 'fox' },
  render: (args) => (
    <div className="sb-row">
      {options.variant.options.map((variant) => (
        <Combobox key={variant} {...args} variant={variant} />
      ))}
    </div>
  ),
};
