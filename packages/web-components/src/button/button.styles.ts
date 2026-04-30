import { css } from 'lit';

export const buttonStyles = css`
  :host {
    display: inline-flex;
    border-radius: var(--button-radius);
    --_icon-size: var(--button-icon-size);
  }

  :host([data-size='large']) {
    --_icon-size: var(--control-large-icon-size);
  }

  /* Variant local aliases — default (primary) */
  :host,
  :host([variant='primary']) {
    --_bg: var(--color-button-primary-background-default);
    --_bg-hover: var(--color-button-primary-background-hover);
    --_bg-focus: var(--color-button-primary-background-focus);
    --_bg-active: var(--color-button-primary-background-active);
    --_bg-disabled: var(--color-button-primary-background-disabled);
    --_text: var(--color-button-primary-text-default);
    --_text-hover: var(--color-button-primary-text-hover);
    --_text-focus: var(--color-button-primary-text-focus);
    --_text-active: var(--color-button-primary-text-active);
    --_text-disabled: var(--color-button-primary-text-disabled);
    --_border: var(--color-button-primary-border-default);
    --_border-hover: var(--color-button-primary-border-hover);
    --_border-focus: var(--color-button-primary-border-focus);
    --_border-active: var(--color-button-primary-border-active);
    --_border-disabled: var(--color-button-primary-border-disabled);
  }

  :host([variant='secondary']) {
    --_bg: var(--color-button-secondary-background-default);
    --_bg-hover: var(--color-button-secondary-background-hover);
    --_bg-focus: var(--color-button-secondary-background-focus);
    --_bg-active: var(--color-button-secondary-background-active);
    --_bg-disabled: var(--color-button-secondary-background-disabled);
    --_text: var(--color-button-secondary-text-default);
    --_text-hover: var(--color-button-secondary-text-hover);
    --_text-focus: var(--color-button-secondary-text-focus);
    --_text-active: var(--color-button-secondary-text-active);
    --_text-disabled: var(--color-button-secondary-text-disabled);
    --_border: var(--color-button-secondary-border-default);
    --_border-hover: var(--color-button-secondary-border-hover);
    --_border-focus: var(--color-button-secondary-border-focus);
    --_border-active: var(--color-button-secondary-border-active);
    --_border-disabled: var(--color-button-secondary-border-disabled);
  }

  :host([variant='outline']) {
    --_bg: var(--color-button-outline-background-default);
    --_bg-hover: var(--color-button-outline-background-hover);
    --_bg-focus: var(--color-button-outline-background-focus);
    --_bg-active: var(--color-button-outline-background-active);
    --_bg-disabled: var(--color-button-outline-background-disabled);
    --_text: var(--color-button-outline-text-default);
    --_text-hover: var(--color-button-outline-text-hover);
    --_text-focus: var(--color-button-outline-text-focus);
    --_text-active: var(--color-button-outline-text-active);
    --_text-disabled: var(--color-button-outline-text-disabled);
    --_border: var(--color-button-outline-border-default);
    --_border-hover: var(--color-button-outline-border-hover);
    --_border-focus: var(--color-button-outline-border-focus);
    --_border-active: var(--color-button-outline-border-active);
    --_border-disabled: var(--color-button-outline-border-disabled);
  }

  :host([variant='ghost']) {
    --_bg: var(--color-button-ghost-background-default);
    --_bg-hover: var(--color-button-ghost-background-hover);
    --_bg-focus: var(--color-button-ghost-background-focus);
    --_bg-active: var(--color-button-ghost-background-active);
    --_bg-disabled: var(--color-button-ghost-background-disabled);
    --_text: var(--color-button-ghost-text-default);
    --_text-hover: var(--color-button-ghost-text-hover);
    --_text-focus: var(--color-button-ghost-text-focus);
    --_text-active: var(--color-button-ghost-text-active);
    --_text-disabled: var(--color-button-ghost-text-disabled);
    --_border: var(--color-button-ghost-border-default);
    --_border-hover: var(--color-button-ghost-border-hover);
    --_border-focus: var(--color-button-ghost-border-focus);
    --_border-active: var(--color-button-ghost-border-active);
    --_border-disabled: var(--color-button-ghost-border-disabled);
  }

  :host([variant='danger']) {
    --_bg: var(--color-button-danger-background-default);
    --_bg-hover: var(--color-button-danger-background-hover);
    --_bg-focus: var(--color-button-danger-background-focus);
    --_bg-active: var(--color-button-danger-background-active);
    --_bg-disabled: var(--color-button-danger-background-disabled);
    --_text: var(--color-button-danger-text-default);
    --_text-hover: var(--color-button-danger-text-hover);
    --_text-focus: var(--color-button-danger-text-focus);
    --_text-active: var(--color-button-danger-text-active);
    --_text-disabled: var(--color-button-danger-text-disabled);
    --_border: var(--color-button-danger-border-default);
    --_border-hover: var(--color-button-danger-border-hover);
    --_border-focus: var(--color-button-danger-border-focus);
    --_border-active: var(--color-button-danger-border-active);
    --_border-disabled: var(--color-button-danger-border-disabled);
  }

  button {
    appearance: none;
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    font: inherit;
    width: 100%;

    display: inline-flex;
    align-items: center;
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
  }

  button:hover:not(:disabled) {
    background-color: var(--_bg-hover);
    color: var(--_text-hover);
    border-color: var(--_border-hover);
  }

  :host(:focus-visible) button {
    background-color: var(--_bg-focus);
    color: var(--_text-focus);
    border-color: var(--_border-focus);
  }

  button:active:not(:disabled) {
    background-color: var(--_bg-active);
    color: var(--_text-active);
    border-color: var(--_border-active);
  }

  button:disabled {
    background-color: var(--_bg-disabled);
    color: var(--_text-disabled);
    border-color: var(--_border-disabled);
    cursor: not-allowed;
  }

  :host([loading]) button:disabled {
    cursor: wait;
    background-color: var(--_bg);
    color: var(--_text);
    border-color: var(--_border);
  }

  :host([data-size='small']) button {
    padding-inline: var(--button-small-padding-inline);
    padding-block: var(--button-small-padding-stack);
    font-size: var(--button-small-font-size);
  }

  :host([data-size='large']) button {
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
