import { css } from 'lit';

export const checkboxFieldStyles = css`
  :host {
    display: inline-block;
    font-family: var(--checkbox-field-font-family);
    font-weight: var(--checkbox-field-font-weight);
    font-size: var(--checkbox-field-font-size);
    letter-spacing: var(--checkbox-field-letter-spacing);
  }

  :host([disabled]),
  :host([state='disabled']) {
    pointer-events: none;
  }

  /* ---- Label row ---- */

  .label-row {
    display: flex;
    align-items: flex-start;
    gap: var(--checkbox-field-gap);
    cursor: pointer;
  }

  /* ---- Checkbox box ---- */

  .box {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: var(--checkbox-size-default);
    height: var(--checkbox-size-default);
    border: var(--checkbox-border-width) solid var(--color-checkbox-border-default);
    border-radius: var(--checkbox-radius);
    background-color: var(--color-checkbox-background-default);
    color: var(--color-checkbox-checked-mark-default);
    transition:
      border-color var(--duration-150) ease,
      background-color var(--duration-150) ease;
  }

  /* ---- Mark (check / dash) ---- */

  .box::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    display: none;
  }

  :host([checked]) .box::after {
    display: block;
    width: 5px;
    height: 9px;
    border-right: 2px solid currentColor;
    border-bottom: 2px solid currentColor;
    transform: translate(-50%, -60%) rotate(45deg);
  }

  :host([indeterminate]) .box::after {
    display: block;
    width: 10px;
    height: 2px;
    background-color: currentColor;
    border-radius: 1px;
    transform: translate(-50%, -50%);
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

  :host(:hover) .box {
    border-color: var(--color-checkbox-border-hover);
  }

  :host([checked]:hover) .box,
  :host([indeterminate]:hover) .box {
    background-color: var(--color-checkbox-checked-background-hover);
    border-color: var(--color-checkbox-checked-border-hover);
    color: var(--color-checkbox-checked-mark-hover);
  }

  /* ---- Checked / indeterminate ---- */

  :host([checked]) .box,
  :host([indeterminate]) .box {
    background-color: var(--color-checkbox-checked-background-default);
    border-color: var(--color-checkbox-checked-border-default);
  }

  /* ---- Focus ring ---- */

  .box:focus-within {
    border-color: var(--color-checkbox-border-active);
    outline: var(--stroke-ring) var(--ring-style) var(--color-ring-default);
    outline-offset: var(--ring-offset);
  }

  :host([checked]) .box:focus-within,
  :host([indeterminate]) .box:focus-within {
    background-color: var(--color-checkbox-checked-background-active);
    border-color: var(--color-checkbox-checked-border-active);
    color: var(--color-checkbox-checked-mark-active);
  }

  /* ---- Error state ---- */

  :host([state='error']) .box {
    border-color: var(--color-checkbox-border-error);
  }

  :host([state='error']:hover) .box {
    border-color: var(--color-checkbox-border-error);
  }

  :host([state='error'][checked]) .box,
  :host([state='error'][indeterminate]) .box {
    background-color: var(--color-checkbox-checked-background-error);
    border-color: var(--color-checkbox-checked-border-error);
    color: var(--color-checkbox-checked-mark-error);
  }

  :host([state='error'][checked]:hover) .box,
  :host([state='error'][indeterminate]:hover) .box {
    background-color: var(--color-checkbox-checked-background-error);
    border-color: var(--color-checkbox-checked-border-error);
  }

  /* ---- Disabled state ---- */

  :host([disabled]) .box,
  :host([state='disabled']) .box {
    border-color: var(--color-checkbox-border-disabled);
    background-color: var(--color-checkbox-background-disabled);
  }

  :host([disabled][checked]) .box,
  :host([disabled][indeterminate]) .box,
  :host([state='disabled'][checked]) .box,
  :host([state='disabled'][indeterminate]) .box {
    background-color: var(--color-checkbox-checked-background-disabled);
    border-color: var(--color-checkbox-checked-border-disabled);
    color: var(--color-checkbox-checked-mark-disabled);
  }

  /* ---- Label text ---- */

  .label-text {
    flex: 1;
    min-width: 0;
    line-height: var(--checkbox-field-line-height);
    color: var(--color-control-outline-label-default);
  }

  :host(:hover) .label-text {
    color: var(--color-control-outline-label-hover);
  }

  .label-row:focus-within .label-text {
    color: var(--color-control-outline-label-active);
  }

  :host([state='error']) .label-text,
  :host([state='error']:hover) .label-text {
    color: var(--color-control-outline-label-error);
  }

  :host([disabled]) .label-text,
  :host([state='disabled']) .label-text {
    color: var(--color-control-outline-label-disabled);
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
