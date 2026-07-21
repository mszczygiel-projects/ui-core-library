import { createElement, type ComponentType, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { svgMap } from '@mszczygiel-projects/ui-core-icons';
import './switch-field.js';

const meta: Meta = {
  title: 'Web Components/SwitchField',
  // Tag-name string routes autodocs to the CEM extractor (see .storybook/preview.ts).
  component: 'ui-switch-field' as unknown as ComponentType,
  argTypes: {
    state: {
      control: 'select',
      options: ['default', 'error', 'disabled'],
    },
    labelPosition: {
      control: 'inline-radio',
      options: ['left', 'right'],
    },
    label: { control: 'text' },
    description: { control: 'text' },
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    state: 'default',
    labelPosition: 'right',
    label: 'Email notifications',
    description: '',
    checked: false,
    disabled: false,
  },
};

export default meta;
type Story = StoryObj;

type SwitchArgs = {
  state?: string;
  labelPosition?: string;
  label?: string;
  description?: string;
  checked?: boolean;
  disabled?: boolean;
};

const slottedIcon = (name: keyof typeof svgMap, slot: string) =>
  createElement('span', {
    key: slot,
    slot,
    dangerouslySetInnerHTML: { __html: svgMap[name] },
  });

const field = (props: SwitchArgs = {}, children?: ReactNode) =>
  createElement(
    'ui-switch-field',
    {
      state: props.state,
      'label-position': props.labelPosition,
      label: props.label,
      description: props.description || undefined,
      checked: props.checked || undefined,
      disabled: props.disabled || undefined,
    },
    children,
  );

export const Default: Story = {
  args: {},
  render: (args: SwitchArgs) => field(args),
};

export const Checked: Story = {
  args: { checked: true },
  render: (args: SwitchArgs) => field(args),
};

export const WithDescription: Story = {
  args: { description: 'Receive notifications at your email address' },
  render: (args: SwitchArgs) => field(args),
};

export const LabelLeft: Story = {
  args: {
    labelPosition: 'left',
    description: 'Receive notifications at your email address',
  },
  render: (args: SwitchArgs) => createElement('div', { style: { width: 420 } }, field(args)),
};

export const WithIcons: Story = {
  args: {
    checked: true,
    description: 'The thumb shows a different glyph for each state',
  },
  render: (args: SwitchArgs) =>
    field(args, [slottedIcon('icon-eye', 'icon-on'), slottedIcon('icon-eye-slash', 'icon-off')]),
};

export const NoLabel: Story = {
  args: { label: '', description: '' },
  render: (args: SwitchArgs) => field(args),
};

export const Error: Story = {
  args: { state: 'error', description: 'This setting could not be saved.' },
  render: (args: SwitchArgs) => field(args),
};

export const Disabled: Story = {
  args: { state: 'disabled', description: 'Managed by your administrator' },
  render: (args: SwitchArgs) => field(args),
};

export const DisabledChecked: Story = {
  args: { state: 'disabled', checked: true, description: 'Managed by your administrator' },
  render: (args: SwitchArgs) => field(args),
};

export const OnSurfaces: Story = {
  render: () =>
    createElement(
      'div',
      { style: { display: 'flex', flexDirection: 'column' } },
      ['default', 'subtle', 'inverse', 'primary'].map((surface) =>
        createElement(
          'div',
          {
            key: surface,
            'data-surface': surface === 'default' ? undefined : surface,
            style: {
              backgroundColor: 'var(--color-background-default)',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            },
          },
          [
            field({ label: `${surface} / off` }),
            field({ label: `${surface} / on`, checked: true }),
          ],
        ),
      ),
    ),
};
