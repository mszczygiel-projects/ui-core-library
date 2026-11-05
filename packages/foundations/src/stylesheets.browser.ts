/** The built stylesheets that the browser tests load. */
export type StylesheetName = 'tokens.css' | 'tailwind.css' | 'typography.css';

/** Whether a page imports tailwind.css after Tailwind, or tokens.css before it as well. */
export type TailwindOrder = 'tailwind-first' | 'tokens-first';

declare module 'vitest/browser' {
  interface BrowserCommands {
    readStylesheet: (name: StylesheetName) => Promise<string>;
    compileTailwind: (order: TailwindOrder, candidates: readonly string[]) => Promise<string>;
  }
}
