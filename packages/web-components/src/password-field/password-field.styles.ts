import { css } from 'lit';

export const passwordFieldStyles = css`
  .toggle {
    all: unset;
    box-sizing: border-box;
    cursor: pointer;
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    margin-inline-end: var(--_padding-inline);
    width: var(--_icon-size);
    height: var(--_icon-size);
    color: var(--_icon);
  }

  .toggle svg {
    display: inline-flex;
    width: var(--_icon-size);
    height: var(--_icon-size);
    color: inherit;
    flex-shrink: 0;
  }

  .field-wrapper:hover .toggle {
    color: var(--_icon-hover);
  }

  .field-wrapper:focus-within .toggle {
    color: var(--_icon-active);
  }

  .toggle:focus-visible {
    outline: var(--stroke-ring) var(--ring-style) var(--color-ring-default);
    outline-offset: var(--ring-offset);
    border-radius: var(--radius-sm);
  }

  :host([state='success']) .toggle {
    color: var(--_icon-success);
  }

  :host([state='error']) .toggle {
    color: var(--_icon-error);
  }

  :host([state='disabled']) .toggle,
  :host([disabled]) .toggle {
    color: var(--_icon-disabled);
    cursor: not-allowed;
    pointer-events: none;
  }
`;
