import type { Preview } from '@storybook/react-vite';
import '@mszczygiel-projects/ui-core-foundations/fonts/default.css';
import '@mszczygiel-projects/ui-core-foundations/tokens.css';
import '@mszczygiel-projects/ui-core-foundations/base.css';

const FALLBACK_BG = '#ffffff';

const SURFACE_ATTR: Record<string, string | null> = {
  default: null,
  subtle: 'subtle',
  inverse: 'inverse',
  primary: 'primary',
};

const preview: Preview = {
  decorators: [
    (Story, context) => {
      if (typeof document === 'undefined') return Story();

      const backgroundValue = context.globals?.backgrounds?.value as string | undefined;
      const surface =
        backgroundValue && backgroundValue in SURFACE_ATTR ? backgroundValue : 'default';
      const body = document.body;
      const storybookRoot = document.getElementById('storybook-root');

      if (!body) return Story();

      // Storybook applies canvas padding to body; move it to the root to avoid surface conflicts.
      body.style.padding = '0';
      body.removeAttribute('data-surface');

      if (storybookRoot) {
        storybookRoot.style.padding = '1rem';
        storybookRoot.style.minHeight = '100vh';

        const attr = SURFACE_ATTR[surface] ?? null;
        if (attr === null) storybookRoot.removeAttribute('data-surface');
        else storybookRoot.setAttribute('data-surface', attr);

        const rootBackground = getComputedStyle(storybookRoot)
          .getPropertyValue('--color-background-default')
          .trim();
        storybookRoot.style.backgroundColor = rootBackground || FALLBACK_BG;
      }

      return Story();
    },
  ],
  globalTypes: {},
  parameters: {
    backgrounds: {
      default: 'default',
      options: {
        default: { name: 'default', value: 'default' },
        subtle: { name: 'subtle', value: 'subtle' },
        inverse: { name: 'inverse', value: 'inverse' },
        primary: { name: 'brand-primary', value: 'primary' },
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /date$/i,
      },
    },
  },
};

export default preview;
