import { createElement, useEffect, useRef, useState, type ComponentType } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { svgMap } from '@mszczygiel-projects/ui-core-icons';
import type { ListboxItems, ListboxOption } from '../listbox/listbox.js';
import './combobox.js';

const SEASONS: ListboxOption[] = [
  { value: '2025', label: '2025/26' },
  { value: '2024', label: '2024/25' },
  { value: '2023', label: '2023/24' },
  { value: '2022', label: '2022/23', disabled: true },
  { value: '2021', label: '2021/22' },
];

const GROUPED: ListboxItems = [
  { label: 'Current', options: [{ value: '2025', label: '2025/26' }] },
  {
    label: 'Archive',
    options: [
      { value: '2024', label: '2024/25' },
      { value: '2023', label: '2023/24' },
      { value: '2021', label: '2021/22' },
    ],
  },
];

type ComboboxArgs = {
  variant?: string;
  size?: string;
  state?: string;
  label?: string;
  hint?: string;
  placeholder?: string;
  multiple?: boolean;
  loading?: boolean;
  allowCreate?: boolean;
  clearable?: boolean;
  filterMode?: string;
  options?: ListboxItems;
  values?: string[];
  leadingIcon?: boolean;
};

const searchIcon = () =>
  createElement('span', {
    slot: 'leading-icon',
    style: { display: 'inline-flex' },
    dangerouslySetInnerHTML: { __html: svgMap['icon-search'] },
  });

type ComboboxEl = HTMLElement & { options: ListboxItems; values: string[] };

function ComboboxWC(props: ComboboxArgs) {
  const ref = useRef<ComboboxEl>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.options = props.options ?? SEASONS;
    if (props.values) ref.current.values = props.values;
  }, [props.options, props.values]);

  return createElement(
    'ui-combobox',
    {
      ref,
      variant: props.variant,
      'data-size': props.size,
      state: props.state,
      label: props.label,
      hint: props.hint,
      placeholder: props.placeholder,
      'filter-mode': props.filterMode,
      multiple: props.multiple || undefined,
      loading: props.loading || undefined,
      'allow-create': props.allowCreate || undefined,
      clearable: props.clearable || undefined,
    },
    props.leadingIcon ? searchIcon() : null,
  );
}

const meta: Meta<ComboboxArgs> = {
  title: 'Web Components/Combobox',
  // Tag-name string routes autodocs to the CEM extractor (see .storybook/preview.ts).
  component: 'ui-combobox' as unknown as ComponentType,
  render: (args) => createElement(ComboboxWC, args),
  argTypes: {
    variant: { control: 'select', options: ['outline', 'filled', 'underlined'] },
    size: { control: 'select', options: ['small', 'default', 'large'] },
    state: { control: 'select', options: ['default', 'success', 'error', 'disabled'] },
    filterMode: { control: 'select', options: ['local', 'remote'] },
    label: { control: 'text' },
    hint: { control: 'text' },
    placeholder: { control: 'text' },
    multiple: { control: 'boolean' },
    loading: { control: 'boolean' },
    allowCreate: { control: 'boolean' },
    clearable: { control: 'boolean' },
    leadingIcon: { control: 'boolean' },
  },
  args: {
    variant: 'outline',
    size: 'default',
    state: 'default',
    label: 'Season',
    placeholder: 'Search seasons',
    filterMode: 'local',
    multiple: false,
    loading: false,
    allowCreate: false,
    clearable: false,
    leadingIcon: false,
  },
};

export default meta;
type Story = StoryObj<ComboboxArgs>;

export const Default: Story = { args: {} };

export const WithLeadingIcon: Story = {
  args: { leadingIcon: true, clearable: true },
};

/** Selections stay in the field as dismissible chips and the list stays open. */
export const MultiSelect: Story = {
  args: { multiple: true, leadingIcon: true, values: ['2025', '2024'] },
};

export const GroupedOptions: Story = {
  args: { options: GROUPED },
};

/** Offers the typed text as a new option when nothing matches. */
export const AllowCreate: Story = {
  args: { allowCreate: true },
};

export const Loading: Story = {
  args: { loading: true, options: [] },
};

export const Empty: Story = {
  args: { options: [] },
};

/** Emits a debounced ui-filter event instead of filtering in place. */
export const RemoteFiltering: Story = {
  render: (args) => createElement(RemoteDemo, args),
};

function RemoteDemo(args: ComboboxArgs) {
  const ref = useRef<ComboboxEl>(null);
  const [options, setOptions] = useState<ListboxOption[]>(SEASONS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    el.options = options;
    const onFilter = (event: Event) => {
      const query = (event as CustomEvent<{ query: string }>).detail.query;
      setLoading(true);
      setTimeout(() => {
        setOptions(query ? SEASONS.filter((o) => o.label.includes(query)) : SEASONS);
        setLoading(false);
      }, 600);
    };
    el.addEventListener('ui-filter', onFilter);
    return () => el.removeEventListener('ui-filter', onFilter);
  }, [options]);

  return createElement('ui-combobox', {
    ref,
    variant: args.variant,
    'data-size': args.size,
    label: 'Season',
    hint: 'Simulated 600 ms round trip',
    placeholder: 'Search seasons',
    'filter-mode': 'remote',
    loading: loading || undefined,
  });
}

export const Variants: Story = {
  render: (args) =>
    createElement(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: 24 } },
      ...['outline', 'filled', 'underlined'].map((variant) =>
        createElement(ComboboxWC, { ...args, key: variant, variant }),
      ),
    ),
};

export const OnSurfaces: Story = {
  render: (args) =>
    createElement(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: 24 } },
      ...(['default', 'subtle', 'inverse', 'primary'] as const).map((surface) =>
        createElement(
          'div',
          {
            key: surface,
            'data-surface': surface === 'default' ? undefined : surface,
            style: { backgroundColor: 'var(--color-background-default)', padding: 16 },
          },
          createElement(ComboboxWC, { ...args, leadingIcon: true }),
        ),
      ),
    ),
};
