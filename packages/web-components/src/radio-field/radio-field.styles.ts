import { css } from 'lit';

export const radioFieldStyles = css`
  :host {
    display: inline-block;
    font-family: var(--radio-field-font-family);
    font-weight: var(--radio-field-font-weight);
    font-size: var(--radio-field-font-size);
    letter-spacing: var(--radio-field-letter-spacing);
  }

  :host([disabled]),
  :host([state='disabled']) {
    pointer-events: none;
  }

  /* ---- Label row ---- */

  .label-row {
    display: flex;
    align-items: flex-start;
    gap: var(--radio-field-gap);
    cursor: pointer;
  }

  /* ---- Radio control ---- */

  .control {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: var(--radio-size-default);
    height: var(--radio-size-default);
    border: var(--radio-border-width) solid var(--color-radio-border-default);
    border-radius: var(--radio-radius);
    background-color: var(--color-radio-background-default);
    transition:
      border-color var(--duration-150) ease,
      background-color var(--duration-150) ease;
  }

  /* ---- Inner dot ---- */

  .control::after {
    content: '';
    position: absolute;
    inset: var(--radio-border-inner-width);
    border-radius: var(--radio-radius);
    background-color: var(--color-radio-checked-dot-default);
    display: none;
    transition: background-color var(--duration-150) ease;
  }

  /* ---- Hidden input ---- */

  .input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    margin: 0;
  }

  :host([disabled]) .input,
  :host([state='disabled']) .input {
    cursor: not-allowed;
  }

  /* ---- Hover ---- */

  :host(:hover) .control {
    border-color: var(--color-radio-border-hover);
  }

  :host([checked]:hover) .control {
    background-color: var(--color-radio-checked-background-hover);
    border-color: var(--color-radio-checked-border-hover);
  }

  :host([checked]:hover) .control::after {
    background-color: var(--color-radio-checked-dot-hover);
  }

  /* ---- Checked ---- */

  :host([checked]) .control {
    background-color: var(--color-radio-checked-background-default);
    border-color: var(--color-radio-checked-border-default);
  }

  :host([checked]) .control::after {
    display: block;
  }

  /* ---- Focus ring ---- */

  .control:focus-within {
    border-color: var(--color-radio-border-active);
    outline: var(--stroke-ring) var(--ring-style) var(--color-ring-default);
    outline-offset: var(--ring-offset);
  }

  :host([checked]) .control:focus-within {
    background-color: var(--color-radio-checked-background-active);
    border-color: var(--color-radio-checked-border-active);
  }

  :host([checked]) .control:focus-within::after {
    background-color: var(--color-radio-checked-dot-active);
  }

  /* ---- Error state ---- */

  :host([state='error']) .control {
    border-color: var(--color-radio-border-error);
  }

  :host([state='error']:hover) .control {
    border-color: var(--color-radio-border-error);
  }

  :host([state='error'][checked]) .control {
    background-color: var(--color-radio-checked-background-error);
    border-color: var(--color-radio-checked-border-error);
  }

  :host([state='error'][checked]) .control::after {
    background-color: var(--color-radio-checked-dot-error);
  }

  :host([state='error'][checked]:hover) .control {
    background-color: var(--color-radio-checked-background-error);
    border-color: var(--color-radio-checked-border-error);
  }

  /* ---- Disabled state ---- */

  :host([disabled]) .control,
  :host([state='disabled']) .control {
    border-color: var(--color-radio-border-disabled);
    background-color: var(--color-radio-background-disabled);
  }

  :host([disabled][checked]) .control,
  :host([state='disabled'][checked]) .control {
    background-color: var(--color-radio-checked-background-disabled);
    border-color: var(--color-radio-checked-border-disabled);
  }

  :host([disabled][checked]) .control::after,
  :host([state='disabled'][checked]) .control::after {
    background-color: var(--color-radio-checked-dot-disabled);
  }

  /* ---- Label text ---- */

  .label-text {
    flex: 1;
    min-width: 0;
    line-height: var(--radio-field-line-height);
    color: var(--color-control-outline-text-default);
  }

  :host(:hover) .label-text {
    color: var(--color-control-outline-text-hover);
  }

  .label-row:focus-within .label-text {
    color: var(--color-control-outline-text-active);
  }

  :host([state='error']) .label-text,
  :host([state='error']:hover) .label-text {
    color: var(--color-control-outline-text-error);
  }

  :host([disabled]) .label-text,
  :host([state='disabled']) .label-text {
    color: var(--color-control-outline-text-disabled);
  }

  /* ---- Hint ---- */

  .hint {
    display: block;
    margin: 0;
    margin-block-start: var(--spacing-2);
    font-size: var(--control-hint-font-size);
    line-height: var(--control-hint-line-height);
    font-weight: var(--control-hint-font-weight);
    color: var(--color-control-outline-hint-default);
  }

  :host(:hover) .hint {
    color: var(--color-control-outline-hint-hover);
  }

  :host(:focus-within) .hint {
    color: var(--color-control-outline-hint-active);
  }

  :host([state='error']) .hint,
  :host([state='error']:hover) .hint,
  :host([state='error']:focus-within) .hint {
    color: var(--color-control-outline-hint-error);
  }

  :host([disabled]) .hint,
  :host([state='disabled']) .hint {
    color: var(--color-control-outline-hint-disabled);
  }
`;
