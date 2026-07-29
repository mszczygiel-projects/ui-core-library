import type { Meta, StoryObj } from '@storybook/react';
import { IconEye, IconEyeSlash } from '@mszczygiel-projects/ui-core-icons/react';
import { SwitchField } from './SwitchField.js';

const meta: Meta<typeof SwitchField> = {
  title: 'React/SwitchField',
  component: SwitchField,
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
    checked: false,
  },
};

export default meta;
type Story = StoryObj<typeof SwitchField>;

export const Default: Story = {};

export const Checked: Story = {
  args: { checked: true },
};

export const WithDescription: Story = {
  args: { description: 'Receive notifications at your email address' },
};

export const LabelLeft: Story = {
  args: {
    labelPosition: 'left',
    description: 'Receive notifications at your email address',
  },
  parameters: {
    docs: {
      description: {
        story:
          'The settings-row layout: the text block fills the available width and pushes the switch to the trailing edge.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 420 }}>
        <Story />
      </div>
    ),
  ],
};

export const WithIcons: Story = {
  args: {
    checked: true,
    description: 'The thumb shows a different glyph for each state',
    iconOn: <IconEye />,
    iconOff: <IconEyeSlash />,
  },
};

export const LabelOnly: Story = {
  args: { label: 'Email notifications', description: undefined },
};

export const NoLabel: Story = {
  args: { label: undefined, description: undefined },
};

export const Error: Story = {
  args: { state: 'error', description: 'This setting could not be saved.' },
};

export const Disabled: Story = {
  args: { state: 'disabled', description: 'Managed by your administrator' },
};

export const DisabledChecked: Story = {
  args: { state: 'disabled', checked: true, description: 'Managed by your administrator' },
};

export const AllStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {(['default', 'error', 'disabled'] as const).map((state) =>
        [false, true].map((checked) => (
          <SwitchField
            key={`${state}-${checked}`}
            state={state}
            checked={checked}
            label={`${state} / ${checked ? 'on' : 'off'}`}
          />
        )),
      )}
    </div>
  ),
};

export const OnSurfaces: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {(['default', 'subtle', 'inverse', 'primary'] as const).map((surface) => (
        <div
          key={surface}
          data-surface={surface === 'default' ? undefined : surface}
          style={{
            backgroundColor: 'var(--color-background-default)',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <SwitchField label={`${surface} / off`} />
          <SwitchField label={`${surface} / on`} checked />
        </div>
      ))}
    </div>
  ),
};
