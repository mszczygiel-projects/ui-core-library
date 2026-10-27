import '@mszczygiel-projects/ui-core-web-components/badge';

import {
  badge,
  type BadgeShape,
  type BadgeSize,
  type BadgeTone,
  type BadgeVariant,
} from '@mszczygiel-projects/ui-core-shared/badge';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { onSurfaces } from '../decorators.tsx';
import { htmlOf } from '../html.ts';
import { type IconName, iconOptions, svgMap } from '../icons.ts';

interface BadgeArgs {
  readonly text: string;
  readonly icon?: IconName;
  readonly tone: BadgeTone;
  readonly variant: BadgeVariant;
  readonly size: BadgeSize;
  readonly shape: BadgeShape;
  readonly label?: string;
}

const { options } = badge;

/** The icon of the slot, its SVG string inserted unescaped: only the icons package supplies it. */
function Icon({ name }: { readonly name: IconName | undefined }) {
  return name === undefined ? null : (
    <span slot="icon" dangerouslySetInnerHTML={{ __html: svgMap[name] }} />
  );
}

function UiBadge(args: BadgeArgs) {
  return (
    <ui-badge
      tone={args.tone}
      variant={args.variant}
      size={args.size}
      shape={args.shape}
      label={args.label === '' ? undefined : args.label}
    >
      <Icon name={args.icon} />
      {args.text}
    </ui-badge>
  );
}

const source = (args: BadgeArgs) =>
  htmlOf(
    'ui-badge',
    {
      tone: args.tone === options.tone.default ? undefined : args.tone,
      variant: args.variant === options.variant.default ? undefined : args.variant,
      size: args.size === options.size.default ? undefined : args.size,
      shape: args.shape === options.shape.default ? undefined : args.shape,
      label: args.label,
    },
    `${args.icon === undefined ? '' : `<span slot="icon">${svgMap[args.icon]}</span>`}${args.text}`,
  );

const meta = {
  title: 'Components/Feedback/Badge/Web Component',
  tags: ['!manifest'],
  args: {
    text: 'Active',
    tone: options.tone.default,
    variant: options.variant.default,
    size: options.size.default,
    shape: options.shape.default,
  },
  argTypes: {
    text: { control: 'text' },
    icon: { control: 'select', options: iconOptions },
    tone: { control: 'select', options: options.tone.options },
    variant: { control: 'inline-radio', options: options.variant.options },
    size: { control: 'inline-radio', options: options.size.options },
    shape: { control: 'inline-radio', options: options.shape.options },
    label: { control: 'text' },
  },
  render: (args) => <UiBadge {...args} />,
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: BadgeArgs }) => source(args),
      },
    },
  },
} satisfies Meta<BadgeArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="sb-stack">
      {options.variant.options.map((variant) => (
        <div key={variant} className="sb-row">
          {options.tone.options.map((tone) => (
            <UiBadge key={tone} {...args} tone={tone} variant={variant} text={tone} />
          ))}
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: options.variant.options
          .flatMap((variant) =>
            options.tone.options.map((tone) => source({ ...meta.args, tone, variant, text: tone })),
          )
          .join('\n'),
      },
    },
  },
};

export const Shapes: Story = {
  render: (args) => (
    <div className="sb-row">
      {options.shape.options.map((shape) =>
        options.size.options.map((size) => (
          <UiBadge
            key={`${shape}-${size}`}
            {...args}
            shape={shape}
            size={size}
            text={`${shape} ${size}`}
          />
        )),
      )}
    </div>
  ),
};

export const WithIcon: Story = {
  render: (args) => (
    <div className="sb-row">
      <UiBadge {...args} tone="success" icon="iconCheck" text="Verified" />
      <UiBadge {...args} tone="success" icon="iconCheck" text="" label="Verified" />
    </div>
  ),
};

export const OnSurfaces: Story = { decorators: [onSurfaces], ...Variants };
