import '../src/styles.ts';

import type { Preview } from '@storybook/react-vite';

import { contextGlobals, withContext } from '../src/context.tsx';
import { manifest } from '../src/manifest.ts';
import { visualModes } from '../src/tokens.ts';

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
    // Chromatic takes a snapshot of every story in each of these modes.
    chromatic: { modes: visualModes(manifest.modes) },
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
          [
            'Getting started',
            'Configuration',
            'Custom tokens and icons',
            'Your design system in Figma',
            'SEO and server rendering',
          ],
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
          'Components',
          [
            'Status',
            'Actions',
            ['*', ['Docs', 'React', 'Web Component']],
            'Inputs',
            ['*', ['Docs', 'React', 'Web Component']],
            'Selection',
            ['*', ['Docs', 'React', 'Web Component']],
            'Feedback',
            ['*', ['Docs', 'React', 'Web Component']],
            'Navigation',
            ['*', ['Docs', 'React', 'Web Component']],
            'Content',
            ['*', ['Docs', 'React', 'Web Component']],
            'Overlays',
            ['*', ['Docs', 'React', 'Web Component']],
          ],
        ],
      },
    },
  },
};

export default preview;
