import { SwitchField } from '@mszczygiel-projects/ui-core-react';
import { switchField } from '@mszczygiel-projects/ui-core-shared/switch-field';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { onSurfaces } from '../decorators.tsx';
import { iconOptions, svgMap } from '../icons.ts';

const { options } = switchField;

/** Every icon as a node for the icon props, its SVG string from the icons package only. */
const iconNodes = Object.fromEntries(
  iconOptions.map((name) => [
    name,
    <span key={name} dangerouslySetInnerHTML={{ __html: svgMap[name] }} />,
  ]),
);

const meta = {
  title: 'Components/Selection/SwitchField/React',
  component: SwitchField,
  args: {
    label: 'Notifications',
    labelPosition: options.labelPosition.default,
    state: options.state.default,
    disabled: false,
  },
  argTypes: {
    label: { control: 'text' },
    hint: { control: 'text' },
    labelPosition: { control: 'inline-radio', options: options.labelPosition.options },
    defaultChecked: { control: 'boolean' },
    state: { control: 'inline-radio', options: options.state.options },
    disabled: { control: 'boolean' },
    iconOn: { control: 'select', options: iconOptions, mapping: iconNodes },
    iconOff: { control: 'select', options: iconOptions, mapping: iconNodes },
    name: { control: 'text' },
    value: { control: 'text' },
  },
} satisfies Meta<typeof SwitchField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const LabelPosition: Story = {
  render: (args) => (
    <div className="sb-stack" style={{ maxInlineSize: '24rem' }}>
      <SwitchField {...args} label="Label at the end" />
      <SwitchField
        {...args}
        label="Label at the start"
        hint="A row of settings puts the switch at its end"
        labelPosition="start"
        defaultChecked
      />
    </div>
  ),
};

export const WithIcons: Story = {
  args: { iconOn: 'iconCheckmark', iconOff: 'iconClose' },
};

export const OnSurfaces: Story = {
  decorators: [onSurfaces],
  render: (args) => (
    <div className="sb-stack">
      <SwitchField {...args} label="Off" />
      <SwitchField {...args} label="On" defaultChecked />
      <SwitchField {...args} label="Error" state="error" hint="Turn this on to continue" />
      <SwitchField {...args} label="Disabled" disabled defaultChecked />
    </div>
  ),
};
