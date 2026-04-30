import { css } from 'lit';

export const resetStyles = css`
  :host {
    box-sizing: border-box;
  }

  *,
  ::before,
  ::after {
    box-sizing: inherit;
  }
`;
