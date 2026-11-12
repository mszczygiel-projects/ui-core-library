import { LinkButton } from '@mszczygiel-projects/ui-core-react';
import { linkButton } from '@mszczygiel-projects/ui-core-shared/link-button';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { onSurfaces } from '../decorators.tsx';
import { iconOptions, svgMap } from '../icons.ts';

const { options } = linkButton;
const variants = options.variant.options;

/** Every icon as a node for the icon props, its SVG string from the icons package only. */
const iconNodes = Object.fromEntries(
  iconOptions.map((name) => [
    name,
    <span key={name} dangerouslySetInnerHTML={{ __html: svgMap[name] }} />,
  ]),
);

const meta = {
  title: 'Components/Actions/LinkButton/React',
  component: LinkButton,
  args: {
    children: 'See pricing',
    href: '#pricing',
    variant: 'primary',
    size: 'medium',
    shape: 'square',
    disabled: false,
  },
  argTypes: {
    children: { control: 'text' },
    href: { control: 'text' },
    target: { control: 'text' },
    rel: { control: 'text' },
    download: { control: 'text' },
    variant: { control: 'select', options: variants },
    size: { control: 'inline-radio', options: options.size.options },
    shape: { control: 'inline-radio', options: options.shape.options },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
    leadingIcon: { control: 'select', options: iconOptions, mapping: iconNodes },
    trailingIcon: { control: 'select', options: iconOptions, mapping: iconNodes },
    render: { control: false },
  },
} satisfies Meta<typeof LinkButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="sb-row">
      {variants.map((variant) => (
        <LinkButton key={variant} {...args} variant={variant}>
          {variant}
        </LinkButton>
      ))}
    </div>
  ),
};

export const Shapes: Story = {
  render: (args) => (
    <div className="sb-row">
      {options.shape.options.map((shape) => (
        <LinkButton key={shape} {...args} shape={shape}>
          {shape}
        </LinkButton>
      ))}
    </div>
  ),
};

export const WithIcons: Story = {
  args: { leadingIcon: 'iconCalendar', trailingIcon: 'iconChevronRight' },
};

export const OnSurfaces: Story = { decorators: [onSurfaces], ...Variants };
