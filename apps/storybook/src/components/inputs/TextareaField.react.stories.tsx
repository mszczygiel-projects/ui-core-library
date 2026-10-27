import { TextareaField } from '@mszczygiel-projects/ui-core-react';
import { textareaField } from '@mszczygiel-projects/ui-core-shared/textarea-field';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { onSurfaces } from '../decorators.tsx';

const { options } = textareaField;
const variants = options.variant.options;

const meta = {
  title: 'Components/Inputs/TextareaField/React',
  component: TextareaField,
  args: {
    label: 'Message',
    hint: 'Tell us what happened',
    variant: 'outline',
    size: 'medium',
    labelPlacement: 'top',
    state: 'default',
    resize: 'vertical',
    disabled: false,
    readOnly: false,
    required: false,
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
    resize: { control: 'inline-radio', options: options.resize.options },
    maxRows: { control: 'number' },
  },
} satisfies Meta<typeof TextareaField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="sb-row">
      {variants.map((variant) => (
        <TextareaField key={variant} {...args} variant={variant} />
      ))}
    </div>
  ),
};

export const Resize: Story = {
  render: (args) => (
    <div className="sb-row">
      {options.resize.options.map((resize) => (
        <TextareaField
          key={resize}
          {...args}
          label={`resize="${resize}"`}
          resize={resize}
          maxRows={resize === 'auto' ? 6 : undefined}
        />
      ))}
    </div>
  ),
};

export const OnSurfaces: Story = { decorators: [onSurfaces], ...Variants };
