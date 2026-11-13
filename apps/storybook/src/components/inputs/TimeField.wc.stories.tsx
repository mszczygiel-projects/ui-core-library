import '@mszczygiel-projects/ui-core-web-components/time-field';

import { timeField, type TimeFieldProps } from '@mszczygiel-projects/ui-core-shared/time-field';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { onSurfaces } from '../decorators.tsx';
import { htmlOf } from '../html.ts';

const { options } = timeField;
function UiTimeField(args: TimeFieldProps) {
  return <ui-time-field {...args} />;
}
const source = (args: TimeFieldProps) =>
  htmlOf('ui-time-field', {
    label: args.label,
    hint: args.hint,
    name: args.name,
    value: args.value,
    min: args.min,
    max: args.max,
    variant: args.variant === 'outline' ? undefined : args.variant,
    size: args.size === 'medium' ? undefined : args.size,
    'label-placement': args.labelPlacement === 'top' ? undefined : args.labelPlacement,
    state: args.state === 'default' ? undefined : args.state,
    disabled: args.disabled,
    readonly: args.readOnly,
    required: args.required,
  });
const meta = {
  title: 'Components/Inputs/TimeField/Web Component',
  tags: ['!manifest'],
  args: { label: 'Start time', value: '09:30' },
  argTypes: {
    variant: { control: 'select', options: options.variant.options },
    size: { control: 'inline-radio', options: options.size.options },
    labelPlacement: { control: 'inline-radio', options: options.labelPlacement.options },
    state: { control: 'inline-radio', options: options.state.options },
  },
  render: (args) => <UiTimeField {...args} />,
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: TimeFieldProps }) => source(args),
      },
    },
  },
} satisfies Meta<TimeFieldProps>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
export const Variants: Story = {
  render: (args) => (
    <div className="sb-row">
      {options.variant.options.map((variant) => (
        <UiTimeField key={variant} {...args} variant={variant} />
      ))}
    </div>
  ),
};
export const WithConstraints: Story = {
  args: { min: '09:00', max: '17:00', hint: 'Choose a time between 09:00 and 17:00.' },
};
export const OnSurfaces: Story = { decorators: [onSurfaces], ...Variants };
