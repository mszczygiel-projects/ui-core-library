import { Button } from '@mszczygiel-projects/ui-core-react';
import { button } from '@mszczygiel-projects/ui-core-shared/button';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { onSurfaces } from '../decorators.tsx';
import { iconOptions, svgMap } from '../icons.ts';

const { options } = button;
const variants = options.variant.options;

/** Every icon as a node for the icon props, its SVG string from the icons package only. */
const iconNodes = Object.fromEntries(
  iconOptions.map((name) => [
    name,
    <span key={name} dangerouslySetInnerHTML={{ __html: svgMap[name] }} />,
  ]),
);

const meta = {
  title: 'Components/Actions/Button/React',
  component: Button,
  args: {
    children: 'Save changes',
    variant: 'primary',
    size: 'medium',
    shape: 'square',
    disabled: false,
    loading: false,
    type: 'button',
  },
  argTypes: {
    children: { control: 'text' },
    variant: { control: 'select', options: variants },
    size: { control: 'inline-radio', options: options.size.options },
    shape: { control: 'inline-radio', options: options.shape.options },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    type: { control: 'inline-radio', options: options.type.options },
    name: { control: 'text' },
    value: { control: 'text' },
    label: { control: 'text' },
    loadingLabel: { control: 'text' },
    leadingIcon: { control: 'select', options: iconOptions, mapping: iconNodes },
    trailingIcon: { control: 'select', options: iconOptions, mapping: iconNodes },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="sb-row">
      {variants.map((variant) => (
        <Button key={variant} {...args} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
};

export const Shapes: Story = {
  render: (args) => (
    <div className="sb-row">
      {options.shape.options.map((shape) => (
        <Button key={shape} {...args} shape={shape}>
          {shape}
        </Button>
      ))}
    </div>
  ),
};

export const WithIcons: Story = {
  args: { leadingIcon: 'iconCheck', trailingIcon: 'iconChevronRight' },
};

export const OnSurfaces: Story = { decorators: [onSurfaces], ...Variants };
