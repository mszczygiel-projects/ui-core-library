import { css } from 'lit';

export const textFieldStyles = css`
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
    --_inside_label_vertical_gap: 0px;
  }

  :host([data-size='small']) {
    --_font-size: var(--control-small-font-size);
    --_padding-inline: var(--control-small-padding-inline);
    --_padding-stack: var(--control-small-padding-stack);
    --_padding-inline-icon: var(--control-small-padding-inline-has-icon);
    --_radius: var(--control-small-radius);
    --_icon-size: var(--control-small-icon-size);
    --_inside_label_vertical_gap: 0px;
  }

  :host([data-size='large']) {
    --_font-size: var(--control-large-font-size);
    --_padding-inline: var(--control-large-padding-inline);
    --_padding-stack: var(--control-large-padding-stack);
    --_padding-inline-icon: var(--control-large-padding-inline-has-icon);
    --_radius: var(--control-large-radius);
    --_icon-size: var(--control-large-icon-size);
    --_inside_label_vertical_gap: var(--spacing-1);
  }

  /* ---- Variant color aliases: outline + underlined (share same tokens) ---- */

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

    /*
     * Chip background for the floating label when it sits at the top of the field.
     * Outline/Underlined: opaque page background to visually cut through the border.
     */
    --_label-chip-bg: var(--color-background-default);
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

    /*
     * Chip background for the floating label: matches the filled field background
     * so the chip blends in rather than cutting through an invisible border.
     */
    --_label-chip-bg: var(--_bg);
  }

  :host([variant='underlined']) {
    --_padding-inline: 0px;
  }

  :host([label-placement='floating']) {
    --_padding-inline-icon: calc(
      var(--control-icon-size) + var(--spacing-2) + var(--_padding-inline)
    );
  }

  /* ---- Label (top placement) ---- */

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

  .field-wrapper:hover ~ .label,
  .label:has(~ .field-wrapper:hover) {
    color: var(--_label-hover);
  }

  .field-wrapper:focus-within ~ .label,
  .label:has(~ .field-wrapper:focus-within) {
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

  /* ---- Field wrapper ---- */

  .field-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--spacing-2);

    background-color: var(--_bg);
    border: var(--_border-width) solid var(--_border);
    border-radius: var(--_radius);
  }

  .field-wrapper:hover {
    background-color: var(--_bg-hover);
    border-color: var(--_border-hover);
  }

  .field-wrapper:focus-within {
    background-color: var(--_bg-active);
    border-color: var(--_border-active);
    outline: var(--stroke-ring) var(--ring-style) var(--color-ring-default);
    outline-offset: var(--ring-offset);
  }

  :host([state='success']) .field-wrapper {
    background-color: var(--_bg-success);
    border-color: var(--_border-success);
  }

  :host([state='error']) .field-wrapper {
    background-color: var(--_bg-error);
    border-color: var(--_border-error);
  }

  :host([state='disabled']) .field-wrapper,
  :host([disabled]) .field-wrapper {
    background-color: var(--_bg-disabled);
    border-color: var(--_border-disabled);
    pointer-events: none;
  }

  /* Underlined: bottom border only, no radius */

  :host([variant='underlined']) .field-wrapper {
    border: none;
    border-bottom: var(--control-underlined-border-width-default) solid var(--_border);
    border-radius: 0;
  }

  :host([variant='underlined']) .field-wrapper:hover {
    border-bottom-color: var(--_border-hover);
    border-bottom-width: var(--control-underlined-border-width-hover);
  }

  :host([variant='underlined']) .field-wrapper:focus-within {
    border-bottom-color: var(--_border-active);
    border-bottom-width: var(--control-underlined-border-width-active);
  }

  :host([variant='underlined'][state='success']) .field-wrapper {
    border-bottom-color: var(--_border-success);
    border-bottom-width: var(--control-underlined-border-width-success);
  }

  :host([variant='underlined'][state='error']) .field-wrapper {
    border-bottom-color: var(--_border-error);
    border-bottom-width: var(--control-underlined-border-width-error);
  }

  :host([variant='underlined'][state='disabled']) .field-wrapper,
  :host([variant='underlined'][disabled]) .field-wrapper {
    border-bottom-width: var(--control-underlined-border-width-disabled);
  }

  /* ---- Native input ---- */

  .input {
    flex: 1;
    min-width: 0;
    appearance: none;
    border: none;
    outline: none;
    background: transparent;
    padding-block: var(--_padding-stack);
    padding-inline: var(--_padding-inline);
    font-family: inherit;
    font-weight: inherit;
    font-size: var(--_font-size);
    line-height: var(--size-6);
    letter-spacing: inherit;
    color: var(--_text);
  }

  .input::placeholder {
    color: var(--_placeholder);
  }

  .field-wrapper:hover .input {
    color: var(--_text-hover);
  }

  .field-wrapper:hover .input::placeholder {
    color: var(--_placeholder-hover);
  }

  .field-wrapper:focus-within .input {
    color: var(--_text-active);
  }

  .field-wrapper:focus-within .input::placeholder {
    color: var(--_placeholder-active);
  }

  :host([state='success']) .input {
    color: var(--_text-success);
  }

  :host([state='error']) .input {
    color: var(--_text-error);
  }

  :host([state='error']) .input::placeholder {
    color: var(--_placeholder-error);
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

  /* Leading icon shifts input padding */
  :host([has-leading-icon]) .input {
    padding-inline-start: 0;
  }

  :host([has-trailing-icon]) .input {
    padding-inline-end: 0;
  }

  /* ---- Inner label ---- */

  :host([label-placement='inner']) {
    --_inner-label-size: var(--size-4);
  }

  :host([label-placement='inner']) .label {
    position: absolute;
    top: var(--_padding-stack);
    inset-inline-start: var(--_padding-inline);
    margin: 0;
    font-size: var(--control-label-inner-font-size);
    line-height: var(--control-label-inner-line-height);
    font-weight: var(--control-label-inner-font-weight);
    font-family: var(--control-label-inner-font-family);
    text-transform: var(--control-label-inner-text-transform);
    letter-spacing: var(--control-label-inner-letter-spacing);
    color: var(--_label);
    pointer-events: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  :host([has-leading-icon][label-placement='inner']) .label {
    inset-inline-start: var(--_padding-inline);
  }

  :host([label-placement='inner']) .field-wrapper:hover .label {
    color: var(--_label-hover);
  }

  :host([label-placement='inner']) .field-wrapper:focus-within .label {
    color: var(--_label-active);
  }

  :host([state='success'][label-placement='inner']) .label {
    color: var(--_label-success);
  }

  :host([state='error'][label-placement='inner']) .label {
    color: var(--_label-error);
  }

  :host([state='disabled'][label-placement='inner']) .label,
  :host([disabled][label-placement='inner']) .label {
    color: var(--_label-disabled);
  }

  :host([label-placement='inner']) .input,
  :host([label-placement='inner']) .icon--leading,
  :host([label-placement='inner']) .icon--trailing {
    padding-block-start: calc(
      var(--_padding-stack) - 2 * var(--_border-width) + var(--_inner-label-size) +
        var(--_inside_label_vertical_gap)
    );
    padding-block-end: calc(var(--_padding-stack) - 2 * var(--_border-width));
  }

  /* ---- Floating label ---- */

  /*
   * Floating label sits after <input> in DOM so the ~ combinator works.
   * Input uses placeholder=" " (single space) to drive :placeholder-shown state.
   * When empty+unfocused: label centered = acts as visual placeholder.
   * When filled or focused: label shrunken at top.
   *
   * Applies to label-placement='floating' for all variants (outline, filled, underlined).
   */

  :host([label-placement='floating']) .label {
    position: absolute;
    inset-inline-start: var(--_padding-inline);
    top: calc(var(--size-3) * -1);
    transform: translateY(0);
    font-size: var(--control-label-floating-font-size);
    line-height: var(--control-label-floating-line-height);
    font-weight: var(--control-label-floating-font-weight);
    font-family: var(--control-label-floating-font-family);
    text-transform: var(--control-label-floating-text-transform);
    letter-spacing: var(--control-label-floating-letter-spacing);
    color: var(--_label);
    padding: 0 var(--size-1);
    left: var(--size-2);
    background-color: var(--_label-chip-bg);
    pointer-events: none;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition:
      top var(--duration-150) ease,
      font-size var(--duration-150) ease,
      color var(--duration-150) ease,
      transform var(--duration-150) ease;
  }

  /* Empty + unfocused: label centered acts as placeholder */
  :host([label-placement='floating']) .input:placeholder-shown ~ .label {
    top: 50%;
    transform: translateY(-50%);
    font-size: var(--_font-size);
    color: var(--_placeholder);
    padding: 0;
    background: var(--_bg);
    left: var(--_padding-inline);
  }

  /* Leading icon shifts floating label */
  :host([has-leading-icon][label-placement='floating']) .input:placeholder-shown ~ .label {
    left: var(--_padding-inline-icon);
  }

  /* Filled or focused: label shrunken at top */
  :host([label-placement='floating']) .field-wrapper:focus-within .label {
    top: calc(var(--size-3) * -1);
    transform: translateY(0);
    font-size: var(--control-label-floating-font-size);
    color: var(--_label-active);
    padding: 0 var(--size-1);
    background-color: var(--_label-chip-bg);
    left: var(--size-2);
  }

  /* Floating label state colors */

  :host([state='success'][label-placement='floating']) .input:not(:placeholder-shown) ~ .label {
    color: var(--_label-success);
  }

  :host([state='error'][label-placement='floating']) .input:not(:placeholder-shown) ~ .label {
    color: var(--_label-error);
  }

  :host([state='disabled'][label-placement='floating']) .label,
  :host([disabled][label-placement='floating']) .label {
    color: var(--_label-disabled);
  }

  /* ---- Icons ---- */

  .icon {
    display: none;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    color: var(--_icon);
  }

  .icon--leading {
    padding-inline-start: var(--_padding-inline);
  }

  .icon--trailing {
    padding-inline-end: var(--_padding-inline);
  }

  :host([has-leading-icon]) .icon--leading {
    display: inline-flex;
  }

  :host([has-trailing-icon]) .icon--trailing {
    display: inline-flex;
  }

  .field-wrapper:hover .icon {
    color: var(--_icon-hover);
  }

  .field-wrapper:focus-within .icon {
    color: var(--_icon-active);
  }

  :host([state='success']) .icon {
    color: var(--_icon-success);
  }

  :host([state='error']) .icon {
    color: var(--_icon-error);
  }

  :host([state='disabled']) .icon,
  :host([disabled]) .icon {
    color: var(--_icon-disabled);
  }

  ::slotted(*) {
    display: inline-flex;
    flex-shrink: 0;
    width: var(--_icon-size);
    height: var(--_icon-size);
    color: inherit;
  }

  .icon-content,
  .icon-content :where(svg) {
    display: inline-flex;
    width: var(--_icon-size);
    height: var(--_icon-size);
    color: inherit;
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
