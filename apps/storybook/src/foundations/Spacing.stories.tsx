import type { Meta, StoryObj } from '@storybook/react-vite';

import { TokenTable } from '../blocks/TokenTable.tsx';
import { specimen } from './pages.ts';
import { contextsOf, tokensOfSpecimen } from './specimens.ts';

const meta = {
  title: 'Foundations/Spacing',
  tags: ['!manifest'],
} satisfies Meta;

export default meta;

const layout = specimen('Spacing', 'Layout');

export const Layout: StoryObj = {
  render: () => <TokenTable tokens={tokensOfSpecimen(layout)} contexts={contextsOf(layout.axis)} />,
};
