import { createElement, type ComponentType, useRef, useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { svgMap } from '@mszczygiel-projects/ui-core-icons';
import type { SelectOption } from './select-field.js';
import './select-field.js';

const iconOptions = Object.keys(svgMap) as Array<keyof typeof svgMap>;

const FRUIT_OPTIONS: SelectOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'durian', label: 'Durian', disabled: true },
  { value: 'elderberry', label: 'Elderberry' },
];

type SelectFieldArgs = {
  variant?: string;
  size?: string;
  labelPlacement?: string;
  state?: string;
  label?: string;
  hint?: string;
  placeholder?: string;
  value?: string;
  clearable?: boolean;
  disabled?: boolean;
  options?: SelectOption[];
  leadingIcon?: keyof typeof svgMap | '';
};

const iconSpan = (name: keyof typeof svgMap) =>
  createElement('span', {
    slot: 'leading-icon',
    style: { display: 'inline-flex' },
    dangerouslySetInnerHTML: { __html: svgMap[name] },
  });

function SelectFieldWC(props: SelectFieldArgs) {
  const ref = useRef<HTMLElement & { options: SelectOption[] }>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.options = props.options ?? FRUIT_OPTIONS;
    }
  }, [props.options]);

  return createElement(
    'ui-select-field',
    {
      ref,
      variant: props.variant,
      'data-size': props.size,
      'label-placement': props.labelPlacement,
      state: props.state,
      label: props.label,
      hint: props.hint,
      placeholder: props.placeholder,
      value: props.value,
      clearable: props.clearable || undefined,
      disabled: props.disabled || undefined,
    },
    props.leadingIcon ? iconSpan(props.leadingIcon) : null,
  );
}

const meta: Meta<SelectFieldArgs> = {
  title: 'Web Components/SelectField',
  // Tag-name string routes autodocs to the CEM extractor (see .storybook/preview.ts);
  // rendering goes through the React wrapper so `.options` is set as a property.
  component: 'ui-select-field' as unknown as ComponentType,
  render: (args) => createElement(SelectFieldWC, args),
  argTypes: {
    variant: {
      control: 'select',
      options: ['outline', 'filled', 'underlined'],
    },
    size: {
      control: 'select',
      options: ['small', 'default', 'large'],
    },
    labelPlacement: {
      control: 'select',
      options: ['top', 'inner'],
    },
    state: {
      control: 'select',
      options: ['default', 'success', 'error', 'disabled'],
    },
    label: { control: 'text' },
    hint: { control: 'text' },
    placeholder: { control: 'text' },
    clearable: { control: 'boolean' },
    disabled: { control: 'boolean' },
    leadingIcon: {
      control: 'select',
      options: ['', ...iconOptions],
    },
  },
  args: {
    variant: 'outline',
    size: 'default',
    labelPlacement: 'top',
    state: 'default',
    label: 'Fruit',
    placeholder: 'Select option...',
    clearable: false,
    disabled: false,
    leadingIcon: '',
  },
};

export default meta;
type Story = StoryObj<SelectFieldArgs>;

export const Outline: Story = {
  args: {},
};

export const Filled: Story = {
  args: { variant: 'filled' },
};

export const Underlined: Story = {
  args: { variant: 'underlined' },
};

export const OutlineInnerLabel: Story = {
  args: { labelPlacement: 'inner' },
};

export const FilledInnerLabel: Story = {
  args: { variant: 'filled', labelPlacement: 'inner' },
};

export const UnderlinedInnerLabel: Story = {
  args: { variant: 'underlined', labelPlacement: 'inner' },
};

export const Clearable: Story = {
  args: { value: 'apple', clearable: true },
};
