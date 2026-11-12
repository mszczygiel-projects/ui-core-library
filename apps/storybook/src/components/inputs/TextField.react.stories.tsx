import { TextField } from '@mszczygiel-projects/ui-core-react';
import { textField } from '@mszczygiel-projects/ui-core-shared/text-field';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { onSurfaces } from '../decorators.tsx';
import { iconOptions, svgMap } from '../icons.ts';

const { options } = textField;
const variants = options.variant.options;

const iconNodes = Object.fromEntries(
  iconOptions.map((name) => [
    name,
    <svg
      key={name}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: svgMap[name].replace(/^<svg[^>]*>|<\/svg>$/g, '') }}
    />,
  ]),
);

const meta = {
  title: 'Components/Inputs/TextField/React',
  component: TextField,
  args: {
    label: 'Work email',
    hint: 'Use the address you sign in with',
    placeholder: 'name@example.com',
    variant: 'outline',
    size: 'medium',
    labelPlacement: 'top',
    state: 'default',
    type: 'email',
    disabled: false,
    readOnly: false,
    required: false,
  },
  argTypes: {
    label: { control: 'text' },
    hint: { control: 'text' },
    labelHint: { control: 'text' },
    hideLabel: { control: 'boolean' },
    placeholder: { control: 'text' },
    variant: { control: 'select', options: variants },
    size: { control: 'inline-radio', options: options.size.options },
    labelPlacement: { control: 'inline-radio', options: options.labelPlacement.options },
    state: { control: 'inline-radio', options: options.state.options },
    type: { control: 'inline-radio', options: options.type.options },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    required: { control: 'boolean' },
    name: { control: 'text' },
    minLength: { control: 'number' },
    maxLength: { control: 'number' },
    pattern: { control: 'text' },
    autoComplete: { control: 'text' },
    inputMode: {
      control: 'select',
      options: ['none', 'text', 'tel', 'url', 'email', 'numeric', 'decimal', 'search'],
    },
    enterKeyHint: {
      control: 'select',
      options: ['enter', 'done', 'go', 'next', 'previous', 'search', 'send'],
    },
    spellCheck: { control: 'boolean' },

    defaultValue: { control: 'text' },
    value: { control: false },
    onValueChange: { control: false },
    leadingIcon: { control: 'select', options: iconOptions, mapping: iconNodes },
    trailingIcon: { control: 'select', options: iconOptions, mapping: iconNodes },
  },
} satisfies Meta<typeof TextField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="sb-row">
      {variants.map((variant) => (
        <TextField key={variant} {...args} variant={variant} />
      ))}
    </div>
  ),
};

export const HiddenLabel: Story = {
  args: {
    label: 'Discount code',
    placeholder: 'Discount code',
    hint: undefined,
    hideLabel: true,
    type: 'text',
  },
};

export const WithIcons: Story = { args: { leadingIcon: 'iconUser', trailingIcon: 'iconInfo' } };

export const OnSurfaces: Story = { decorators: [onSurfaces], ...Variants };
