import '@mszczygiel-projects/ui-core-web-components/button';

import {
  button,
  type ButtonShape,
  type ButtonSize,
  type ButtonType,
  type ButtonVariant,
} from '@mszczygiel-projects/ui-core-shared/button';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { onSurfaces } from '../decorators.tsx';
import { htmlOf, textOf } from '../html.ts';
import { type IconName, iconOptions, svgMap } from '../icons.ts';

interface ButtonArgs {
  readonly children: string;
  readonly variant: ButtonVariant;
  readonly size: ButtonSize;
  readonly shape: ButtonShape;
  readonly disabled: boolean;
  readonly loading: boolean;
  readonly type: ButtonType;
  readonly name?: string;
  readonly value?: string;
  readonly label?: string;
  readonly loadingLabel?: string;
  readonly leadingIcon?: IconName;
  readonly trailingIcon?: IconName;
}

const { options } = button;

type IconSlot = 'leading-icon' | 'trailing-icon';

/** The icon of a slot, its SVG string inserted unescaped: only the icons package supplies it. */
function Icon({ slot, name }: { readonly slot: IconSlot; readonly name: IconName | undefined }) {
  return name === undefined ? null : (
    <span slot={slot} dangerouslySetInnerHTML={{ __html: svgMap[name] }} />
  );
}

function UiButton(args: ButtonArgs) {
  return (
    <ui-button
      variant={args.variant}
      size={args.size}
      shape={args.shape}
      disabled={args.disabled}
      loading={args.loading}
      type={args.type}
      name={args.name}
      value={args.value ?? ''}
      label={args.label === '' ? undefined : args.label}
      loadingLabel={args.loadingLabel === '' ? undefined : args.loadingLabel}
    >
      <Icon slot="leading-icon" name={args.leadingIcon} />
      {args.children}
      <Icon slot="trailing-icon" name={args.trailingIcon} />
    </ui-button>
  );
}

const iconSource = (slot: IconSlot, name: IconName | undefined) =>
  name === undefined ? '' : `<span slot="${slot}">${svgMap[name]}</span>`;

const source = (args: ButtonArgs) =>
  htmlOf(
    'ui-button',
    {
      variant: args.variant === options.variant.default ? undefined : args.variant,
      size: args.size === options.size.default ? undefined : args.size,
      shape: args.shape === options.shape.default ? undefined : args.shape,
      type: args.type === options.type.default ? undefined : args.type,
      disabled: args.disabled,
      loading: args.loading,
      name: args.name,
      value: args.value,
      label: args.label,
      'loading-label': args.loadingLabel,
    },
    `${iconSource('leading-icon', args.leadingIcon)}${textOf(args.children)}${iconSource('trailing-icon', args.trailingIcon)}`,
  );

const meta = {
  title: 'Components/Actions/Button/Web Component',
  tags: ['!manifest'],
  args: {
    children: 'Save changes',
    variant: options.variant.default,
    size: options.size.default,
    shape: options.shape.default,
    disabled: false,
    loading: false,
    type: options.type.default,
  },
  argTypes: {
    children: { control: 'text' },
    variant: { control: 'select', options: options.variant.options },
    size: { control: 'inline-radio', options: options.size.options },
    shape: { control: 'inline-radio', options: options.shape.options },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    type: { control: 'inline-radio', options: options.type.options },
    name: { control: 'text' },
    value: { control: 'text' },
    label: { control: 'text' },
    loadingLabel: { control: 'text' },
    leadingIcon: { control: 'select', options: iconOptions },
    trailingIcon: { control: 'select', options: iconOptions },
  },
  render: (args) => <UiButton {...args} />,
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: ButtonArgs }) => source(args),
      },
    },
  },
} satisfies Meta<ButtonArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="sb-row">
      {options.variant.options.map((variant) => (
        <UiButton key={variant} {...args} variant={variant} children={variant} />
      ))}
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: options.variant.options
          .map((variant) => source({ ...meta.args, variant, children: variant }))
          .join('\n'),
      },
    },
  },
};

export const Shapes: Story = {
  render: (args) => (
    <div className="sb-row">
      {options.shape.options.map((shape) => (
        <UiButton key={shape} {...args} shape={shape} children={shape} />
      ))}
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: options.shape.options
          .map((shape) => source({ ...meta.args, shape, children: shape }))
          .join('\n'),
      },
    },
  },
};

export const WithIcons: Story = {
  args: { leadingIcon: 'iconCheck', trailingIcon: 'iconChevronRight' },
};

export const OnSurfaces: Story = { decorators: [onSurfaces], ...Variants };
