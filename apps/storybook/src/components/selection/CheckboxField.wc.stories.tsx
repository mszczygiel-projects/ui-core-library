import '@mszczygiel-projects/ui-core-web-components/checkbox-field';

import {
  checkboxField,
  type CheckedChangeDetail,
  type ChoiceState,
} from '@mszczygiel-projects/ui-core-shared/checkbox-field';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { onSurfaces } from '../decorators.tsx';
import { htmlOf } from '../html.ts';

interface CheckboxFieldArgs {
  readonly label: string;
  readonly hint?: string;
  readonly checked: boolean;
  readonly indeterminate: boolean;
  readonly state: ChoiceState;
  readonly disabled: boolean;
  readonly required: boolean;
  readonly name?: string;
  readonly value?: string;
}

const { options } = checkboxField;

const TOPICS = ['News', 'Events', 'Offers'] as const;

function UiCheckboxField({
  onCheckedChange,
  ...args
}: CheckboxFieldArgs & {
  readonly onCheckedChange?: (event: CustomEvent<CheckedChangeDetail<Event>>) => void;
}) {
  return (
    <ui-checkbox-field
      label={args.label}
      hint={args.hint === '' ? undefined : args.hint}
      checked={args.checked}
      indeterminate={args.indeterminate}
      state={args.state}
      disabled={args.disabled}
      required={args.required}
      name={args.name === '' ? undefined : args.name}
      value={args.value === '' || args.value === undefined ? 'on' : args.value}
      onui-checked-change={onCheckedChange}
    />
  );
}

const source = (args: CheckboxFieldArgs) =>
  htmlOf('ui-checkbox-field', {
    label: args.label,
    hint: args.hint,
    checked: args.checked,
    indeterminate: args.indeterminate,
    state: args.state === options.state.default ? undefined : args.state,
    disabled: args.disabled,
    required: args.required,
    name: args.name,
    value: args.value,
  });

const meta = {
  title: 'Components/Selection/CheckboxField/Web Component',
  tags: ['!manifest'],
  args: {
    label: 'Email me about new events',
    checked: false,
    indeterminate: false,
    state: options.state.default,
    disabled: false,
    required: false,
  },
  argTypes: {
    label: { control: 'text' },
    hint: { control: 'text' },
    checked: { control: 'boolean' },
    indeterminate: { control: 'boolean' },
    state: { control: 'inline-radio', options: options.state.options },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    name: { control: 'text' },
    value: { control: 'text' },
  },
  render: (args) => <UiCheckboxField {...args} />,
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: CheckboxFieldArgs }) => source(args),
      },
    },
  },
} satisfies Meta<CheckboxFieldArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const States: Story = {
  render: (args) => (
    <div className="sb-stack">
      <UiCheckboxField {...args} label="Clear" />
      <UiCheckboxField {...args} label="Checked" checked />
      <UiCheckboxField {...args} label="Mixed" indeterminate />
      <UiCheckboxField {...args} label="Error" state="error" hint="Accept the terms to go on" />
      <UiCheckboxField {...args} label="Disabled" disabled />
      <UiCheckboxField {...args} label="Disabled and checked" disabled checked />
    </div>
  ),
};

export const Indeterminate: Story = {
  render: function Render(args) {
    const [chosen, setChosen] = useState<readonly string[]>(['News']);
    const all = chosen.length === TOPICS.length;
    return (
      <div className="sb-stack" role="group" aria-label="Topics">
        <UiCheckboxField
          {...args}
          label="All topics"
          checked={all}
          indeterminate={chosen.length > 0 && !all}
          onCheckedChange={({ detail }) => {
            setChosen(detail.value ? TOPICS : []);
          }}
        />
        {TOPICS.map((topic) => (
          <UiCheckboxField
            key={topic}
            {...args}
            label={topic}
            indeterminate={false}
            checked={chosen.includes(topic)}
            onCheckedChange={({ detail }) => {
              setChosen((current) =>
                detail.value ? [...current, topic] : current.filter((item) => item !== topic),
              );
            }}
          />
        ))}
      </div>
    );
  },
};

export const OnSurfaces: Story = { decorators: [onSurfaces], ...States };
