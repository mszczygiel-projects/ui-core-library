// The renderer packages ship these preview-annotation entries without type
// declarations; preview.ts imports their docs extractors to route autodocs
// per story kind (React component vs custom-element tag name).

declare module '@storybook/react/entry-preview-argtypes' {
  import type { ArgTypes } from 'storybook/internal/types';

  export const parameters: {
    docs: {
      extractArgTypes: (component: unknown) => ArgTypes | null;
      extractComponentDescription: (component: unknown) => string | null;
    };
  };
}

declare module '@storybook/web-components/entry-preview-argtypes' {
  import type { ArgTypes } from 'storybook/internal/types';

  export const parameters: {
    docs: {
      extractArgTypes: (tagName: string) => ArgTypes | null;
      extractComponentDescription: (tagName: string) => string | null;
    };
  };
}
