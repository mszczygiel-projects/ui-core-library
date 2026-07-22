import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { IconSearch } from '@mszczygiel-projects/ui-core-icons/react';
import { Combobox } from './Combobox.js';
import type { ComboboxOption, ComboboxOptionGroup } from './Combobox.js';

const meta: Meta<typeof Combobox> = {
  title: 'React/Combobox',
  component: Combobox,
  argTypes: {
    variant: { control: 'select', options: ['outline', 'filled', 'underlined'] },
    size: { control: 'select', options: ['small', 'default', 'large'] },
    state: { control: 'select', options: ['default', 'success', 'error', 'disabled'] },
    filterMode: { control: 'select', options: ['local', 'remote'] },
  },
  args: {
    variant: 'outline',
    size: 'default',
    state: 'default',
    label: 'Season',
    placeholder: 'Search seasons',
    multiple: false,
    loading: false,
    allowCreate: false,
    clearable: false,
  },
};

export default meta;
type Story = StoryObj<typeof Combobox>;

const SEASONS: ComboboxOption[] = [
  { value: '2025', label: '2025/26' },
  { value: '2024', label: '2024/25' },
  { value: '2023', label: '2023/24' },
  { value: '2022', label: '2022/23', disabled: true },
  { value: '2021', label: '2021/22' },
];

const GROUPED: ComboboxOptionGroup[] = [
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

const frame: CSSProperties = { width: 320 };
const column: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 24 };

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState('');
    return (
      <div style={frame}>
        <Combobox {...args} options={SEASONS} value={value} onChange={setValue} />
      </div>
    );
  },
};

export const WithLeadingIcon: Story = {
  render: (args) => {
    const [value, setValue] = useState('');
    return (
      <div style={frame}>
        <Combobox
          {...args}
          options={SEASONS}
          value={value}
          onChange={setValue}
          leadingIcon={<IconSearch />}
          clearable
        />
      </div>
    );
  },
};

/** Selections stay in the field as dismissible chips and the list stays open. */
export const MultiSelect: Story = {
  render: (args) => {
    const [values, setValues] = useState<string[]>(['2025', '2024']);
    return (
      <div style={frame}>
        <Combobox
          {...args}
          multiple
          options={SEASONS}
          values={values}
          onValuesChange={setValues}
          leadingIcon={<IconSearch />}
        />
        <p>Selected: {values.join(', ') || '—'}</p>
      </div>
    );
  },
};

export const GroupedOptions: Story = {
  render: (args) => {
    const [value, setValue] = useState('');
    return (
      <div style={frame}>
        <Combobox {...args} options={GROUPED} value={value} onChange={setValue} />
      </div>
    );
  },
};

/** Offers the typed text as a new option when nothing matches. */
export const AllowCreate: Story = {
  render: (args) => {
    const [options, setOptions] = useState(SEASONS);
    const [value, setValue] = useState('');
    return (
      <div style={frame}>
        <Combobox
          {...args}
          allowCreate
          options={options}
          value={value}
          onChange={setValue}
          onCreate={(label) => {
            const created = { value: label, label };
            setOptions((current) => [...current, created]);
            setValue(created.value);
          }}
        />
      </div>
    );
  },
};

/** `filterMode="remote"` hands the debounced query back and renders what it is given. */
export const RemoteFiltering: Story = {
  render: (args) => {
    const [query, setQuery] = useState('');
    const [options, setOptions] = useState<ComboboxOption[]>(SEASONS);
    const [loading, setLoading] = useState(false);
    const [value, setValue] = useState('');

    useEffect(() => {
      if (!query) {
        setOptions(SEASONS);
        return undefined;
      }
      setLoading(true);
      const timer = setTimeout(() => {
        setOptions(SEASONS.filter((o) => o.label.includes(query)));
        setLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }, [query]);

    return (
      <div style={frame}>
        <Combobox
          {...args}
          filterMode="remote"
          loading={loading}
          options={options}
          value={value}
          onChange={setValue}
          onFilter={setQuery}
          hint="Simulated 600 ms round trip"
        />
      </div>
    );
  },
};

export const Loading: Story = {
  args: { loading: true },
  render: (args) => (
    <div style={frame}>
      <Combobox {...args} options={[]} />
    </div>
  ),
};

export const Empty: Story = {
  render: (args) => (
    <div style={frame}>
      <Combobox {...args} options={[]} />
    </div>
  ),
};

export const Variants: Story = {
  render: (args) => (
    <div style={column}>
      {(['outline', 'filled', 'underlined'] as const).map((variant) => (
        <div key={variant} style={frame}>
          <Combobox {...args} variant={variant} options={SEASONS} />
        </div>
      ))}
    </div>
  ),
};

export const States: Story = {
  render: (args) => (
    <div style={column}>
      {(['default', 'success', 'error', 'disabled'] as const).map((state) => (
        <div key={state} style={frame}>
          <Combobox {...args} state={state} options={SEASONS} hint={`State: ${state}`} />
        </div>
      ))}
    </div>
  ),
};

export const OnSurfaces: Story = {
  render: (args) => (
    <div style={column}>
      {(['default', 'subtle', 'inverse', 'primary'] as const).map((surface) => (
        <div
          key={surface}
          data-surface={surface === 'default' ? undefined : surface}
          style={{ backgroundColor: 'var(--color-background-default)', padding: 16 }}
        >
          <div style={frame}>
            <Combobox {...args} options={SEASONS} leadingIcon={<IconSearch />} />
          </div>
        </div>
      ))}
    </div>
  ),
};
