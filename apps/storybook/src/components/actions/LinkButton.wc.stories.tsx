import '@mszczygiel-projects/ui-core-web-components/link-button';

import {
  linkButton,
  type LinkButtonShape,
  type LinkButtonSize,
  type LinkButtonVariant,
} from '@mszczygiel-projects/ui-core-shared/link-button';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { onSurfaces } from '../decorators.tsx';
import { htmlOf, textOf } from '../html.ts';
import { type IconName, iconOptions, svgMap } from '../icons.ts';

interface LinkButtonArgs {
  readonly children: string;
  readonly href: string;
  readonly target?: string;
  readonly rel?: string;
  readonly download?: string;
  readonly variant: LinkButtonVariant;
  readonly size: LinkButtonSize;
  readonly shape: LinkButtonShape;
  readonly disabled: boolean;
  readonly label?: string;
  readonly leadingIcon?: IconName;
  readonly trailingIcon?: IconName;
}

const { options } = linkButton;

type IconSlot = 'leading-icon' | 'trailing-icon';

/** The icon of a slot, its SVG string inserted unescaped: only the icons package supplies it. */
function Icon({ slot, name }: { readonly slot: IconSlot; readonly name: IconName | undefined }) {
  return name === undefined ? null : (
    <span slot={slot} dangerouslySetInnerHTML={{ __html: svgMap[name] }} />
  );
}

const optional = (value: string | undefined) => (value === '' ? undefined : value);

function UiLinkButton(args: LinkButtonArgs) {
  return (
    <ui-link-button
      href={args.href}
      target={optional(args.target)}
      rel={optional(args.rel)}
      download={args.download}
      variant={args.variant}
      size={args.size}
      shape={args.shape}
      disabled={args.disabled}
      label={optional(args.label)}
    >
      <Icon slot="leading-icon" name={args.leadingIcon} />
      {args.children}
      <Icon slot="trailing-icon" name={args.trailingIcon} />
    </ui-link-button>
  );
}

const iconSource = (slot: IconSlot, name: IconName | undefined) =>
  name === undefined ? '' : `<span slot="${slot}">${svgMap[name]}</span>`;

const source = (args: LinkButtonArgs) =>
  htmlOf(
    'ui-link-button',
    {
      href: args.href,
      target: args.target,
      rel: args.rel,
      download: args.download,
      variant: args.variant === options.variant.default ? undefined : args.variant,
      size: args.size === options.size.default ? undefined : args.size,
      shape: args.shape === options.shape.default ? undefined : args.shape,
      disabled: args.disabled,
      label: args.label,
    },
    `${iconSource('leading-icon', args.leadingIcon)}${textOf(args.children)}${iconSource('trailing-icon', args.trailingIcon)}`,
  );

const meta = {
  title: 'Components/Actions/LinkButton/Web Component',
  tags: ['!manifest'],
  args: {
    children: 'See pricing',
    href: '#pricing',
    variant: options.variant.default,
    size: options.size.default,
    shape: options.shape.default,
    disabled: false,
  },
  argTypes: {
    children: { control: 'text' },
    href: { control: 'text' },
    target: { control: 'text' },
    rel: { control: 'text' },
    download: { control: 'text' },
    variant: { control: 'select', options: options.variant.options },
    size: { control: 'inline-radio', options: options.size.options },
    shape: { control: 'inline-radio', options: options.shape.options },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
    leadingIcon: { control: 'select', options: iconOptions },
    trailingIcon: { control: 'select', options: iconOptions },
  },
  render: (args) => <UiLinkButton {...args} />,
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: LinkButtonArgs }) => source(args),
      },
    },
  },
} satisfies Meta<LinkButtonArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="sb-row">
      {options.variant.options.map((variant) => (
        <UiLinkButton key={variant} {...args} variant={variant} children={variant} />
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
        <UiLinkButton key={shape} {...args} shape={shape} children={shape} />
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
  args: { leadingIcon: 'iconCalendar', trailingIcon: 'iconChevronRight' },
};

export const OnSurfaces: Story = { decorators: [onSurfaces], ...Variants };
