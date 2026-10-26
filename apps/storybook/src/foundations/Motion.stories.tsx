import type { Meta, StoryObj } from '@storybook/react-vite';

import { TokenTable } from '../blocks/TokenTable.tsx';
import { specimen } from './pages.ts';
import { tokensOfSpecimen } from './specimens.ts';

const meta = {
  title: 'Foundations/Motion',
  tags: ['!manifest'],
} satisfies Meta;

export default meta;

export const Durations: StoryObj = {
  render: () => <TokenTable tokens={tokensOfSpecimen(specimen('Motion', 'Durations'))} />,
};

export const Easings: StoryObj = {
  render: () => <TokenTable tokens={tokensOfSpecimen(specimen('Motion', 'Easings'))} />,
};
