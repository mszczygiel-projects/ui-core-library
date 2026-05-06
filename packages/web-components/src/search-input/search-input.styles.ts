import { css } from 'lit';

export const searchInputStyles = css`
  /* Suppress browser-native search clear button */
  .input::-webkit-search-cancel-button {
    -webkit-appearance: none;
  }

  /* Search icon SVG sizing (directly rendered, not slotted) */
  .icon--leading svg {
    display: inline-flex;
    flex-shrink: 0;
    width: var(--_icon-size);
    height: var(--_icon-size);
    color: inherit;
  }

  /* Clear button */
  .clear {
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

  .clear svg {
    display: inline-flex;
    flex-shrink: 0;
    width: var(--_icon-size);
    height: var(--_icon-size);
    color: inherit;
  }

  /* Hidden when no value — layout preserved via visibility */
  :host([value='']) .clear {
    visibility: hidden;
    pointer-events: none;
  }

  .field-wrapper:hover .clear {
    color: var(--_icon-hover);
  }

  .field-wrapper:focus-within .clear {
    color: var(--_icon-active);
  }

  :host([state='success']) .clear {
    color: var(--_icon-success);
  }

  :host([state='error']) .clear {
    color: var(--_icon-error);
  }

  :host([state='disabled']) .clear,
  :host([disabled]) .clear {
    color: var(--_icon-disabled);
    cursor: not-allowed;
    pointer-events: none;
  }

  .clear:focus-visible {
    outline: var(--stroke-ring) var(--ring-style) var(--color-ring-default);
    outline-offset: var(--ring-offset);
    border-radius: var(--radius-sm);
  }
`;
