import { TimeField } from '@mszczygiel-projects/ui-core-react';
import { timeField } from '@mszczygiel-projects/ui-core-shared/time-field';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { onSurfaces } from '../decorators.tsx';

const { options } = timeField;
const meta = {
  title: 'Components/Inputs/TimeField/React',
  component: TimeField,
  args: { label: 'Start time', defaultValue: '09:30' },
  argTypes: {
    variant: { control: 'select', options: options.variant.options },
    size: { control: 'inline-radio', options: options.size.options },
    labelPlacement: { control: 'inline-radio', options: options.labelPlacement.options },
    state: { control: 'inline-radio', options: options.state.options },
  },
} satisfies Meta<typeof TimeField>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
export const Variants: Story = {
  render: (args) => (
    <div className="sb-row">
      {options.variant.options.map((variant) => (
        <TimeField key={variant} {...args} variant={variant} />
      ))}
    </div>
  ),
};
export const WithConstraints: Story = {
  args: { min: '09:00', max: '17:00', hint: 'Choose a time between 09:00 and 17:00.' },
};
export const OnSurfaces: Story = { decorators: [onSurfaces], ...Variants };
