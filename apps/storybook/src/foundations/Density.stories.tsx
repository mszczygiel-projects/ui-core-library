import type { Meta, StoryObj } from '@storybook/react-vite';

import { TokenTable } from '../blocks/TokenTable.tsx';
import { specimen } from './pages.ts';
import { contextsOf, tokensOfSpecimen } from './specimens.ts';

const meta = {
  title: 'Foundations/Density',
  tags: ['!manifest'],
} satisfies Meta;

export default meta;

const comparison = specimen('Density', 'Comparison');

export const Comparison: StoryObj = {
  render: () => (
    <TokenTable
      tokens={tokensOfSpecimen(comparison)}
      contexts={contextsOf(comparison.axis)}
      preview={(name) => <span className="sb-bar" style={{ inlineSize: `var(${name})` }} />}
    />
  ),
};
