import '@mszczygiel-projects/ui-core-web-components/loader';

import { loader, type LoaderSize } from '@mszczygiel-projects/ui-core-shared/loader';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { expectGraphicContrast } from '../checks.ts';
import { onSurfaces } from '../decorators.tsx';
import { htmlOf } from '../html.ts';

interface LoaderArgs {
  readonly size: LoaderSize;
  readonly label?: string;
}

const { options } = loader;

/** The HTML of a loader, which the code panel shows. */
const source = ({ size, label }: LoaderArgs) =>
  htmlOf('ui-loader', { size: size === options.size.default ? undefined : size, label });

const meta = {
  title: 'Components/Feedback/Loader/Web Component',
  // The manifest of Storybook covers React components; the web components have their own.
  tags: ['!manifest'],
  args: { size: options.size.default },
  argTypes: {
    size: { control: 'inline-radio', options: options.size.options },
    label: { control: 'text' },
  },
  render: ({ size, label }) => <ui-loader size={size} label={label === '' ? undefined : label} />,
  parameters: {
    docs: {
      source: {
        language: 'html',
        transform: (_code: string, { args }: { args: LoaderArgs }) => source(args),
      },
    },
  },
} satisfies Meta<LoaderArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const OnSurfaces: Story = {
  // The frames come from a decorator, so that the code of the story shows the loader alone.
  decorators: [onSurfaces],
  play: async ({ canvasElement }) => {
    await expectGraphicContrast(canvasElement, 'ui-loader');
  },
};
