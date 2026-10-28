import '@mszczygiel-projects/ui-core-web-components/radio-field';
import '@mszczygiel-projects/ui-core-web-components/radio-group';

import type { Meta, StoryObj } from '@storybook/react-vite';

import { htmlOf } from '../html.ts';

interface RadioFieldArgs {
  readonly value: string;
  readonly label: string;
  readonly hint?: string;
  readonly disabled: boolean;
}

const source = (args: RadioFieldArgs) =>
  htmlOf(
    'ui-radio-group',
    { label: 'Delivery', value: 'express' },
    `${htmlOf('ui-radio-field', { value: 'standard', label: 'Standard' })}${htmlOf(
      'ui-radio-field',
      { value: args.value, label: args.label, hint: args.hint, disabled: args.disabled },
    )}`,
  );

const meta = {
  title: 'Components/Selection/RadioField/Web Component',
  tags: ['!manifest'],
  args: { value: 'express', label: 'Express', disabled: false },
  argTypes: {
    value: { control: 'text' },
    label: { control: 'text' },
    hint: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  render: (args) => (
    <ui-radio-group label="Delivery" value="express">
      <ui-radio-field value="standard" label="Standard" />
      <ui-radio-field
        value={args.value}
        label={args.label}
        hint={args.hint === '' ? undefined : args.hint}
        disabled={args.disabled}
      />
    </ui-radio-group>
  ),
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: RadioFieldArgs }) => source(args),
      },
    },
  },
} satisfies Meta<RadioFieldArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithHint: Story = { args: { hint: 'Next working day' } };

export const Disabled: Story = { args: { disabled: true } };
