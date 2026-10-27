import '@mszczygiel-projects/ui-core-web-components/chip';

import { chip, type ChipSize, type ChipVariant } from '@mszczygiel-projects/ui-core-shared/chip';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { onSurfaces } from '../decorators.tsx';
import { htmlOf } from '../html.ts';
import { type IconName, iconOptions, svgMap } from '../icons.ts';

interface ChipArgs {
  readonly text: string;
  readonly icon?: IconName;
  readonly variant: ChipVariant;
  readonly size: ChipSize;
  readonly selectable: boolean;
  readonly selected?: boolean;
  readonly disabled: boolean;
  readonly dismissible: boolean;
  readonly dismissLabel?: string;
}

const { options } = chip;

const FILTERS = ['Open now', 'Free entry', 'Family'] as const;

/** The icon of the slot, its SVG string inserted unescaped: only the icons package supplies it. */
function Icon({ name }: { readonly name: IconName | undefined }) {
  return name === undefined ? null : (
    <span slot="icon" dangerouslySetInnerHTML={{ __html: svgMap[name] }} />
  );
}

function UiChip({ onDismiss, ...args }: ChipArgs & { readonly onDismiss?: () => void }) {
  return (
    <ui-chip
      variant={args.variant}
      size={args.size}
      selectable={args.selectable}
      selected={args.selected ?? false}
      disabled={args.disabled}
      dismissible={args.dismissible}
      dismissLabel={args.dismissLabel === '' ? undefined : args.dismissLabel}
      onui-dismiss={onDismiss}
    >
      <Icon name={args.icon} />
      {args.text}
    </ui-chip>
  );
}

const source = (args: ChipArgs) =>
  htmlOf(
    'ui-chip',
    {
      variant: args.variant === options.variant.default ? undefined : args.variant,
      size: args.size === options.size.default ? undefined : args.size,
      selectable: args.selectable,
      selected: args.selected,
      disabled: args.disabled,
      dismissible: args.dismissible,
      'dismiss-label': args.dismissLabel,
    },
    `${args.icon === undefined ? '' : `<span slot="icon">${svgMap[args.icon]}</span>`}${args.text}`,
  );

const meta = {
  title: 'Components/Selection/Chip/Web Component',
  tags: ['!manifest'],
  args: {
    text: 'Open now',
    variant: options.variant.default,
    size: options.size.default,
    selectable: true,
    disabled: false,
    dismissible: false,
  },
  argTypes: {
    text: { control: 'text' },
    icon: { control: 'select', options: iconOptions },
    variant: { control: 'inline-radio', options: options.variant.options },
    size: { control: 'inline-radio', options: options.size.options },
    selectable: { control: 'boolean' },
    selected: { control: 'boolean' },
    disabled: { control: 'boolean' },
    dismissible: { control: 'boolean' },
    dismissLabel: { control: 'text' },
  },
  render: (args) => <UiChip {...args} />,
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: ChipArgs }) => source(args),
      },
    },
  },
} satisfies Meta<ChipArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="sb-stack">
      {options.variant.options.map((variant) => (
        <div key={variant} className="sb-row">
          <UiChip {...args} variant={variant} text={variant} />
          <UiChip {...args} variant={variant} selected text={`${variant} selected`} />
          <UiChip {...args} variant={variant} disabled text={`${variant} disabled`} />
        </div>
      ))}
    </div>
  ),
};

export const Selectable: Story = {
  render: (args) => (
    <div className="sb-row" role="group" aria-label="Filters">
      {FILTERS.map((filter, index) => (
        <UiChip key={filter} {...args} selectable selected={index === 0} text={filter} />
      ))}
    </div>
  ),
};

export const Dismissible: Story = {
  render: function Render(args) {
    const [chosen, setChosen] = useState<readonly string[]>(FILTERS);
    return (
      <div className="sb-row" role="group" aria-label="Chosen filters">
        {chosen.map((filter) => (
          <UiChip
            key={filter}
            {...args}
            selectable={false}
            dismissible
            text={filter}
            onDismiss={() => {
              setChosen((current) => current.filter((item) => item !== filter));
            }}
          />
        ))}
      </div>
    );
  },
};

export const OnSurfaces: Story = { decorators: [onSurfaces], ...Variants };
