import { createElement, type ComponentType } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import './number-field.js';

const meta: Meta = {
  title: 'Web Components/NumberField',
  // Tag-name string routes autodocs to the CEM extractor (see .storybook/preview.ts).
  component: 'ui-number-field' as unknown as ComponentType,
  argTypes: {
    variant: { control: 'select', options: ['outline', 'filled', 'underlined'] },
    size: { control: 'select', options: ['small', 'default', 'large'] },
    controls: { control: 'select', options: ['none', 'inline'] },
    state: { control: 'select', options: ['default', 'success', 'error', 'disabled'] },
    labelPlacement: { control: 'select', options: ['top', 'floating', 'inner'] },
    label: { control: 'text' },
    hint: { control: 'text' },
    placeholder: { control: 'text' },
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    precision: { control: 'number' },
    value: { control: 'number' },
    disabled: { control: 'boolean' },
    readonly: { control: 'boolean' },
  },
  args: {
    variant: 'outline',
    size: 'default',
    controls: 'none',
    state: 'default',
    labelPlacement: 'top',
    label: 'Quantity',
    hint: 'Between 1 and 99',
    min: 1,
    max: 99,
    step: 1,
    precision: 0,
    disabled: false,
    readonly: false,
  },
};

export default meta;
type Story = StoryObj;

type NumberFieldArgs = {
  variant?: string;
  size?: string;
  controls?: string;
  state?: string;
  labelPlacement?: string;
  label?: string;
  hint?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  value?: number;
  disabled?: boolean;
  readonly?: boolean;
};

const field = (props: NumberFieldArgs = {}) =>
  createElement('ui-number-field', {
    variant: props.variant,
    'data-size': props.size,
    controls: props.controls,
    state: props.state,
    'label-placement': props.labelPlacement,
    label: props.label,
    hint: props.hint,
    placeholder: props.placeholder,
    min: props.min,
    max: props.max,
    step: props.step,
    precision: props.precision,
    value: props.value,
    disabled: props.disabled || undefined,
    readonly: props.readonly || undefined,
  });

export const Default: Story = {
  render: (args: NumberFieldArgs) => field(args),
};

export const InlineControls: Story = {
  args: { controls: 'inline', value: 12 },
  render: (args: NumberFieldArgs) => field(args),
};

/** No label and no hint — the component renders as a bare input with no chrome. */
export const Bare: Story = {
  args: { controls: 'inline', label: undefined, hint: undefined, value: 1 },
  render: (args: NumberFieldArgs) => field(args),
};

export const Sizes: Story = {
  args: { controls: 'inline', value: 12 },
  render: (args: NumberFieldArgs) =>
    createElement(
      'div',
      { style: { display: 'grid', gap: 16, justifyItems: 'start' } },
      ...['small', 'default', 'large'].map((size) =>
        field({ ...args, size, label: size, key: size } as NumberFieldArgs),
      ),
    ),
};

export const Variants: Story = {
  args: { controls: 'inline', value: 12 },
  render: (args: NumberFieldArgs) =>
    createElement(
      'div',
      { style: { display: 'grid', gap: 16, justifyItems: 'start' } },
      ...['outline', 'filled', 'underlined'].map((variant) =>
        field({ ...args, variant, label: variant, key: variant } as NumberFieldArgs),
      ),
    ),
};

export const States: Story = {
  args: { controls: 'inline', value: 12 },
  render: (args: NumberFieldArgs) =>
    createElement(
      'div',
      { style: { display: 'grid', gap: 16, justifyItems: 'start' } },
      ...['default', 'success', 'error', 'disabled'].map((state) =>
        field({ ...args, state, label: state, key: state } as NumberFieldArgs),
      ),
    ),
};

/** `precision` allows decimals; typing "1." mid-edit is not fought, only rounded on commit. */
export const Decimals: Story = {
  args: {
    controls: 'inline',
    precision: 2,
    step: 0.1,
    min: 0,
    max: 10,
    value: 2.5,
    label: 'Weight (kg)',
    hint: 'Two decimal places',
  },
  render: (args: NumberFieldArgs) => field(args),
};

export const OnSurfaces: Story = {
  args: { controls: 'inline', value: 12 },
  render: (args: NumberFieldArgs) =>
    createElement(
      'div',
      { style: { display: 'grid', gap: 16 } },
      ...[undefined, 'subtle', 'inverse', 'primary'].map((surface) =>
        createElement(
          'div',
          {
            key: surface ?? 'default',
            'data-surface': surface,
            style: { padding: 16, backgroundColor: 'var(--color-background-default)' },
          },
          field(args),
        ),
      ),
    ),
};
