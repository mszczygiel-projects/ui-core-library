import { iconStar } from '@mszczygiel-projects/ui-core-icons';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { IconGallery } from '../blocks/IconGallery.tsx';
import { TokenTable } from '../blocks/TokenTable.tsx';
import { specimen } from './pages.ts';
import { contextsOf, tokensOfSpecimen } from './specimens.ts';

const meta = {
  title: 'Foundations/Icons',
  tags: ['!manifest'],
} satisfies Meta;

export default meta;

export const Gallery: StoryObj = {
  render: () => <IconGallery />,
};

const sizes = specimen('Icons', 'Sizes');

export const Sizes: StoryObj = {
  render: () => (
    <TokenTable
      tokens={tokensOfSpecimen(sizes)}
      contexts={contextsOf(sizes.axis)}
      preview={(name) => (
        <span
          className="sb-icon"
          style={{ fontSize: `var(${name})` }}
          dangerouslySetInnerHTML={{ __html: iconStar }}
        />
      )}
    />
  ),
};
