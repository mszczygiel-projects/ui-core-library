import { createElement, type ComponentType, useRef, useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { svgMap } from '@mszczygiel-projects/ui-core-icons';
import type { SelectOption, SelectOptionGroup } from './select-field.js';
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
  options?: SelectOption[] | SelectOptionGroup[];
  placement?: string;
  leadingIcon?: keyof typeof svgMap | '';
};

const iconSpan = (name: keyof typeof svgMap) =>
  createElement('span', {
    slot: 'leading-icon',
    style: { display: 'inline-flex' },
    dangerouslySetInnerHTML: { __html: svgMap[name] },
  });

function SelectFieldWC(props: SelectFieldArgs) {
  const ref = useRef<HTMLElement & { options: SelectOption[] | SelectOptionGroup[] }>(null);

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
      placement: props.placement,
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
      options: ['top', 'inner', 'inline'],
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

export const InlineLabel: Story = {
  args: { labelPlacement: 'inline', label: 'Season', value: 'apple' },
};

/** Compact filter-bar row: label and value share one line. */
export const InlineLabelVariants: Story = {
  render: () =>
    createElement(
      'div',
      { style: { display: 'flex', gap: 24, alignItems: 'flex-start' } },
      ...['outline', 'filled', 'underlined'].map((variant) =>
        createElement(SelectFieldWC, {
          key: variant,
          variant,
          labelPlacement: 'inline',
          label: 'Season',
          value: 'apple',
        }),
      ),
    ),
};

const GROUPED_OPTIONS: SelectOptionGroup[] = [
  { label: 'Citrus', options: [{ value: 'lemon', label: 'Lemon' }] },
  {
    label: 'Berries',
    options: [
      { value: 'strawberry', label: 'Strawberry' },
      { value: 'raspberry', label: 'Raspberry' },
      { value: 'blueberry', label: 'Blueberry' },
    ],
  },
  {
    label: 'Stone fruit',
    options: [
      { value: 'peach', label: 'Peach' },
      { value: 'plum', label: 'Plum' },
    ],
  },
];

/** Group headers stick to the top of the panel while their group scrolls. */
export const GroupedOptions: Story = {
  args: { label: 'Fruit', options: GROUPED_OPTIONS },
};

/** A value set up front renders instead of the placeholder. */
export const WithDefaultValue: Story = {
  args: { label: 'Fruit', value: 'banana' },
};

/** The panel flips above the field when there is no room below. */
export const PlacementTop: Story = {
  args: { label: 'Fruit', placement: 'top-start' },
};

export const OnSurfaces: Story = {
  render: (args) =>
    createElement(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: 24 } },
      ...(['default', 'subtle', 'inverse', 'primary'] as const).map((surface) =>
        createElement(
          'div',
          {
            key: surface,
            'data-surface': surface === 'default' ? undefined : surface,
            style: { backgroundColor: 'var(--color-background-default)', padding: 16 },
          },
          createElement(SelectFieldWC, { ...args, label: 'Fruit', value: 'apple' }),
        ),
      ),
    ),
};
