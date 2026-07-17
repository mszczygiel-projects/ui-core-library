import { css } from 'lit';

export const badgeStyles = css`
  /*
   * Layout constraint: padding lives on .content, not :host — document-level
   * reset (* { padding: 0 }) outranks :host rules from inside the shadow tree.
   */
  :host {
    display: inline-flex;
    box-sizing: border-box;

    height: var(--badge-small-height);
    --_icon-size: var(--badge-small-icon-size);

    background-color: var(--_bg);
    color: var(--_text);
    border: var(--control-border-width) solid var(--_border);
    border-radius: var(--badge-rounded-radius);

    font-family: var(--badge-font-family);
    font-weight: var(--badge-font-weight);
    font-size: var(--badge-small-font-size);
    line-height: var(--badge-small-line-height);
    letter-spacing: var(--badge-letter-spacing);
    white-space: nowrap;
  }

  :host([data-size='medium']) {
    height: var(--badge-medium-height);
    font-size: var(--badge-medium-font-size);
    line-height: var(--badge-medium-line-height);
    --_icon-size: var(--badge-medium-icon-size);
  }

  :host([shape='square']) {
    border-radius: var(--badge-square-radius);
  }

  .content {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    width: 100%;
    gap: var(--badge-gap);
    padding-inline: var(--badge-small-padding-inline);
  }

  :host([data-size='medium']) .content {
    padding-inline: var(--badge-medium-padding-inline);
  }

  /* Icon-only padding must win over the size paddings — keep this rule last */
  :host([icon-only]) .content {
    padding-inline: var(--badge-padding-inline-icon-only);
  }

  :host([icon-only]) .label {
    display: none;
  }

  /* Variant × appearance local aliases — default (neutral solid) */
  :host,
  :host([variant='neutral'][appearance='solid']) {
    --_bg: var(--color-badge-neutral-solid-background);
    --_text: var(--color-badge-neutral-solid-text);
    --_border: var(--color-badge-neutral-solid-border);
  }

  :host([variant='neutral'][appearance='subtle']) {
    --_bg: var(--color-badge-neutral-subtle-background);
    --_text: var(--color-badge-neutral-subtle-text);
    --_border: var(--color-badge-neutral-subtle-border);
  }

  :host([variant='brand'][appearance='solid']) {
    --_bg: var(--color-badge-brand-solid-background);
    --_text: var(--color-badge-brand-solid-text);
    --_border: var(--color-badge-brand-solid-border);
  }

  :host([variant='brand'][appearance='subtle']) {
    --_bg: var(--color-badge-brand-subtle-background);
    --_text: var(--color-badge-brand-subtle-text);
    --_border: var(--color-badge-brand-subtle-border);
  }

  :host([variant='success'][appearance='solid']) {
    --_bg: var(--color-badge-success-solid-background);
    --_text: var(--color-badge-success-solid-text);
    --_border: var(--color-badge-success-solid-border);
  }

  :host([variant='success'][appearance='subtle']) {
    --_bg: var(--color-badge-success-subtle-background);
    --_text: var(--color-badge-success-subtle-text);
    --_border: var(--color-badge-success-subtle-border);
  }

  :host([variant='warning'][appearance='solid']) {
    --_bg: var(--color-badge-warning-solid-background);
    --_text: var(--color-badge-warning-solid-text);
    --_border: var(--color-badge-warning-solid-border);
  }

  :host([variant='warning'][appearance='subtle']) {
    --_bg: var(--color-badge-warning-subtle-background);
    --_text: var(--color-badge-warning-subtle-text);
    --_border: var(--color-badge-warning-subtle-border);
  }

  :host([variant='error'][appearance='solid']) {
    --_bg: var(--color-badge-error-solid-background);
    --_text: var(--color-badge-error-solid-text);
    --_border: var(--color-badge-error-solid-border);
  }

  :host([variant='error'][appearance='subtle']) {
    --_bg: var(--color-badge-error-subtle-background);
    --_text: var(--color-badge-error-subtle-text);
    --_border: var(--color-badge-error-subtle-border);
  }

  :host([variant='info'][appearance='solid']) {
    --_bg: var(--color-badge-info-solid-background);
    --_text: var(--color-badge-info-solid-text);
    --_border: var(--color-badge-info-solid-border);
  }

  :host([variant='info'][appearance='subtle']) {
    --_bg: var(--color-badge-info-subtle-background);
    --_text: var(--color-badge-info-subtle-text);
    --_border: var(--color-badge-info-subtle-border);
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
`;
