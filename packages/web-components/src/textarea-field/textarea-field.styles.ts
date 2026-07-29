import { css } from 'lit';

export const textareaFieldStyles = css`
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
    --_radius: var(--control-radius);
    --_min-height: var(--textarea-min-height);
    --_inside_label_vertical_gap: 0px;
  }

  :host([data-size='small']) {
    --_font-size: var(--control-small-font-size);
    --_padding-inline: var(--control-small-padding-inline);
    --_padding-stack: var(--control-small-padding-stack);
    --_radius: var(--control-small-radius);
    --_min-height: var(--textarea-small-min-height);
    --_inside_label_vertical_gap: 0px;
  }

  :host([data-size='large']) {
    --_font-size: var(--control-large-font-size);
    --_padding-inline: var(--control-large-padding-inline);
    --_padding-stack: var(--control-large-padding-stack);
    --_radius: var(--control-large-radius);
    --_min-height: var(--textarea-large-min-height);
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

  /*
   * Column flex rather than the single-line field's row flex: the textarea is the only
   * flex item, so flex: 1 1 auto stretches it to the wrapper's min-height when the
   * content is short, and lets the wrapper follow when the content (or a user drag)
   * makes it taller.
   */
  .field-wrapper {
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: var(--_min-height);

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

  /* ---- Native textarea ---- */

  .textarea {
    flex: 1 1 auto;
    min-height: 0;
    width: 100%;
    display: block;
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

  .textarea::placeholder {
    color: var(--_placeholder);
  }

  .field-wrapper:hover .textarea {
    color: var(--_text-hover);
  }

  .field-wrapper:hover .textarea::placeholder {
    color: var(--_placeholder-hover);
  }

  .field-wrapper:focus-within .textarea {
    color: var(--_text-active);
  }

  .field-wrapper:focus-within .textarea::placeholder {
    color: var(--_placeholder-active);
  }

  :host([state='success']) .textarea {
    color: var(--_text-success);
  }

  :host([state='error']) .textarea {
    color: var(--_text-error);
  }

  :host([state='error']) .textarea::placeholder {
    color: var(--_placeholder-error);
  }

  :host([state='disabled']) .textarea,
  :host([disabled]) .textarea {
    color: var(--_text-disabled);
    cursor: not-allowed;
  }

  :host([state='disabled']) .textarea::placeholder,
  :host([disabled]) .textarea::placeholder {
    color: var(--_placeholder-disabled);
  }

  /* ---- Resize modes ---- */

  /* Default when the attribute has not been reflected yet. */
  .textarea {
    resize: vertical;
  }

  :host([resize='none']) .textarea {
    resize: none;
  }

  :host([resize='vertical']) .textarea {
    resize: vertical;
  }

  /*
   * Auto-grow: the element drives its own height from --_auto-height, which the
   * component writes after measuring the content. The drag handle is disabled because
   * the height is no longer the user's to control, and the scrollbar is suppressed
   * because the box always matches its content.
   */
  :host([resize='auto']) .textarea {
    resize: none;
    height: var(--_auto-height, auto);
    overflow-y: hidden;
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

  :host([label-placement='inner']) .textarea {
    padding-block-start: calc(
      var(--_padding-stack) - 2 * var(--_border-width) + var(--_inner-label-size) +
        var(--_inside_label_vertical_gap)
    );
    padding-block-end: calc(var(--_padding-stack) - 2 * var(--_border-width));
  }

  /* ---- Floating label ---- */

  /*
   * Floating label sits after <textarea> in DOM so the ~ combinator works.
   * The textarea uses placeholder=" " (single space) to drive :placeholder-shown state.
   * When empty+unfocused: label sits on the first text line = acts as a placeholder.
   * When filled or focused: label shrunken onto the top border.
   *
   * Unlike the single-line field the resting position is the top of the box, not its
   * vertical centre — a textarea's first line is where the user starts typing.
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

  /* Empty + unfocused: label rests on the first text line */
  :host([label-placement='floating']) .textarea:placeholder-shown ~ .label {
    top: var(--_padding-stack);
    transform: translateY(0);
    font-size: var(--_font-size);
    line-height: var(--size-6);
    color: var(--_placeholder);
    padding: 0;
    background: var(--_bg);
    left: var(--_padding-inline);
  }

  /* Filled or focused: label shrunken onto the top border */
  :host([label-placement='floating']) .field-wrapper:focus-within .label {
    top: calc(var(--size-3) * -1);
    transform: translateY(0);
    font-size: var(--control-label-floating-font-size);
    line-height: var(--control-label-floating-line-height);
    color: var(--_label-active);
    padding: 0 var(--size-1);
    background-color: var(--_label-chip-bg);
    left: var(--size-2);
  }

  /* Floating label state colors */

  :host([state='success'][label-placement='floating']) .textarea:not(:placeholder-shown) ~ .label {
    color: var(--_label-success);
  }

  :host([state='error'][label-placement='floating']) .textarea:not(:placeholder-shown) ~ .label {
    color: var(--_label-error);
  }

  :host([state='disabled'][label-placement='floating']) .label,
  :host([disabled][label-placement='floating']) .label {
    color: var(--_label-disabled);
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
