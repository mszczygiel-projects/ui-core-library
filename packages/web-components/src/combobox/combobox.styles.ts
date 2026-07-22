import { css } from 'lit';

/**
 * Element rules for `ui-combobox`. The size ramp and per-variant colour
 * aliases (`--_bg`, `--_text`, `--_label`, …) come from `controlFieldStyles`.
 */
export const comboboxStyles = css`
  /* ---- Host ---- */

  :host {
    display: block;
    font-family: var(--control-font-family);
    font-weight: var(--control-font-weight);
    letter-spacing: var(--control-letter-spacing);
  }

  :host([state='disabled']),
  :host([disabled]) {
    cursor: not-allowed;
  }

  /* ---- Label ---- */

  .label {
    display: block;
    margin-block-end: var(--spacing-2);
    font-size: var(--control-label-font-size);
    line-height: var(--control-label-line-height);
    font-weight: var(--control-label-font-weight);
    text-transform: var(--control-label-text-transform);
    font-family: var(--control-label-font-family);
    letter-spacing: var(--control-label-letter-spacing);
    color: var(--_label);
  }

  :host([open]) .label {
    color: var(--_label-active);
  }

  :host([state='success']) .label {
    color: var(--_label-success);
  }

  :host([state='error']) .label {
    color: var(--_label-error);
  }

  :host([state='disabled']) .label,
  :host([disabled]) .label {
    color: var(--_label-disabled);
  }

  /* ---- Field ---- */

  .field-container {
    position: relative;
  }

  /*
   * The field box is a plain div rather than a button: the interactive element
   * is the input inside it, which owns the combobox role and its ARIA.
   */
  .field {
    box-sizing: border-box;
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-2);
    width: 100%;
    cursor: text;

    padding-block: var(--_padding-stack);
    padding-inline: var(--_padding-inline);

    background-color: var(--_bg);
    border: var(--_border-width) solid var(--_border);
    border-radius: var(--_radius);

    transition:
      background-color var(--duration-150) ease,
      border-color var(--duration-150) ease;
  }

  .field:hover {
    background-color: var(--_bg-hover);
    border-color: var(--_border-hover);
  }

  :host([open]) .field,
  .field:focus-within {
    background-color: var(--_bg-active);
    border-color: var(--_border-active);
    outline: var(--stroke-ring) var(--ring-style) var(--color-ring-default);
    outline-offset: var(--ring-offset);
  }

  :host([state='success']) .field {
    background-color: var(--_bg-success);
    border-color: var(--_border-success);
  }

  :host([state='error']) .field {
    background-color: var(--_bg-error);
    border-color: var(--_border-error);
  }

  :host([state='disabled']) .field,
  :host([disabled]) .field {
    background-color: var(--_bg-disabled);
    border-color: var(--_border-disabled);
    cursor: not-allowed;
  }

  /* Underlined: bottom border only, no radius */

  :host([variant='underlined']) {
    --_padding-inline: 0px;
  }

  :host([variant='underlined']) .field {
    border: none;
    border-bottom: var(--control-underlined-border-width-default) solid var(--_border);
    border-radius: 0;
  }

  :host([variant='underlined']) .field:hover {
    border-bottom-color: var(--_border-hover);
    border-bottom-width: var(--control-underlined-border-width-hover);
  }

  :host([variant='underlined'][open]) .field,
  :host([variant='underlined']) .field:focus-within {
    border-bottom-color: var(--_border-active);
    border-bottom-width: var(--control-underlined-border-width-active);
    outline: none;
  }

  :host([variant='underlined'][state='success']) .field {
    border-bottom-color: var(--_border-success);
    border-bottom-width: var(--control-underlined-border-width-success);
  }

  :host([variant='underlined'][state='error']) .field {
    border-bottom-color: var(--_border-error);
    border-bottom-width: var(--control-underlined-border-width-error);
  }

  :host([variant='underlined'][state='disabled']) .field,
  :host([variant='underlined'][disabled]) .field {
    border-bottom-width: var(--control-underlined-border-width-disabled);
  }

  /* ---- Leading icon ---- */

  .icon--leading {
    display: none;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: var(--_icon-size);
    height: var(--_icon-size);
    /* Aligns with the first chip row when the field grows. */
    margin-block-start: calc((var(--size-6) - var(--_icon-size)) / 2);
    color: var(--_icon);
  }

  :host([has-leading-icon]) .icon--leading {
    display: inline-flex;
  }

  .field:hover .icon--leading {
    color: var(--_icon-hover);
  }

  :host([open]) .icon--leading {
    color: var(--_icon-active);
  }

  :host([state='error']) .icon--leading {
    color: var(--_icon-error);
  }

  :host([state='success']) .icon--leading {
    color: var(--_icon-success);
  }

  :host([state='disabled']) .icon--leading,
  :host([disabled]) .icon--leading {
    color: var(--_icon-disabled);
  }

  ::slotted(*) {
    display: inline-flex;
    flex-shrink: 0;
    width: var(--_icon-size);
    height: var(--_icon-size);
    color: inherit;
  }

  /* ---- Content: chips + input ---- */

  .content {
    display: flex;
    flex-direction: column;
    gap: var(--combobox-chips-gap);
    flex: 1;
    min-width: 0;
  }

  /* Chips wrap in their own row; the query keeps a line of its own below. */
  .chips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--combobox-chips-gap);
  }

  .chips:empty {
    display: none;
  }

  /* ---- Input ---- */

  .input {
    all: unset;
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    font-family: var(--control-font-family);
    font-size: var(--_font-size);
    font-weight: var(--control-font-weight);
    line-height: var(--size-6);
    letter-spacing: var(--control-letter-spacing);
    color: var(--_text);
    cursor: text;
  }

  .input::placeholder {
    color: var(--_placeholder);
  }

  .field:hover .input::placeholder {
    color: var(--_placeholder-hover);
  }

  :host([open]) .input::placeholder {
    color: var(--_placeholder-active);
  }

  :host([state='disabled']) .input,
  :host([disabled]) .input {
    color: var(--_text-disabled);
    cursor: not-allowed;
  }

  :host([state='disabled']) .input::placeholder,
  :host([disabled]) .input::placeholder {
    color: var(--_placeholder-disabled);
  }

  /* ---- Trailing area (clear + chevron) ---- */

  .trailing {
    display: flex;
    align-items: center;
    gap: var(--spacing-1);
    flex-shrink: 0;
    /* Aligns with the first chip row when the field grows. */
    margin-block-start: calc((var(--size-6) - var(--_icon-size)) / 2);
    margin-inline-end: calc(var(--_padding-inline) * -0.5);
  }

  :host([variant='underlined']) .trailing {
    margin-inline-end: 0;
  }

  .clear {
    all: unset;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--_icon-size);
    height: var(--_icon-size);
    cursor: pointer;
    color: var(--_icon);
    border-radius: var(--radius-sm);
    flex-shrink: 0;
  }

  .clear:focus-visible {
    outline: var(--stroke-ring) var(--ring-style) var(--color-ring-default);
    outline-offset: var(--ring-offset);
  }

  .clear svg,
  .chevron svg {
    display: inline-flex;
    width: var(--_icon-size);
    height: var(--_icon-size);
    color: inherit;
  }

  .chevron {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--_icon-size);
    height: var(--_icon-size);
    color: var(--_icon);
    flex-shrink: 0;
  }

  .field:hover .clear,
  .field:hover .chevron {
    color: var(--_icon-hover);
  }

  :host([open]) .chevron,
  :host([open]) .clear {
    color: var(--_icon-active);
  }

  :host([state='error']) .chevron,
  :host([state='error']) .clear {
    color: var(--_icon-error);
  }

  :host([state='success']) .chevron,
  :host([state='success']) .clear {
    color: var(--_icon-success);
  }

  :host([state='disabled']) .chevron,
  :host([disabled]) .chevron,
  :host([state='disabled']) .clear,
  :host([disabled]) .clear {
    color: var(--_icon-disabled);
  }

  /* ---- Floating list ---- */

  /*
   * The panel chrome lives on the listbox (select-dropdown-* tokens), so the
   * popover contributes positioning only — otherwise two surfaces would stack.
   */
  ui-popover {
    display: block;
    width: 100%;
  }

  ui-popover::part(panel) {
    width: var(--_dropdown-width, auto);
    background: none;
    border: none;
    border-radius: 0;
    box-shadow: none;
  }

  ui-popover::part(content) {
    padding: 0;
  }

  /* ---- Hint ---- */

  .hint {
    display: block;
    margin: 0;
    margin-block-start: var(--spacing-2);
    font-size: var(--control-hint-font-size);
    line-height: var(--control-hint-line-height);
    font-weight: var(--control-hint-font-weight);
    color: var(--_hint);
  }

  :host([state='success']) .hint {
    color: var(--_hint-success);
  }

  :host([state='error']) .hint {
    color: var(--_hint-error);
  }

  :host([state='disabled']) .hint,
  :host([disabled]) .hint {
    color: var(--_hint-disabled);
  }
`;
