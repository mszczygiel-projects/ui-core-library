import type { Meta, StoryObj } from '@storybook/react-vite';

import { RadiusScale } from '../blocks/Scales.tsx';
import { TokenTable } from '../blocks/TokenTable.tsx';
import { specimen } from './pages.ts';
import { tokensOfSpecimen } from './specimens.ts';

const meta = {
  title: 'Foundations/Radius & strokes',
  tags: ['!manifest'],
} satisfies Meta;

export default meta;

export const Shape: StoryObj = {
  render: () => <RadiusScale tokens={tokensOfSpecimen(specimen('Radius & strokes', 'Shape'))} />,
};

export const Strokes: StoryObj = {
  render: () => <TokenTable tokens={tokensOfSpecimen(specimen('Radius & strokes', 'Strokes'))} />,
};
