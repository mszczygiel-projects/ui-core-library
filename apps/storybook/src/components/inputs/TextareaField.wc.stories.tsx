import '@mszczygiel-projects/ui-core-web-components/textarea-field';

import type {
  TextFieldLabelPlacement,
  TextFieldSize,
  TextFieldState,
  TextFieldVariant,
} from '@mszczygiel-projects/ui-core-shared/text-field';
import {
  textareaField,
  type TextareaFieldResize,
} from '@mszczygiel-projects/ui-core-shared/textarea-field';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { onSurfaces } from '../decorators.tsx';
import { htmlOf } from '../html.ts';

interface TextareaFieldArgs {
  readonly variant: TextFieldVariant;
  readonly size: TextFieldSize;
  readonly labelPlacement: TextFieldLabelPlacement;
  readonly state: TextFieldState;
  readonly label?: string;
  readonly hint?: string;
  readonly placeholder?: string;
  readonly value?: string;
  readonly name?: string;
  readonly required: boolean;
  readonly disabled: boolean;
  readonly readOnly: boolean;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly autoComplete?: string;
  readonly resize: TextareaFieldResize;
  readonly maxRows?: number;
}

const { options } = textareaField;

function UiTextareaField(args: TextareaFieldArgs) {
  return (
    <ui-textarea-field
      value={args.value}
      variant={args.variant}
      size={args.size}
      labelPlacement={args.labelPlacement}
      state={args.state}
      label={args.label}
      hint={args.hint}
      placeholder={args.placeholder}
      name={args.name}
      required={args.required}
      disabled={args.disabled}
      readOnly={args.readOnly}
      minLength={args.minLength}
      maxLength={args.maxLength}
      autoComplete={args.autoComplete}
      resize={args.resize}
      maxRows={args.maxRows}
    />
  );
}

const source = (args: TextareaFieldArgs) =>
  htmlOf('ui-textarea-field', {
    variant: args.variant === options.variant.default ? undefined : args.variant,
    size: args.size === options.size.default ? undefined : args.size,
    'label-placement':
      args.labelPlacement === options.labelPlacement.default ? undefined : args.labelPlacement,
    state: args.state === options.state.default ? undefined : args.state,
    label: args.label,
    hint: args.hint,
    placeholder: args.placeholder,
    value: args.value,
    name: args.name,
    'min-length': args.minLength,
    'max-length': args.maxLength,
    'auto-complete': args.autoComplete,
    resize: args.resize === options.resize.default ? undefined : args.resize,
    'max-rows': args.maxRows,
    disabled: args.disabled,
    readonly: args.readOnly,
    required: args.required,
  });

const meta = {
  title: 'Components/Inputs/TextareaField/Web Component',
  tags: ['!manifest'],
  args: {
    label: 'Message',
    hint: 'Tell us what happened',
    variant: options.variant.default,
    size: options.size.default,
    labelPlacement: options.labelPlacement.default,
    state: options.state.default,
    disabled: false,
    readOnly: false,
    required: false,
    resize: options.resize.default,
  },
  argTypes: {
    label: { control: 'text' },
    hint: { control: 'text' },
    placeholder: { control: 'text' },
    variant: { control: 'select', options: options.variant.options },
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
    value: { control: 'text' },
    resize: { control: 'inline-radio', options: options.resize.options },
    maxRows: { control: 'number' },
  },
  render: (args) => <UiTextareaField {...args} />,
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: TextareaFieldArgs }) => source(args),
      },
    },
  },
} satisfies Meta<TextareaFieldArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="sb-row">
      {options.variant.options.map((variant) => (
        <UiTextareaField key={variant} {...args} variant={variant} />
      ))}
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: options.variant.options
          .map((variant) => source({ ...meta.args, variant }))
          .join('\n'),
      },
    },
  },
};

export const Resize: Story = {
  render: (args) => (
    <div className="sb-row">
      {options.resize.options.map((resize) => (
        <UiTextareaField
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
