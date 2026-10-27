import { Chip } from '@mszczygiel-projects/ui-core-react';
import { chip } from '@mszczygiel-projects/ui-core-shared/chip';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { onSurfaces } from '../decorators.tsx';
import { iconOptions, svgMap } from '../icons.ts';

const { options } = chip;

/** Every icon as a node for the icon prop, its SVG string from the icons package only. */
const iconNodes = Object.fromEntries(
  iconOptions.map((name) => [
    name,
    <span key={name} dangerouslySetInnerHTML={{ __html: svgMap[name] }} />,
  ]),
);

const FILTERS = ['Open now', 'Free entry', 'Family'] as const;

const meta = {
  title: 'Components/Selection/Chip/React',
  component: Chip,
  args: {
    children: 'Open now',
    variant: options.variant.default,
    size: options.size.default,
    selectable: true,
    disabled: false,
    dismissible: false,
  },
  argTypes: {
    children: { control: 'text' },
    icon: { control: 'select', options: iconOptions, mapping: iconNodes },
    variant: { control: 'inline-radio', options: options.variant.options },
    size: { control: 'inline-radio', options: options.size.options },
    selectable: { control: 'boolean' },
    defaultSelected: { control: 'boolean' },
    disabled: { control: 'boolean' },
    dismissible: { control: 'boolean' },
    dismissLabel: { control: 'text' },
  },
} satisfies Meta<typeof Chip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="sb-stack">
      {options.variant.options.map((variant) => (
        <div key={variant} className="sb-row">
          <Chip {...args} variant={variant}>
            {variant}
          </Chip>
          <Chip {...args} variant={variant} defaultSelected>
            {`${variant} selected`}
          </Chip>
          <Chip {...args} variant={variant} disabled>
            {`${variant} disabled`}
          </Chip>
        </div>
      ))}
    </div>
  ),
};

export const Selectable: Story = {
  render: function Render(args) {
    const [selected, setSelected] = useState<readonly string[]>(['Open now']);
    return (
      <div className="sb-row" role="group" aria-label="Filters">
        {FILTERS.map((filter) => (
          <Chip
            key={filter}
            {...args}
            selectable
            selected={selected.includes(filter)}
            onSelectedChange={(on) => {
              setSelected((current) =>
                on ? [...current, filter] : current.filter((item) => item !== filter),
              );
            }}
          >
            {filter}
          </Chip>
        ))}
      </div>
    );
  },
};

export const Dismissible: Story = {
  render: function Render(args) {
    const [chosen, setChosen] = useState<readonly string[]>(FILTERS);
    return (
      <div className="sb-row" role="group" aria-label="Chosen filters">
        {chosen.map((filter) => (
          <Chip
            key={filter}
            {...args}
            selectable={false}
            dismissible
            onDismiss={() => {
              setChosen((current) => current.filter((item) => item !== filter));
            }}
          >
            {filter}
          </Chip>
        ))}
      </div>
    );
  },
};

export const OnSurfaces: Story = { decorators: [onSurfaces], ...Variants };
