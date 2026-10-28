import '@mszczygiel-projects/ui-core-web-components/switch-field';

import type { ChoiceState } from '@mszczygiel-projects/ui-core-shared/checkbox-field';
import {
  switchField,
  type SwitchFieldLabelPosition,
} from '@mszczygiel-projects/ui-core-shared/switch-field';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { onSurfaces } from '../decorators.tsx';
import { htmlOf } from '../html.ts';
import { type IconName, iconOptions, svgMap } from '../icons.ts';

interface SwitchFieldArgs {
  readonly label: string;
  readonly hint?: string;
  readonly labelPosition: SwitchFieldLabelPosition;
  readonly checked: boolean;
  readonly state: ChoiceState;
  readonly disabled: boolean;
  readonly iconOn?: IconName;
  readonly iconOff?: IconName;
  readonly name?: string;
  readonly value?: string;
}

const { options } = switchField;

/** The icon of a slot, its SVG string inserted unescaped: only the icons package supplies it. */
function Icon({ name, slot }: { readonly name: IconName | undefined; readonly slot: string }) {
  return name === undefined ? null : (
    <span slot={slot} dangerouslySetInnerHTML={{ __html: svgMap[name] }} />
  );
}

function UiSwitchField(args: SwitchFieldArgs) {
  return (
    <ui-switch-field
      label={args.label}
      hint={args.hint === '' ? undefined : args.hint}
      labelPosition={args.labelPosition}
      checked={args.checked}
      state={args.state}
      disabled={args.disabled}
      name={args.name === '' ? undefined : args.name}
      value={args.value === '' || args.value === undefined ? 'on' : args.value}
    >
      <Icon name={args.iconOn} slot="icon-on" />
      <Icon name={args.iconOff} slot="icon-off" />
    </ui-switch-field>
  );
}

const source = (args: SwitchFieldArgs) =>
  htmlOf(
    'ui-switch-field',
    {
      label: args.label,
      hint: args.hint,
      'label-position':
        args.labelPosition === options.labelPosition.default ? undefined : args.labelPosition,
      checked: args.checked,
      state: args.state === options.state.default ? undefined : args.state,
      disabled: args.disabled,
      name: args.name,
      value: args.value,
    },
    `${args.iconOn === undefined ? '' : `<span slot="icon-on">${svgMap[args.iconOn]}</span>`}${
      args.iconOff === undefined ? '' : `<span slot="icon-off">${svgMap[args.iconOff]}</span>`
    }`,
  );

const meta = {
  title: 'Components/Selection/SwitchField/Web Component',
  tags: ['!manifest'],
  args: {
    label: 'Notifications',
    labelPosition: options.labelPosition.default,
    checked: false,
    state: options.state.default,
    disabled: false,
  },
  argTypes: {
    label: { control: 'text' },
    hint: { control: 'text' },
    labelPosition: { control: 'inline-radio', options: options.labelPosition.options },
    checked: { control: 'boolean' },
    state: { control: 'inline-radio', options: options.state.options },
    disabled: { control: 'boolean' },
    iconOn: { control: 'select', options: iconOptions },
    iconOff: { control: 'select', options: iconOptions },
    name: { control: 'text' },
    value: { control: 'text' },
  },
  render: (args) => <UiSwitchField {...args} />,
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: SwitchFieldArgs }) => source(args),
      },
    },
  },
} satisfies Meta<SwitchFieldArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const LabelPosition: Story = {
  render: (args) => (
    <div className="sb-stack" style={{ maxInlineSize: '24rem' }}>
      <UiSwitchField {...args} label="Label at the end" />
      <UiSwitchField
        {...args}
        label="Label at the start"
        hint="A row of settings puts the switch at its end"
        labelPosition="start"
        checked
      />
    </div>
  ),
};

export const WithIcons: Story = { args: { iconOn: 'iconCheckmark', iconOff: 'iconClose' } };

export const OnSurfaces: Story = {
  decorators: [onSurfaces],
  render: (args) => (
    <div className="sb-stack">
      <UiSwitchField {...args} label="Off" />
      <UiSwitchField {...args} label="On" checked />
      <UiSwitchField {...args} label="Error" state="error" hint="Turn this on to continue" />
      <UiSwitchField {...args} label="Disabled" disabled checked />
    </div>
  ),
};
