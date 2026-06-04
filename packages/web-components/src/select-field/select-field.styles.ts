import { css } from 'lit';

export const selectFieldStyles = css`
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

  /* ---- Size tokens ---- */

  :host,
  :host([data-size='default']) {
    --_font-size: var(--control-font-size);
    --_padding-inline: var(--control-padding-inline);
    --_padding-stack: var(--control-padding-stack);
    --_padding-inline-icon: var(--control-padding-inline-has-icon);
    --_radius: var(--control-radius);
    --_icon-size: var(--control-icon-size);
    --_option-padding-stack: var(--select-option-padding-stack);
    --_option-gap: var(--select-option-gap);
    --_inside_label_vertical_gap: 0px;
  }

  :host([data-size='small']) {
    --_font-size: var(--control-small-font-size);
    --_padding-inline: var(--control-small-padding-inline);
    --_padding-stack: var(--control-small-padding-stack);
    --_padding-inline-icon: var(--control-small-padding-inline-has-icon);
    --_radius: var(--control-small-radius);
    --_icon-size: var(--control-small-icon-size);
    --_option-padding-stack: var(--select-option-small-padding-stack);
    --_option-gap: var(--select-option-small-gap);
    --_inside_label_vertical_gap: 0px;
  }

  :host([data-size='large']) {
    --_font-size: var(--control-large-font-size);
    --_padding-inline: var(--control-large-padding-inline);
    --_padding-stack: var(--control-large-padding-stack);
    --_padding-inline-icon: var(--control-large-padding-inline-has-icon);
    --_radius: var(--control-large-radius);
    --_icon-size: var(--control-large-icon-size);
    --_option-padding-stack: var(--select-option-large-padding-stack);
    --_option-gap: var(--select-option-gap);
    --_inside_label_vertical_gap: var(--spacing-1);
  }

  /* ---- Variant color aliases: outline + underlined ---- */

  :host,
  :host([variant='outline']),
  :host([variant='underlined']) {
    --_bg: var(--color-control-outline-background-default);
    --_bg-hover: var(--color-control-outline-background-hover);
    --_bg-active: var(--color-control-outline-background-active);
    --_bg-success: var(--color-control-outline-background-success);
    --_bg-error: var(--color-control-outline-background-error);
    --_bg-disabled: var(--color-control-outline-background-disabled);

    --_border: var(--color-control-outline-border-default);
    --_border-hover: var(--color-control-outline-border-hover);
    --_border-active: var(--color-control-outline-border-active);
    --_border-success: var(--color-control-outline-border-success);
    --_border-error: var(--color-control-outline-border-error);
    --_border-disabled: var(--color-control-outline-border-disabled);

    --_text: var(--color-control-outline-text-default);
    --_text-hover: var(--color-control-outline-text-hover);
    --_text-active: var(--color-control-outline-text-active);
    --_text-success: var(--color-control-outline-text-success);
    --_text-error: var(--color-control-outline-text-error);
    --_text-disabled: var(--color-control-outline-text-disabled);

    --_placeholder: var(--color-control-outline-placeholder-default);
    --_placeholder-hover: var(--color-control-outline-placeholder-hover);
    --_placeholder-active: var(--color-control-outline-placeholder-active);
    --_placeholder-success: var(--color-control-outline-placeholder-success);
    --_placeholder-error: var(--color-control-outline-placeholder-error);
    --_placeholder-disabled: var(--color-control-outline-placeholder-disabled);

    --_label: var(--color-control-outline-label-default);
    --_label-hover: var(--color-control-outline-label-hover);
    --_label-active: var(--color-control-outline-label-active);
    --_label-success: var(--color-control-outline-label-success);
    --_label-error: var(--color-control-outline-label-error);
    --_label-disabled: var(--color-control-outline-label-disabled);

    --_hint: var(--color-control-outline-hint-default);
    --_hint-hover: var(--color-control-outline-hint-hover);
    --_hint-active: var(--color-control-outline-hint-active);
    --_hint-success: var(--color-control-outline-hint-success);
    --_hint-error: var(--color-control-outline-hint-error);
    --_hint-disabled: var(--color-control-outline-hint-disabled);

    --_icon: var(--color-control-outline-icon-default);
    --_icon-hover: var(--color-control-outline-icon-hover);
    --_icon-active: var(--color-control-outline-icon-active);
    --_icon-success: var(--color-control-outline-icon-success);
    --_icon-error: var(--color-control-outline-icon-error);
    --_icon-disabled: var(--color-control-outline-icon-disabled);

    --_border-width: var(--control-border-width);
  }

  /* ---- Variant color aliases: filled ---- */

  :host([variant='filled']) {
    --_bg: var(--color-control-filled-background-default);
    --_bg-hover: var(--color-control-filled-background-hover);
    --_bg-active: var(--color-control-filled-background-active);
    --_bg-success: var(--color-control-filled-background-success);
    --_bg-error: var(--color-control-filled-background-error);
    --_bg-disabled: var(--color-control-filled-background-disabled);

    --_border: var(--color-control-filled-border-default);
    --_border-hover: var(--color-control-filled-border-hover);
    --_border-active: var(--color-control-filled-border-active);
    --_border-success: var(--color-control-filled-border-success);
    --_border-error: var(--color-control-filled-border-error);
    --_border-disabled: var(--color-control-filled-border-disabled);

    --_text: var(--color-control-filled-text-default);
    --_text-hover: var(--color-control-filled-text-hover);
    --_text-active: var(--color-control-filled-text-active);
    --_text-success: var(--color-control-filled-text-success);
    --_text-error: var(--color-control-filled-text-error);
    --_text-disabled: var(--color-control-filled-text-disabled);

    --_placeholder: var(--color-control-filled-placeholder-default);
    --_placeholder-hover: var(--color-control-filled-placeholder-hover);
    --_placeholder-active: var(--color-control-filled-placeholder-active);
    --_placeholder-success: var(--color-control-filled-placeholder-success);
    --_placeholder-error: var(--color-control-filled-placeholder-error);
    --_placeholder-disabled: var(--color-control-filled-placeholder-disabled);

    --_label: var(--color-control-filled-label-default);
    --_label-hover: var(--color-control-filled-label-hover);
    --_label-active: var(--color-control-filled-label-active);
    --_label-success: var(--color-control-filled-label-success);
    --_label-error: var(--color-control-filled-label-error);
    --_label-disabled: var(--color-control-filled-label-disabled);

    --_hint: var(--color-control-filled-hint-default);
    --_hint-hover: var(--color-control-filled-hint-hover);
    --_hint-active: var(--color-control-filled-hint-active);
    --_hint-success: var(--color-control-filled-hint-success);
    --_hint-error: var(--color-control-filled-hint-error);
    --_hint-disabled: var(--color-control-filled-hint-disabled);

    --_icon: var(--color-control-filled-icon-default);
    --_icon-hover: var(--color-control-filled-icon-hover);
    --_icon-active: var(--color-control-filled-icon-active);
    --_icon-success: var(--color-control-filled-icon-success);
    --_icon-error: var(--color-control-filled-icon-error);
    --_icon-disabled: var(--color-control-filled-icon-disabled);

    --_border-width: var(--control-border-width);
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

  /* Hover: trigger before label in DOM — use :has() */
  .label:has(~ .field-container .trigger:hover) {
    color: var(--_label-hover);
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

  /* ---- Inner label ---- */

  :host([label-placement='inner']) {
    --_inner-label-size: var(--size-4);
  }

  :host([label-placement='inner']) .trigger {
    position: relative;
    padding-block-start: calc(
      var(--_padding-stack) - 2 * var(--_border-width) + var(--_inner-label-size) +
        var(--_inside_label_vertical_gap)
    );
    padding-block-end: calc(var(--_padding-stack) - 2 * var(--_border-width));
  }

  .inner-label {
    position: absolute;
    top: var(--_padding-stack);
    inset-inline-start: var(--_padding-inline);
    font-size: var(--control-label-inner-font-size);
    line-height: var(--control-label-inner-line-height);
    font-weight: var(--control-label-inner-font-weight);
    font-family: var(--control-label-inner-font-family);
    text-transform: var(--control-label-inner-text-transform);
    letter-spacing: var(--control-label-inner-letter-spacing);
    color: var(--_label);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    pointer-events: none;
  }

  :host([has-leading-icon][label-placement='inner']) .inner-label {
    inset-inline-start: var(--_padding-inline);
  }

  :host([label-placement='inner']) .trigger:hover .inner-label {
    color: var(--_label-hover);
  }

  :host([label-placement='inner'][open]) .inner-label {
    color: var(--_label-active);
  }

  :host([label-placement='inner'][state='success']) .inner-label {
    color: var(--_label-success);
  }

  :host([label-placement='inner'][state='error']) .inner-label {
    color: var(--_label-error);
  }

  :host([label-placement='inner'][state='disabled']) .inner-label,
  :host([label-placement='inner'][disabled]) .inner-label {
    color: var(--_label-disabled);
  }

  /* ---- Field container (positions dropdown) ---- */

  .field-container {
    position: relative;
  }

  /* ---- Trigger ---- */

  .trigger {
    all: unset;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    width: 100%;
    cursor: pointer;

    padding-block: var(--_padding-stack);
    padding-inline: var(--_padding-inline);

    background-color: var(--_bg);
    border: var(--_border-width) solid var(--_border);
    border-radius: var(--_radius);

    font-family: var(--control-font-family);
    font-size: var(--_font-size);
    font-weight: var(--control-font-weight);
    line-height: var(--size-6);
    letter-spacing: var(--control-letter-spacing);
    color: var(--_text);

    transition:
      background-color var(--duration-150) ease,
      border-color var(--duration-150) ease;
  }

  .trigger:hover {
    background-color: var(--_bg-hover);
    border-color: var(--_border-hover);
  }

  .trigger:focus-visible,
  :host([open]) .trigger {
    background-color: var(--_bg-active);
    border-color: var(--_border-active);
    outline: var(--stroke-ring) var(--ring-style) var(--color-ring-default);
    outline-offset: var(--ring-offset);
  }

  :host([state='success']) .trigger {
    background-color: var(--_bg-success);
    border-color: var(--_border-success);
  }

  :host([state='error']) .trigger {
    background-color: var(--_bg-error);
    border-color: var(--_border-error);
  }

  :host([state='disabled']) .trigger,
  :host([disabled]) .trigger {
    background-color: var(--_bg-disabled);
    border-color: var(--_border-disabled);
    cursor: not-allowed;
    pointer-events: none;
  }

  /* Underlined: bottom border only, no radius */

  :host([variant='underlined']) {
    --_padding-inline: 0px;
  }

  :host([variant='underlined']) .trigger {
    border: none;
    border-bottom: var(--control-underlined-border-width-default) solid var(--_border);
    border-radius: 0;
  }

  :host([variant='underlined']) .trigger:hover {
    border-bottom-color: var(--_border-hover);
    border-bottom-width: var(--control-underlined-border-width-hover);
  }

  :host([variant='underlined']) .trigger:focus-visible,
  :host([variant='underlined'][open]) .trigger {
    border-bottom-color: var(--_border-active);
    border-bottom-width: var(--control-underlined-border-width-active);
    outline: none;
  }

  :host([variant='underlined'][state='success']) .trigger {
    border-bottom-color: var(--_border-success);
    border-bottom-width: var(--control-underlined-border-width-success);
  }

  :host([variant='underlined'][state='error']) .trigger {
    border-bottom-color: var(--_border-error);
    border-bottom-width: var(--control-underlined-border-width-error);
  }

  :host([variant='underlined'][state='disabled']) .trigger,
  :host([variant='underlined'][disabled]) .trigger {
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
    color: var(--_icon);
    margin-inline-start: var(--_padding-inline);
  }

  :host([has-leading-icon]) .icon--leading {
    display: inline-flex;
  }

  :host([has-leading-icon]) .trigger {
    padding-inline-start: 0;
  }

  .trigger:hover .icon--leading {
    color: var(--_icon-hover);
  }

  :host([open]) .icon--leading,
  .trigger:focus-visible .icon--leading {
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

  /* ---- Value / Placeholder ---- */

  .value {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: start;
    color: var(--_text);
  }

  .value--placeholder {
    color: var(--_placeholder);
  }

  .trigger:hover .value {
    color: var(--_text-hover);
  }

  .trigger:hover .value--placeholder {
    color: var(--_placeholder-hover);
  }

  :host([open]) .trigger .value {
    color: var(--_text-active);
  }

  :host([open]) .trigger .value--placeholder {
    color: var(--_placeholder-active);
  }

  :host([state='success']) .value {
    color: var(--_text-success);
  }

  :host([state='success']) .value--placeholder {
    color: var(--_placeholder-success);
  }

  :host([state='error']) .value {
    color: var(--_text-error);
  }

  :host([state='error']) .value--placeholder {
    color: var(--_placeholder-error);
  }

  :host([state='disabled']) .value,
  :host([disabled]) .value {
    color: var(--_text-disabled);
  }

  :host([state='disabled']) .value--placeholder,
  :host([disabled]) .value--placeholder {
    color: var(--_placeholder-disabled);
  }

  /* ---- Trailing area (clear + chevron) ---- */

  .trailing {
    display: flex;
    align-items: center;
    gap: var(--spacing-1);
    flex-shrink: 0;
    margin-inline-end: calc(var(--_padding-inline) * -0.5);
  }

  :host([variant='underlined']) .trailing {
    margin-inline-end: 0;
  }

  /* ---- Clear button ---- */

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

  .clear svg {
    display: inline-flex;
    width: var(--_icon-size);
    height: var(--_icon-size);
    color: inherit;
  }

  /* ---- Chevron ---- */

  .chevron {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--_icon-size);
    height: var(--_icon-size);
    color: var(--_icon);
    flex-shrink: 0;
  }

  .chevron svg {
    display: inline-flex;
    width: var(--_icon-size);
    height: var(--_icon-size);
    color: inherit;
  }

  .trigger:hover .clear,
  .trigger:hover .chevron {
    color: var(--_icon-hover);
  }

  :host([open]) .chevron,
  :host([open]) .clear,
  .trigger:focus-visible .chevron,
  .trigger:focus-visible .clear {
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

  /* ---- Dropdown panel ---- */

  .dropdown {
    position: absolute;
    top: calc(100% + var(--spacing-1));
    left: 0;
    right: 0;
    z-index: 100;
    list-style: none;
    margin: 0;
    padding: var(--select-dropdown-padding);
    background-color: var(--color-select-dropdown-background);
    border: var(--select-dropdown-border-width) solid var(--color-select-dropdown-border);
    border-radius: var(--select-dropdown-radius);
    box-shadow: var(--shadow-md);
    overflow-y: auto;
    max-height: 20rem;
  }

  /* ---- Option ---- */

  .option {
    display: flex;
    align-items: center;
    gap: var(--_option-gap);
    padding-block: var(--_option-padding-stack);
    padding-inline: var(--select-option-padding-inline);
    border-radius: var(--select-option-radius);
    cursor: pointer;
    font-family: var(--control-font-family);
    font-size: var(--_font-size);
    font-weight: var(--control-font-weight);
    line-height: var(--size-6);
    letter-spacing: var(--control-letter-spacing);
    color: var(--color-select-option-text-default);
    background-color: var(--color-select-option-background-default);
    transition:
      background-color var(--duration-100) ease,
      color var(--duration-100) ease;
  }

  .option:hover,
  .option--focused {
    background-color: var(--color-select-option-background-hover);
    color: var(--color-select-option-text-hover);
  }

  .option--selected {
    background-color: var(--color-select-option-background-active);
    color: var(--color-select-option-text-active);
  }

  .option--selected:hover,
  .option--selected.option--focused {
    background-color: var(--color-select-option-background-active);
    color: var(--color-select-option-text-active);
  }

  .option--disabled {
    color: var(--color-select-option-text-disabled);
    background-color: var(--color-select-option-background-disabled);
    cursor: not-allowed;
    pointer-events: none;
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
