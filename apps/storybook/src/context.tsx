import {
  configureUiCore,
  resetUiCoreConfig,
} from '@mszczygiel-projects/ui-core-foundations/config';
import type { Decorator, Preview } from '@storybook/react-vite';
import { type ReactNode, useLayoutEffect } from 'react';

import { frameworks } from './blocks/Framework.tsx';
import { manifest } from './manifest.ts';
import { pseudoLabels } from './pseudo.ts';
import { toolbarItems } from './tokens.ts';

const { modes } = manifest;

function chosen(value: unknown, fallback: string | undefined): string | undefined {
  return typeof value === 'string' ? value : fallback;
}

/**
 * The toolbars: one per context attribute with more than one mode. The modes come from the
 * manifest, so a brand or a theme added in Figma gets its toolbar item by itself.
 */
export function contextGlobals(): Pick<Preview, 'globalTypes' | 'initialGlobals'> {
  const axes = [
    { axis: 'brand', title: 'Brand', icon: 'paintbrush', modes: modes.brand },
    { axis: 'theme', title: 'Theme', icon: 'mirror', modes: modes.theme },
    { axis: 'surface', title: 'Surface', icon: 'contrast', modes: modes.surface },
    { axis: 'density', title: 'Density', icon: 'component', modes: modes.density },
  ] as const;
  const shown = axes.filter((entry) => entry.modes.length > 1);
  return {
    globalTypes: {
      ...Object.fromEntries(
        shown.map(({ axis, title, icon, modes: values }) => [
          axis,
          {
            description: `The ${axis} of the story`,
            toolbar: { title, icon, items: toolbarItems(values), dynamicTitle: true },
          },
        ]),
      ),
      // The framework of the code and the API on the pages of the components.
      framework: {
        description: 'The framework of the code and the API on component pages',
        toolbar: { title: 'Framework', icon: 'markup', items: [...frameworks], dynamicTitle: true },
      },
      // The labels of the components: English, or a pseudo-language that shows any text written
      // into a component, since such a text stays in English.
      language: {
        description: 'The language of the labels of the components',
        toolbar: {
          title: 'Language',
          icon: 'globe',
          items: [
            { value: 'en', title: 'English' },
            { value: 'pseudo', title: 'Pseudo-language' },
          ],
          dynamicTitle: true,
        },
      },
      direction: {
        description: 'The direction of the text',
        toolbar: {
          title: 'Direction',
          icon: 'transfer',
          items: [
            { value: 'ltr', title: 'Left to right' },
            { value: 'rtl', title: 'Right to left' },
          ],
          dynamicTitle: true,
        },
      },
    },
    initialGlobals: {
      ...Object.fromEntries(shown.map(({ axis, modes: values }) => [axis, values[0]])),
      framework: 'react',
      language: 'en',
      direction: 'ltr',
    },
  };
}

/** The labels of the language the toolbar chooses, for every component on the page. */
function Labels({
  language,
  children,
}: {
  readonly language: string | undefined;
  readonly children: ReactNode;
}) {
  useLayoutEffect(() => {
    if (language === 'pseudo') {
      configureUiCore({ labels: pseudoLabels });
    } else {
      resetUiCoreConfig();
    }
  }, [language]);
  return children;
}

/** Brand and theme belong on the root element, where the roles are declared. */
function RootAttributes({
  brand,
  theme,
  children,
}: {
  readonly brand: string | undefined;
  readonly theme: string | undefined;
  readonly children: ReactNode;
}) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    for (const [name, value] of [
      ['data-brand', brand],
      ['data-theme', theme],
    ] as const) {
      if (value === undefined) {
        root.removeAttribute(name);
      } else {
        root.setAttribute(name, value);
      }
    }
  }, [brand, theme]);
  return children;
}

/**
 * Puts every story in the context the toolbars choose: the brand and the theme on the root
 * element, the surface, the density and the direction on a frame around the story, painted with
 * its surface, and the labels of the language in the configuration.
 */
export const withContext: Decorator = (Story, { globals, viewMode }) => {
  // A single brand has no attribute, so the base brand is the page without one.
  const brand = modes.brand.length > 1 ? chosen(globals['brand'], undefined) : undefined;
  return (
    <RootAttributes brand={brand} theme={chosen(globals['theme'], modes.theme[0])}>
      <Labels language={chosen(globals['language'], undefined)}>
        <div
          className={viewMode === 'docs' ? 'sb-context sb-context--docs' : 'sb-context'}
          data-surface={chosen(globals['surface'], modes.surface[0])}
          data-density={chosen(globals['density'], modes.density[0])}
          dir={chosen(globals['direction'], 'ltr')}
        >
          <Story />
        </div>
      </Labels>
    </RootAttributes>
  );
};
