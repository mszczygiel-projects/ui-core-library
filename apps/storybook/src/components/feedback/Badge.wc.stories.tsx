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
  readonly leading?: IconName;
  readonly dot?: 'leading' | 'trailing';
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
    <span slot="leading" dangerouslySetInnerHTML={{ __html: svgMap[name] }} />
  );
}

const DOT = '<span class="sb-status-dot"></span>';

function UiBadge(args: BadgeArgs) {
  return (
    <ui-badge
      tone={args.tone}
      variant={args.variant}
      size={args.size}
      shape={args.shape}
      label={args.label === '' ? undefined : args.label}
    >
      <Icon name={args.leading} />
      {args.dot === 'leading' && <span slot="leading" className="sb-status-dot" />}
      {args.text}
      {args.dot === 'trailing' && <span slot="trailing" className="sb-status-dot" />}
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
    `${args.leading === undefined ? '' : `<span slot="leading">${svgMap[args.leading]}</span>`}${args.dot === 'leading' ? DOT.replace('<span', '<span slot="leading"') : ''}${args.text}${args.dot === 'trailing' ? DOT.replace('<span', '<span slot="trailing"') : ''}`,
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
    leading: { control: 'select', options: iconOptions },
    dot: { control: 'inline-radio', options: ['leading', 'trailing'] },
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
      <UiBadge {...args} tone="success" leading="iconCheck" text="Verified" />
      <UiBadge {...args} tone="success" leading="iconCheck" text="" label="Verified" />
    </div>
  ),
};

export const StatusDot: Story = {
  render: (args) => (
    <div className="sb-row">
      <UiBadge {...args} tone="success" variant="subtle" dot="leading" text="Live" />
      <UiBadge {...args} tone="warning" variant="subtle" dot="trailing" text="Draft" />
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: [
          source({
            ...meta.args,
            tone: 'success',
            variant: 'subtle',
            dot: 'leading',
            text: 'Live',
          }),
          source({
            ...meta.args,
            tone: 'warning',
            variant: 'subtle',
            dot: 'trailing',
            text: 'Draft',
          }),
        ].join('\n'),
      },
    },
  },
};

export const OnSurfaces: Story = { decorators: [onSurfaces], ...Variants };
