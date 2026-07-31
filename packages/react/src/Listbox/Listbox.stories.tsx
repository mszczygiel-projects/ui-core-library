import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Listbox } from './Listbox.js';
import type { ListboxOption, ListboxOptionGroup } from './Listbox.js';
import { buildRows, nextEnabledRow } from './listbox-navigation.js';

const meta: Meta<typeof Listbox> = {
  title: 'React/Listbox',
  component: Listbox,
  argTypes: {
    size: { control: 'select', options: ['small', 'default', 'large'] },
  },
  args: {
    idPrefix: 'listbox-demo',
    size: 'default',
    multiple: false,
    loading: false,
  },
};

export default meta;
type Story = StoryObj<typeof Listbox>;

const seasons: ListboxOption[] = [
  { value: '2025', label: '2025/26' },
  { value: '2024', label: '2024/25' },
  { value: '2023', label: '2023/24', disabled: true },
  { value: '2022', label: '2022/23' },
];

const grouped: ListboxOptionGroup[] = [
  { label: 'Recent', options: [{ value: '2025', label: '2025/26' }] },
  {
    label: 'All seasons',
    options: [
      { value: '2024', label: '2024/25' },
      { value: '2023', label: '2023/24' },
      { value: '2022', label: '2022/23' },
    ],
  },
];

const separated: ListboxOptionGroup[] = [
  { options: [{ value: '2025', label: '2025/26' }] },
  {
    options: [
      { value: '2024', label: '2024/25' },
      { value: '2023', label: '2023/24' },
    ],
  },
  { label: 'Archive', options: [{ value: '2022', label: '2022/23' }] },
];

const frame: CSSProperties = { width: 260 };
const columnStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 24 };
const rowStyle: CSSProperties = { display: 'flex', gap: 24, alignItems: 'flex-start' };

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState('2024');
    const [activeIndex, setActiveIndex] = useState(-1);
    return (
      <div style={frame}>
        <Listbox
          {...args}
          items={seasons}
          value={value}
          activeIndex={activeIndex}
          onActivate={setActiveIndex}
          onSelect={(row) => row.kind === 'option' && setValue(row.option.value)}
        />
      </div>
    );
  },
};

export const Grouped: Story = {
  render: (args) => {
    const [value, setValue] = useState('2024');
    return (
      <div style={frame}>
        <Listbox
          {...args}
          items={grouped}
          value={value}
          onSelect={(row) => row.kind === 'option' && setValue(row.option.value)}
        />
      </div>
    );
  },
};

/** A group with no label is divided from the one above by a bare rule. */
export const SeparatedGroups: Story = {
  render: (args) => {
    const [value, setValue] = useState('2024');
    return (
      <div style={frame}>
        <Listbox
          {...args}
          items={separated}
          value={value}
          onSelect={(row) => row.kind === 'option' && setValue(row.option.value)}
        />
      </div>
    );
  },
};

export const MultiSelect: Story = {
  render: (args) => {
    const [values, setValues] = useState<string[]>(['2025', '2023']);
    return (
      <div style={frame}>
        <Listbox
          {...args}
          multiple
          items={seasons}
          value={values}
          onSelect={(row) => {
            if (row.kind !== 'option') return;
            setValues((current) =>
              current.includes(row.option.value)
                ? current.filter((v) => v !== row.option.value)
                : [...current, row.option.value],
            );
          }}
        />
      </div>
    );
  },
};

export const Empty: Story = {
  render: (args) => (
    <div style={frame}>
      <Listbox {...args} items={[]} onSelect={() => {}} />
    </div>
  ),
};

export const Loading: Story = {
  render: (args) => (
    <div style={frame}>
      <Listbox {...args} loading items={[]} onSelect={() => {}} />
    </div>
  ),
};

export const CreateOption: Story = {
  render: (args) => {
    const [created, setCreated] = useState<string | null>(null);
    return (
      <div style={frame}>
        <Listbox
          {...args}
          items={seasons.slice(0, 2)}
          createValue="2026/27"
          onSelect={(row) => setCreated(row.kind === 'create' ? '2026/27' : null)}
        />
        {created && <p>Created: {created}</p>}
      </div>
    );
  },
};

/** Arrow keys drive `activeIndex` through the exported row helpers. */
export const KeyboardNavigation: Story = {
  render: (args) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [value, setValue] = useState('');
    const rows = buildRows(seasons);
    return (
      <div style={frame}>
        <input
          aria-label="Focus me, then use arrow keys"
          placeholder="Focus me, then arrow keys"
          role="combobox"
          aria-expanded="true"
          aria-controls={args.idPrefix}
          aria-activedescendant={
            activeIndex >= 0 ? `${args.idPrefix}-opt-${activeIndex}` : undefined
          }
          style={{ width: '100%', marginBottom: 8 }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setActiveIndex((i) => nextEnabledRow(rows, i, 1));
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActiveIndex((i) => nextEnabledRow(rows, i, -1));
            } else if (event.key === 'Enter') {
              event.preventDefault();
              const row = rows[activeIndex];
              if (row?.kind === 'option') setValue(row.option.value);
            }
          }}
        />
        <Listbox
          {...args}
          items={seasons}
          value={value}
          activeIndex={activeIndex}
          onActivate={setActiveIndex}
          onSelect={(row) => row.kind === 'option' && setValue(row.option.value)}
        />
      </div>
    );
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={rowStyle}>
      {(['small', 'default', 'large'] as const).map((size) => (
        <div key={size} style={frame}>
          <Listbox
            {...args}
            idPrefix={`listbox-${size}`}
            size={size}
            items={seasons}
            value="2024"
            onSelect={() => {}}
          />
        </div>
      ))}
    </div>
  ),
};

export const OnSurfaces: Story = {
  render: (args) => (
    <div style={columnStyle}>
      {(['default', 'subtle', 'inverse', 'primary'] as const).map((surface) => (
        <div
          key={surface}
          data-surface={surface === 'default' ? undefined : surface}
          style={{ backgroundColor: 'var(--color-background-default)', padding: 16 }}
        >
          <div style={frame}>
            <Listbox
              {...args}
              idPrefix={`listbox-${surface}`}
              items={grouped}
              value="2024"
              createValue="2026/27"
              onSelect={() => {}}
            />
          </div>
        </div>
      ))}
    </div>
  ),
};
