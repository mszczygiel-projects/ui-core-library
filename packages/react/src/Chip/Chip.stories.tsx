import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { IconStar } from '@mszczygiel-projects/ui-core-icons/react';
import { Chip } from './Chip.js';
import type { ChipAppearance, ChipVariant } from './Chip.js';

const meta: Meta<typeof Chip> = {
  title: 'React/Chip',
  component: Chip,
  argTypes: {
    variant: {
      control: 'select',
      options: ['neutral', 'brand', 'success', 'warning', 'error', 'info'],
    },
    appearance: {
      control: 'select',
      options: ['solid', 'subtle', 'outline'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium'],
    },
  },
  args: {
    variant: 'neutral',
    appearance: 'solid',
    size: 'small',
    selected: false,
    disabled: false,
    dismissible: false,
    children: 'Chip',
  },
};

export default meta;
type Story = StoryObj<typeof Chip>;

const variants: ChipVariant[] = ['neutral', 'brand', 'success', 'warning', 'error', 'info'];
const appearances: ChipAppearance[] = ['solid', 'subtle', 'outline'];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const rowStyle = { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' } as const;
const columnStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  alignItems: 'flex-start',
} as const;

export const Playground: Story = {};

export const SolidVariants: Story = {
  render: ({ size, dismissible }) => (
    <div style={rowStyle}>
      {variants.map((v) => (
        <Chip key={v} variant={v} appearance="solid" size={size} dismissible={dismissible}>
          {cap(v)}
        </Chip>
      ))}
    </div>
  ),
};

export const SubtleVariants: Story = {
  render: ({ size, dismissible }) => (
    <div style={rowStyle}>
      {variants.map((v) => (
        <Chip key={v} variant={v} appearance="subtle" size={size} dismissible={dismissible}>
          {cap(v)}
        </Chip>
      ))}
    </div>
  ),
};

export const OutlineVariants: Story = {
  render: ({ size, dismissible }) => (
    <div style={rowStyle}>
      {variants.map((v) => (
        <Chip key={v} variant={v} appearance="outline" size={size} dismissible={dismissible}>
          {cap(v)}
        </Chip>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: ({ variant, appearance }) => (
    <div style={rowStyle}>
      <Chip variant={variant} appearance={appearance} size="small">
        Small
      </Chip>
      <Chip variant={variant} appearance={appearance} size="medium">
        Medium
      </Chip>
    </div>
  ),
};

export const WithIcon: Story = {
  render: ({ size, appearance }) => (
    <div style={rowStyle}>
      {variants.map((v) => (
        <Chip key={v} variant={v} appearance={appearance} size={size} icon={<IconStar />}>
          {cap(v)}
        </Chip>
      ))}
    </div>
  ),
};

export const Selected: Story = {
  render: ({ size }) => (
    <div style={columnStyle}>
      {appearances.map((appearance) => (
        <div key={appearance} style={rowStyle}>
          {variants.map((v) => (
            <Chip key={v} variant={v} appearance={appearance} size={size} selected>
              {cap(v)}
            </Chip>
          ))}
        </div>
      ))}
    </div>
  ),
};

export const Disabled: Story = {
  render: ({ size }) => (
    <div style={columnStyle}>
      {appearances.map((appearance) => (
        <div key={appearance} style={rowStyle}>
          {variants.map((v) => (
            /* dismissible stays set — the dismiss button must disappear while disabled */
            <Chip key={v} variant={v} appearance={appearance} size={size} disabled dismissible>
              {cap(v)}
            </Chip>
          ))}
        </div>
      ))}
    </div>
  ),
};

/** Filter bar demo: selected + dismissible together, with live removal and toggling. */
const FilterBarDemo = ({
  size,
  appearance,
}: {
  size?: 'small' | 'medium';
  appearance?: ChipAppearance;
}) => {
  const [filters, setFilters] = useState(
    variants.map((v) => ({ id: v, label: cap(v), selected: v === 'brand' })),
  );
  return (
    <div style={rowStyle}>
      {filters.map((f) => (
        <Chip
          key={f.id}
          variant={f.id as ChipVariant}
          appearance={appearance}
          size={size}
          selected={f.selected}
          dismissible
          onClick={() =>
            setFilters((all) =>
              all.map((x) => (x.id === f.id ? { ...x, selected: !x.selected } : x)),
            )
          }
          onDismiss={() => setFilters((all) => all.filter((x) => x.id !== f.id))}
        >
          {f.label}
        </Chip>
      ))}
      {filters.length === 0 && <span>All filters removed — reload the story.</span>}
    </div>
  );
};

export const FilterBar: Story = {
  name: 'Filter bar (selected + dismissible)',
  render: ({ size, appearance }) => <FilterBarDemo size={size} appearance={appearance} />,
};

export const OnSurfaces: Story = {
  render: ({ size }) => (
    <div style={columnStyle}>
      {(['default', 'subtle', 'inverse', 'primary'] as const).map((surface) => (
        <div
          key={surface}
          data-surface={surface === 'default' ? undefined : surface}
          style={{
            backgroundColor: 'var(--color-background-default)',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {appearances.map((appearance) => (
            <div key={appearance} style={rowStyle}>
              {variants.map((v) => (
                <Chip key={v} variant={v} appearance={appearance} size={size}>
                  {cap(v)}
                </Chip>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
};
