import '@mszczygiel-projects/ui-core-web-components/icon-button';

import {
  iconButton,
  type IconButtonSize,
  type IconButtonType,
  type IconButtonVariant,
} from '@mszczygiel-projects/ui-core-shared/icon-button';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { onSurfaces } from '../decorators.tsx';
import { htmlOf } from '../html.ts';
import { type IconName, iconOptions, svgMap } from '../icons.ts';

interface IconButtonArgs {
  readonly label: string;
  readonly icon?: IconName;
  readonly variant: IconButtonVariant;
  readonly size: IconButtonSize;
  readonly disabled: boolean;
  readonly loading: boolean;
  readonly type: IconButtonType;
  readonly name?: string;
  readonly value?: string;
  readonly loadingLabel?: string;
}

const { options } = iconButton;

/** The icon of the slot, its SVG string inserted unescaped: only the icons package supplies it. */
function Icon({ name }: { readonly name: IconName | undefined }) {
  return name === undefined ? null : (
    <span slot="icon" dangerouslySetInnerHTML={{ __html: svgMap[name] }} />
  );
}

function UiIconButton(args: IconButtonArgs) {
  return (
    <ui-icon-button
      label={args.label}
      variant={args.variant}
      size={args.size}
      disabled={args.disabled}
      loading={args.loading}
      type={args.type}
      name={args.name}
      value={args.value ?? ''}
      loadingLabel={args.loadingLabel === '' ? undefined : args.loadingLabel}
    >
      <Icon name={args.icon} />
    </ui-icon-button>
  );
}

const source = (args: IconButtonArgs) =>
  htmlOf(
    'ui-icon-button',
    {
      label: args.label,
      variant: args.variant === options.variant.default ? undefined : args.variant,
      size: args.size === options.size.default ? undefined : args.size,
      type: args.type === options.type.default ? undefined : args.type,
      disabled: args.disabled,
      loading: args.loading,
      name: args.name,
      value: args.value,
      'loading-label': args.loadingLabel,
    },
    args.icon === undefined ? '' : `<span slot="icon">${svgMap[args.icon]}</span>`,
  );

const meta = {
  title: 'Components/Actions/IconButton/Web Component',
  tags: ['!manifest'],
  args: {
    label: 'Close panel',
    icon: 'iconClose',
    variant: options.variant.default,
    size: options.size.default,
    disabled: false,
    loading: false,
    type: options.type.default,
  },
  argTypes: {
    label: { control: 'text' },
    icon: { control: 'select', options: iconOptions },
    variant: { control: 'select', options: options.variant.options },
    size: { control: 'inline-radio', options: options.size.options },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    type: { control: 'inline-radio', options: options.type.options },
    name: { control: 'text' },
    value: { control: 'text' },
    loadingLabel: { control: 'text' },
  },
  render: (args) => <UiIconButton {...args} />,
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: IconButtonArgs }) => source(args),
      },
    },
  },
} satisfies Meta<IconButtonArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="sb-row">
      {options.variant.options.map((variant) => (
        <UiIconButton key={variant} {...args} variant={variant} label={`Close (${variant})`} />
      ))}
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: options.variant.options
          .map((variant) => source({ ...meta.args, variant, label: `Close (${variant})` }))
          .join('\n'),
      },
    },
  },
};

export const OnSurfaces: Story = { decorators: [onSurfaces], ...Variants };
