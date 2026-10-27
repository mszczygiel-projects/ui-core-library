import { IconButton } from '@mszczygiel-projects/ui-core-react';
import { iconButton } from '@mszczygiel-projects/ui-core-shared/icon-button';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { onSurfaces } from '../decorators.tsx';
import { iconOptions, svgMap } from '../icons.ts';

const { options } = iconButton;
const variants = options.variant.options;

/** Every icon as a node for the icon prop, its SVG string from the icons package only. */
const iconNodes = Object.fromEntries(
  iconOptions.map((name) => [
    name,
    <span key={name} dangerouslySetInnerHTML={{ __html: svgMap[name] }} />,
  ]),
);

const meta = {
  title: 'Components/Actions/IconButton/React',
  component: IconButton,
  args: {
    label: 'Close panel',
    icon: 'iconClose',
    variant: 'primary',
    size: 'medium',
    disabled: false,
    loading: false,
    type: 'button',
  },
  argTypes: {
    label: { control: 'text' },
    icon: { control: 'select', options: iconOptions, mapping: iconNodes },
    variant: { control: 'select', options: variants },
    size: { control: 'inline-radio', options: options.size.options },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    type: { control: 'inline-radio', options: options.type.options },
    name: { control: 'text' },
    value: { control: 'text' },
    loadingLabel: { control: 'text' },
  },
} satisfies Meta<typeof IconButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="sb-row">
      {variants.map((variant) => (
        <IconButton key={variant} {...args} variant={variant} label={`Close (${variant})`} />
      ))}
    </div>
  ),
};

export const OnSurfaces: Story = { decorators: [onSurfaces], ...Variants };
