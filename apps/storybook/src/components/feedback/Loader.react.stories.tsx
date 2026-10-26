import { Loader } from '@mszczygiel-projects/ui-core-react';
import { loader } from '@mszczygiel-projects/ui-core-shared/loader';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { expectGraphicContrast } from '../checks.ts';
import { onSurfaces } from '../decorators.tsx';

const { options } = loader;

const meta = {
  title: 'Components/Feedback/Loader/React',
  component: Loader,
  args: { size: options.size.default },
  argTypes: {
    size: { control: 'inline-radio', options: options.size.options },
    label: { control: 'text' },
  },
} satisfies Meta<typeof Loader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const OnSurfaces: Story = {
  // The frames come from a decorator, so that the code of the story shows the loader alone.
  decorators: [onSurfaces],
  play: async ({ canvasElement }) => {
    await expectGraphicContrast(canvasElement, '.ui-loader');
  },
};
