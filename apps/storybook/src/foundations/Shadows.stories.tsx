import type { Meta, StoryObj } from '@storybook/react-vite';

import { ShadowScale } from '../blocks/Scales.tsx';
import { TokenTable } from '../blocks/TokenTable.tsx';
import { manifest } from '../manifest.ts';
import { specimen } from './pages.ts';
import { contextsOf, tokensOfSpecimen } from './specimens.ts';

const meta = {
  title: 'Foundations/Shadows',
  tags: ['!manifest'],
} satisfies Meta;

export default meta;

export const Composites: StoryObj = {
  render: () => <ShadowScale shadows={manifest.shadows} />,
};

const roles = specimen('Shadows', 'Roles');

export const Roles: StoryObj = {
  render: () => (
    <TokenTable
      tokens={tokensOfSpecimen(roles)}
      contexts={contextsOf(roles.axis)}
      preview={(name) => (
        <span
          className="sb-shadow"
          style={{ boxShadow: `var(${name}) var(--color-shadow-default)` }}
        />
      )}
    />
  ),
};
