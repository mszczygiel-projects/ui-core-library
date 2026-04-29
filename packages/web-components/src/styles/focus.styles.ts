import { css } from 'lit';

export const focusStyles = css`
  :host(:focus-visible) {
    outline: var(--stroke-ring) var(--ring-style) var(--color-ring-default);
    outline-offset: var(--ring-offset);
  }
`;
