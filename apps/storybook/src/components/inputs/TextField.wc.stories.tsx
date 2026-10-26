import '@mszczygiel-projects/ui-core-web-components/text-field';

import {
  textField,
  type TextFieldLabelPlacement,
  type TextFieldSize,
  type TextFieldState,
  type TextFieldType,
  type TextFieldVariant,
} from '@mszczygiel-projects/ui-core-shared/text-field';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { onSurfaces } from '../decorators.tsx';
import { htmlOf } from '../html.ts';
import { type IconName, iconOptions, svgMap } from '../icons.ts';

interface TextFieldArgs {
  readonly variant: TextFieldVariant;
  readonly size: TextFieldSize;
  readonly type: TextFieldType;
  readonly labelPlacement: TextFieldLabelPlacement;
  readonly state: TextFieldState;
  readonly label: string;
  readonly hint?: string;
  readonly placeholder?: string;
  readonly value?: string;
  readonly name?: string;
  readonly required: boolean;
  readonly disabled: boolean;
  readonly readOnly: boolean;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: string;
  readonly autoComplete?: string;
  readonly inputMode?: string;
  readonly enterKeyHint?: string;
  readonly leadingIcon?: IconName;
  readonly trailingIcon?: IconName;
}

const { options } = textField;

type IconSlot = 'leading-icon' | 'trailing-icon';

/** The icon of a slot, its SVG string inserted unescaped: only the icons package supplies it. */
function Icon({ slot, name }: { readonly slot: IconSlot; readonly name: IconName | undefined }) {
  return name === undefined ? null : (
    <span slot={slot} dangerouslySetInnerHTML={{ __html: svgMap[name] }} />
  );
}

function UiTextField({ value, ...args }: TextFieldArgs) {
  return (
    <ui-text-field
      value={value}
      variant={args.variant}
      size={args.size}
      type={args.type}
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
      pattern={args.pattern}
      autoComplete={args.autoComplete}
      inputmode={args.inputMode}
      enterkeyhint={args.enterKeyHint}
    >
      <Icon slot="leading-icon" name={args.leadingIcon} />
      <Icon slot="trailing-icon" name={args.trailingIcon} />
    </ui-text-field>
  );
}

const iconSource = (slot: IconSlot, name: IconName | undefined) =>
  name === undefined ? '' : `<span slot="${slot}">${svgMap[name]}</span>`;

const source = (args: TextFieldArgs) =>
  htmlOf(
    'ui-text-field',
    {
      variant: args.variant === options.variant.default ? undefined : args.variant,
      size: args.size === options.size.default ? undefined : args.size,
      type: args.type === options.type.default ? undefined : args.type,
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
      pattern: args.pattern,
      'auto-complete': args.autoComplete,
      inputmode: args.inputMode,
      enterkeyhint: args.enterKeyHint,
      disabled: args.disabled,
      readonly: args.readOnly,
      required: args.required,
    },
    `${iconSource('leading-icon', args.leadingIcon)}${iconSource('trailing-icon', args.trailingIcon)}`,
  );

const meta = {
  title: 'Components/Inputs/TextField/Web Component',
  tags: ['!manifest'],
  args: {
    label: 'Work email',
    hint: 'Use the address you sign in with',
    placeholder: 'name@example.com',
    variant: options.variant.default,
    size: options.size.default,
    labelPlacement: options.labelPlacement.default,
    state: options.state.default,
    type: 'email',
    disabled: false,
    readOnly: false,
    required: false,
  },
  argTypes: {
    label: { control: 'text' },
    hint: { control: 'text' },
    placeholder: { control: 'text' },
    variant: { control: 'select', options: options.variant.options },
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
    value: { control: 'text' },
    leadingIcon: { control: 'select', options: iconOptions },
    trailingIcon: { control: 'select', options: iconOptions },
  },
  render: (args) => <UiTextField {...args} />,
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: TextFieldArgs }) => source(args),
      },
    },
  },
} satisfies Meta<TextFieldArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="sb-row">
      {options.variant.options.map((variant) => (
        <UiTextField key={variant} {...args} variant={variant} />
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

export const WithIcons: Story = { args: { leadingIcon: 'iconUser', trailingIcon: 'iconInfo' } };

export const OnSurfaces: Story = { decorators: [onSurfaces], ...Variants };
