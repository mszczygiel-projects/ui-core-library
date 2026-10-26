import { afterEach, expect, inject } from 'vitest';

declare module 'vitest' {
  export interface ProvidedContext {
    expectedTheme: string;
  }
}

// Check the actual rendered context, not just the configuration passed to the plugin.
afterEach(() => {
  expect(document.documentElement.dataset['theme']).toBe(inject('expectedTheme'));
});
