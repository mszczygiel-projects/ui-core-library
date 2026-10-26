import type { Meta, StoryObj } from '@storybook/react-vite';

import { Palette } from '../blocks/Palette.tsx';
import { Swatch, TokenTable } from '../blocks/TokenTable.tsx';
import { specimen } from './pages.ts';
import { contextsOf, tokensOfGroup } from './specimens.ts';

const meta = {
  title: 'Foundations/Colors',
  // The specimens show tokens, not components, so the manifest of components leaves them out.
  tags: ['!manifest'],
} satisfies Meta;

export default meta;

const roles = specimen('Colors', 'Roles');

export const Roles: StoryObj = {
  render: () => (
    <div className="sb-blocks">
      {roles.groups.map((group) => (
        <TokenTable
          key={group.prefix}
          caption={group.caption}
          tokens={tokensOfGroup(group)}
          contexts={contextsOf(roles.axis)}
          preview={(name) => <Swatch name={name} />}
        />
      ))}
    </div>
  ),
};

const brandRamps = specimen('Colors', 'BrandRamps');

export const BrandRamps: StoryObj = {
  render: () => (
    <div className="sb-blocks">
      {brandRamps.groups.map((group) => (
        <Palette
          key={group.prefix}
          title={group.caption ?? group.prefix}
          tokens={tokensOfGroup(group)}
        />
      ))}
    </div>
  ),
};
