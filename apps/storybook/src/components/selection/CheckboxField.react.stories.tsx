import { CheckboxField } from '@mszczygiel-projects/ui-core-react';
import { checkboxField } from '@mszczygiel-projects/ui-core-shared/checkbox-field';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { onSurfaces } from '../decorators.tsx';

const { options } = checkboxField;

const TOPICS = ['News', 'Events', 'Offers'] as const;

const meta = {
  title: 'Components/Selection/CheckboxField/React',
  component: CheckboxField,
  args: {
    label: 'Email me about new events',
    state: options.state.default,
    indeterminate: false,
    disabled: false,
    required: false,
  },
  argTypes: {
    label: { control: 'text' },
    hint: { control: 'text' },
    defaultChecked: { control: 'boolean' },
    indeterminate: { control: 'boolean' },
    state: { control: 'inline-radio', options: options.state.options },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    name: { control: 'text' },
    value: { control: 'text' },
  },
} satisfies Meta<typeof CheckboxField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const States: Story = {
  render: (args) => (
    <div className="sb-stack">
      <CheckboxField {...args} label="Clear" />
      <CheckboxField {...args} label="Checked" defaultChecked />
      <CheckboxField {...args} label="Mixed" indeterminate />
      <CheckboxField {...args} label="Error" state="error" hint="Accept the terms to go on" />
      <CheckboxField {...args} label="Disabled" disabled />
      <CheckboxField {...args} label="Disabled and checked" disabled defaultChecked />
    </div>
  ),
};

export const Indeterminate: Story = {
  render: function Render(args) {
    const [chosen, setChosen] = useState<readonly string[]>(['News']);
    const all = chosen.length === TOPICS.length;
    return (
      <div className="sb-stack" role="group" aria-label="Topics">
        <CheckboxField
          {...args}
          label="All topics"
          checked={all}
          indeterminate={chosen.length > 0 && !all}
          onCheckedChange={(checked) => {
            setChosen(checked ? TOPICS : []);
          }}
        />
        {TOPICS.map((topic) => (
          <CheckboxField
            key={topic}
            {...args}
            label={topic}
            indeterminate={false}
            checked={chosen.includes(topic)}
            onCheckedChange={(checked) => {
              setChosen((current) =>
                checked ? [...current, topic] : current.filter((item) => item !== topic),
              );
            }}
          />
        ))}
      </div>
    );
  },
};

export const OnSurfaces: Story = { decorators: [onSurfaces], ...States };
