import '../src/styles.ts';

import type { Preview } from '@storybook/react-vite';

import { contextGlobals, withContext } from '../src/context.tsx';
import { manifest } from '../src/manifest.ts';

/**
 * Storybook reads `storySort` from the text of this file when it builds the index, before any
 * code runs, so the order of the pages has to be written here, inline.
 */
const preview: Preview = {
  ...contextGlobals(),
  decorators: [withContext],
  parameters: {
    // The frame of withContext pads the story, so it can paint the whole canvas.
    layout: 'fullscreen',
    // Violations fail every browser story in the quality gate.
    a11y: { test: 'error' },
    viewport: {
      options: {
        mobile: { name: 'Mobile', styles: { width: '390px', height: '844px' }, type: 'mobile' },
        desktop: {
          name: 'Desktop',
          styles: { width: manifest.breakpoint, height: '800px' },
          type: 'desktop',
        },
      },
    },
    options: {
      storySort: {
        order: [
          'Guides',
          ['Getting started', 'Custom tokens and icons'],
          'Foundations',
          [
            'Overview',
            'Colors',
            'Surfaces & themes',
            'Typography',
            'Spacing',
            'Density',
            'Radius & strokes',
            'Shadows',
            'Motion',
            'Icons',
            'Theming & branding',
          ],
        ],
      },
    },
  },
};

export default preview;
