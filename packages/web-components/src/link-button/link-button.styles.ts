import { css } from 'lit';

export const linkButtonStyles = css`
  a {
    appearance: none;
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    font: inherit;
    width: 100%;
    text-decoration: none;

    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--layout-gap-inline-lg);
    padding-inline: var(--button-padding-inline);
    padding-block: var(--button-padding-stack);

    background-color: var(--_bg);
    color: var(--_text);
    border: var(--button-border-width) solid var(--_border);
    border-radius: var(--button-radius);

    font-family: var(--button-font-family);
    font-weight: var(--button-font-weight);
    font-size: var(--button-font-size);
    line-height: var(--size-6);
    letter-spacing: var(--button-letter-spacing);
    white-space: nowrap;
    text-align: center;
    text-transform: var(--button-text-transform-uppercase);
  }

  a:hover {
    background-color: var(--_bg-hover);
    color: var(--_text-hover);
    border-color: var(--_border-hover);
  }

  :host(:focus-visible) a {
    background-color: var(--_bg-focus);
    color: var(--_text-focus);
    border-color: var(--_border-focus);
  }

  a:active {
    background-color: var(--_bg-active);
    color: var(--_text-active);
    border-color: var(--_border-active);
  }

  :host([disabled]) a,
  :host([loading]) a {
    pointer-events: none;
  }

  :host([disabled]:not([loading])) a {
    cursor: not-allowed;
    background-color: var(--_bg-disabled);
    color: var(--_text-disabled);
    border-color: var(--_border-disabled);
  }

  :host([disabled]:not([loading])) a:hover,
  :host([disabled]:not([loading])) a:active {
    background-color: var(--_bg-disabled);
    color: var(--_text-disabled);
    border-color: var(--_border-disabled);
  }

  :host([loading]) a {
    cursor: wait;
    --loader-color: currentColor;
  }

  :host([data-size='small']) a {
    padding-inline: var(--button-small-padding-inline);
    padding-block: var(--button-small-padding-stack);
    font-size: var(--button-small-font-size);
  }

  :host([data-size='large']) a {
    padding-inline: var(--button-large-padding-inline);
    padding-block: var(--button-large-padding-stack);
    font-size: var(--control-large-font-size);
  }

  ::slotted(*) {
    display: inline-flex;
    flex-shrink: 0;
    width: var(--_icon-size);
    height: var(--_icon-size);
    color: inherit;
  }

  .label {
    display: inline;
  }

  :host([loading]) .label {
    opacity: 0.5;
  }

  ui-loader {
    flex-shrink: 0;
    color: inherit;
  }
`;
