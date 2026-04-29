import type { Preview } from '@storybook/react-vite';
import '@ui-core/foundations/fonts/default.css';
import '@ui-core/foundations/tokens.css';
import '@ui-core/foundations/base.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /date$/i,
      },
    },
  },
};

export default preview;
