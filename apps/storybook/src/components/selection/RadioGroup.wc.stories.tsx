import '@mszczygiel-projects/ui-core-web-components/radio-field';
import '@mszczygiel-projects/ui-core-web-components/radio-group';

import type { ChoiceState } from '@mszczygiel-projects/ui-core-shared/checkbox-field';
import {
  radioGroup,
  type RadioGroupOrientation,
} from '@mszczygiel-projects/ui-core-shared/radio-group';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';

import { onSurfaces } from '../decorators.tsx';
import { htmlOf } from '../html.ts';

interface RadioGroupArgs {
  readonly label: string;
  readonly hint?: string;
  readonly orientation: RadioGroupOrientation;
  readonly state: ChoiceState;
  readonly value?: string;
  readonly disabled: boolean;
  readonly required: boolean;
  readonly name?: string;
}

const { options } = radioGroup;

const DELIVERY = [
  { value: 'standard', label: 'Standard', hint: 'Three to five days' },
  { value: 'express', label: 'Express', hint: 'Next working day' },
  { value: 'pickup', label: 'Pick up in store' },
] as const;

function UiRadioGroup({ children, ...args }: RadioGroupArgs & { readonly children?: ReactNode }) {
  return (
    <ui-radio-group
      label={args.label}
      hint={args.hint === '' ? undefined : args.hint}
      orientation={args.orientation}
      state={args.state}
      value={args.value}
      disabled={args.disabled}
      required={args.required}
      name={args.name === '' ? undefined : args.name}
    >
      {children ??
        DELIVERY.map((option) => (
          <ui-radio-field
            key={option.value}
            value={option.value}
            label={option.label}
            hint={'hint' in option ? option.hint : undefined}
          />
        ))}
    </ui-radio-group>
  );
}

const source = (args: RadioGroupArgs) =>
  htmlOf(
    'ui-radio-group',
    {
      label: args.label,
      hint: args.hint,
      orientation: args.orientation === options.orientation.default ? undefined : args.orientation,
      state: args.state === options.state.default ? undefined : args.state,
      value: args.value,
      disabled: args.disabled,
      required: args.required,
      name: args.name,
    },
    DELIVERY.map((option) =>
      htmlOf('ui-radio-field', {
        value: option.value,
        label: option.label,
        hint: 'hint' in option ? option.hint : undefined,
      }),
    ).join(''),
  );

const meta = {
  title: 'Components/Selection/RadioGroup/Web Component',
  tags: ['!manifest'],
  args: {
    label: 'Delivery',
    orientation: options.orientation.default,
    state: options.state.default,
    value: 'standard',
    disabled: false,
    required: false,
  },
  argTypes: {
    label: { control: 'text' },
    hint: { control: 'text' },
    orientation: { control: 'inline-radio', options: options.orientation.options },
    state: { control: 'inline-radio', options: options.state.options },
    value: { control: 'inline-radio', options: DELIVERY.map((option) => option.value) },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    name: { control: 'text' },
  },
  render: (args) => <UiRadioGroup {...args} />,
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: RadioGroupArgs }) => source(args),
      },
    },
  },
} satisfies Meta<RadioGroupArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Horizontal: Story = {
  args: { orientation: 'horizontal' },
  render: (args) => (
    <UiRadioGroup {...args} label="Size" value="m">
      {['S', 'M', 'L', 'XL'].map((size) => (
        <ui-radio-field key={size} value={size.toLowerCase()} label={size} />
      ))}
    </UiRadioGroup>
  ),
};

export const InForm: Story = {
  args: { name: 'delivery', required: true, value: undefined },
  render: (args) => (
    <form
      className="sb-stack"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <UiRadioGroup {...args} hint="Choose how the order reaches you" />
      <UiRadioGroup {...args} name="gift" label="Gift wrap" state="error" hint="Choose one">
        <ui-radio-field value="yes" label="Yes" />
        <ui-radio-field value="no" label="No" />
      </UiRadioGroup>
    </form>
  ),
};

export const WithDisabledOption: Story = {
  render: (args) => (
    <UiRadioGroup {...args}>
      {DELIVERY.map((option) => (
        <ui-radio-field
          key={option.value}
          value={option.value}
          label={option.label}
          hint={'hint' in option ? option.hint : undefined}
          disabled={option.value === 'pickup'}
        />
      ))}
    </UiRadioGroup>
  ),
};

export const OnSurfaces: Story = {
  decorators: [onSurfaces],
  render: (args) => (
    <div className="sb-stack">
      <UiRadioGroup {...args} />
      <UiRadioGroup {...args} label="Disabled" disabled>
        <ui-radio-field value="standard" label="Standard" />
      </UiRadioGroup>
    </div>
  ),
};
