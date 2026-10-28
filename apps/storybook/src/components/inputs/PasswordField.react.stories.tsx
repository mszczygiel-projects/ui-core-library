import { PasswordField } from '@mszczygiel-projects/ui-core-react';
import { passwordField } from '@mszczygiel-projects/ui-core-shared/password-field';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { onSurfaces } from '../decorators.tsx';

const { options } = passwordField;
const variants = options.variant.options;

const meta = {
  title: 'Components/Inputs/PasswordField/React',
  component: PasswordField,
  args: {
    label: 'Password',
    hint: 'At least 12 characters',
    variant: 'outline',
    size: 'medium',
    labelPlacement: 'top',
    state: 'default',
    autoComplete: 'current-password',
    disabled: false,
    readOnly: false,
    required: false,
    defaultRevealed: false,
  },
  argTypes: {
    label: { control: 'text' },
    hint: { control: 'text' },
    placeholder: { control: 'text' },
    variant: { control: 'select', options: variants },
    size: { control: 'inline-radio', options: options.size.options },
    labelPlacement: { control: 'inline-radio', options: options.labelPlacement.options },
    state: { control: 'inline-radio', options: options.state.options },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    required: { control: 'boolean' },
    name: { control: 'text' },
    minLength: { control: 'number' },
    maxLength: { control: 'number' },
    autoComplete: { control: 'text' },
    defaultValue: { control: 'text' },
    value: { control: false },
    onValueChange: { control: false },
    pattern: { control: 'text' },
    revealLabel: { control: 'text' },
    defaultRevealed: { control: 'boolean' },
    revealed: { control: false },
    onRevealedChange: { control: false },
  },
} satisfies Meta<typeof PasswordField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="sb-row">
      {variants.map((variant) => (
        <PasswordField key={variant} {...args} variant={variant} />
      ))}
    </div>
  ),
};

export const Revealed: Story = {
  args: { defaultValue: 'correct horse battery', defaultRevealed: true },
};

export const OnSurfaces: Story = { decorators: [onSurfaces], ...Variants };
