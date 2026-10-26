import type { Meta, StoryObj } from '@storybook/react-vite';

import { TextStyles } from '../blocks/TextStyles.tsx';
import { TokenTable } from '../blocks/TokenTable.tsx';
import { specimen } from './pages.ts';
import { tokensOfSpecimen } from './specimens.ts';

const meta = {
  title: 'Foundations/Typography',
  tags: ['!manifest'],
} satisfies Meta;

export default meta;

export const Styles: StoryObj = {
  render: () => <TextStyles />,
};

export const Fonts: StoryObj = {
  render: () => (
    <TokenTable
      tokens={tokensOfSpecimen(specimen('Typography', 'Fonts'))}
      preview={(name) => (
        <span
          className="ui-text-heading-h3"
          style={
            name.includes('weight')
              ? { fontWeight: `var(${name})` }
              : { fontFamily: `var(${name})` }
          }
        >
          Ag
        </span>
      )}
    />
  ),
};

export const Links: StoryObj = {
  render: () => (
    <TokenTable
      tokens={tokensOfSpecimen(specimen('Typography', 'Links'))}
      preview={(name) => (
        <span
          className="ui-text-body"
          style={{
            fontWeight: `var(${name})`,
            color: 'var(--color-link-default)',
            textDecorationLine: 'var(--typography-link-text-underline)',
          }}
        >
          Read the guide
        </span>
      )}
    />
  ),
};
