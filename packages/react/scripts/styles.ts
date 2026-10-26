/**
 * Joins the stylesheets of the components into the one stylesheet of the package. The
 * rules go into the cascade layer `components.ui-core`, after Tailwind's order of layers, so they
 * win over Tailwind's preflight and lose to its utilities, whichever is imported first.
 */
export interface Stylesheet {
  /** The path of the file inside `src`, which orders the stylesheets and names them in comments. */
  readonly path: string;
  readonly css: string;
}

export const LAYER_ORDER = '@layer theme, base, components, utilities;';

export function assembleStyles(sheets: readonly Stylesheet[]): string {
  const parts = [...sheets]
    .sort((a, b) => a.path.localeCompare(b.path, 'en'))
    .map(({ path, css }) => `/* ${path} */\n${css.trim()}\n`);
  return [
    '/* The styles of the React components of UI Core Library. Import them once, after the tokens. */',
    LAYER_ORDER,
    '',
    '@layer components.ui-core {',
    parts.join('\n'),
    '}',
    '',
  ].join('\n');
}
