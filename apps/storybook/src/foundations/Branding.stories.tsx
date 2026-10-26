import type { Meta, StoryObj } from '@storybook/react-vite';

import { TokenTable } from '../blocks/TokenTable.tsx';
import { specimen } from './pages.ts';
import { tokensOfSpecimen } from './specimens.ts';

const meta = {
  title: 'Foundations/Theming & branding',
  tags: ['!manifest'],
} satisfies Meta;

export default meta;

export const BrandValues: StoryObj = {
  name: 'Brand values',
  render: () => (
    <TokenTable tokens={tokensOfSpecimen(specimen('Theming & branding', 'BrandValues'))} />
  ),
};
