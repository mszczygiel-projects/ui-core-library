import { css } from 'lit';

export const notificationStyles = css`
  /* ---- Shadow DOM UA reset (reset.css doesn't pierce shadow boundary) ---- */
  button {
    margin: 0;
    padding: 0;
    font: inherit;
    background: none;
    border: none;
    cursor: pointer;
    color: inherit;
  }

  p {
    margin: 0;
    padding: 0;
  }

  svg {
    display: block;
  }

  /* ---- Host: just a block wrapper — no padding/border here.
     Light-DOM "* { padding: 0 }" beats :host styles per CSS Shadow DOM spec,
     so all visual box properties live on the inner .container. ---- */
  :host {
    display: block;
  }

  /* ---- Status-specific local variables (set on host, inherited into shadow) ---- */
  :host([status='info']) {
    --_base: var(--color-feedback-info-base);
    --_subtle: var(--color-feedback-info-subtle);
    --_on-base: var(--color-feedback-info-on-base);
  }

  :host([status='success']) {
    --_base: var(--color-feedback-success-base);
    --_subtle: var(--color-feedback-success-subtle);
    --_on-base: var(--color-feedback-success-on-base);
  }

  :host([status='warning']) {
    --_base: var(--color-feedback-warning-base);
    --_subtle: var(--color-feedback-warning-subtle);
    --_on-base: var(--color-feedback-warning-on-base);
  }

  :host([status='error']) {
    --_base: var(--color-feedback-error-base);
    --_subtle: var(--color-feedback-error-subtle);
    --_on-base: var(--color-feedback-error-on-base);
  }

  /* ---- Container: all visual box properties live here ---- */
  .container {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
    padding-top: var(--notification-padding-stack);
    padding-bottom: var(--notification-padding-stack);
    padding-left: var(--notification-padding-inline);
    padding-right: var(--notification-padding-inline);
    border-radius: var(--notification-radius);
    overflow: hidden;
    border-style: solid;
    box-sizing: border-box;
  }

  /* ---- Default variant: solid background, border all sides ---- */
  :host([variant='default']) .container,
  :host(:not([variant])) .container {
    background-color: var(--_base);
    border-color: var(--_base);
    border-top-width: var(--notification-default-border-top);
    border-right-width: var(--notification-default-border-right);
    border-bottom-width: var(--notification-default-border-bottom);
    border-left-width: var(--notification-default-border-left);
    color: var(--_on-base);
  }

  /* ---- Subtle variant: tinted background, left border only ---- */
  :host([variant='subtle']) .container {
    background-color: var(--_subtle);
    border-color: var(--_base);
    border-top-width: var(--notification-subtle-border-top);
    border-right-width: var(--notification-subtle-border-right);
    border-bottom-width: var(--notification-subtle-border-bottom);
    border-left-width: var(--notification-subtle-border-left);
    color: var(--_base);
  }

  /* ---- Header row: icon + heading ---- */
  .header {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-2);
    /* Reserve space on the right for the close button: icon(24px) + padding(16px) + gap(8px) */
    padding-right: var(--spacing-8);
  }

  /* ---- Status icon — rendered only when has-leading-icon is set ---- */
  .icon {
    display: flex;
    flex-shrink: 0;
    width: var(--size-6);
    height: var(--size-6);
    color: inherit;
    align-items: center;
    justify-content: center;
  }

  .icon svg {
    width: 100%;
    height: 100%;
  }

  /* ---- Heading ---- */
  .heading {
    flex: 1 0 0;
    min-width: 0;
    font-family: var(--notification-font-family);
    font-size: var(--notification-font-size);
    font-weight: var(--notification-font-weight);
    line-height: var(--notification-line-height);
    letter-spacing: var(--notification-letter-spacing);
    color: inherit;
    overflow-wrap: break-word;
  }

  /* ---- Description ---- */
  .description {
    font-family: var(--notification-description-font-family);
    font-size: var(--notification-description-font-size);
    font-weight: var(--notification-description-font-weight);
    line-height: var(--notification-description-line-height);
    letter-spacing: var(--notification-description-letter-spacing);
    color: inherit;
    overflow-wrap: break-word;
  }

  .description[hidden] {
    display: none;
  }

  /* ---- Close button ---- */
  .close {
    position: absolute;
    top: var(--notification-padding-stack);
    right: var(--notification-padding-inline);
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--size-6);
    height: var(--size-6);
    border-radius: var(--radius-sm);
  }

  .close svg {
    width: 100%;
    height: 100%;
  }

  .close:focus-visible {
    outline: var(--stroke-ring) var(--ring-style) var(--color-ring-default);
    outline-offset: var(--ring-offset);
  }
`;
