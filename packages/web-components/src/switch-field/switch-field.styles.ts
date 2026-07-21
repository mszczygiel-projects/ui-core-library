import { css } from 'lit';

export const switchFieldStyles = css`
  :host {
    display: inline-flex;
    font-family: var(--switch-field-font-family);
    font-weight: var(--switch-field-font-weight);
    font-size: var(--switch-field-font-size);
    letter-spacing: var(--switch-field-letter-spacing);

    /* Thumb inset and travel are derived from the track geometry, so changing a
       single size token keeps the control proportional. */
    --_inset: calc((var(--switch-track-height) - var(--switch-thumb-size)) / 2);
    --_travel: calc(
      var(--switch-track-width) - (2 * var(--switch-border-width)) - var(--switch-thumb-size) -
        (2 * var(--_inset))
    );

    --_track: var(--color-switch-track-default);
    --_border: var(--color-switch-border-default);
    --_thumb: var(--color-switch-thumb-default);
    --_icon: var(--color-switch-icon-default);
  }

  :host([label-position='left']) {
    /* This layout only makes sense as a full-width settings row. */
    display: flex;
    width: 100%;
  }

  :host([disabled]),
  :host([state='disabled']) {
    pointer-events: none;
  }

  /* ---- Colour states ---- */

  :host([checked]) {
    --_track: var(--color-switch-checked-track-default);
    --_border: var(--color-switch-checked-border-default);
    --_thumb: var(--color-switch-checked-thumb-default);
    --_icon: var(--color-switch-checked-icon-default);
  }

  :host(:hover) {
    --_track: var(--color-switch-track-hover);
    --_border: var(--color-switch-border-hover);
    --_thumb: var(--color-switch-thumb-hover);
    --_icon: var(--color-switch-icon-hover);
  }

  :host([checked]:hover) {
    --_track: var(--color-switch-checked-track-hover);
    --_border: var(--color-switch-checked-border-hover);
    --_thumb: var(--color-switch-checked-thumb-hover);
    --_icon: var(--color-switch-checked-icon-hover);
  }

  :host(:focus-within) {
    --_track: var(--color-switch-track-active);
    --_border: var(--color-switch-border-active);
    --_thumb: var(--color-switch-thumb-active);
    --_icon: var(--color-switch-icon-active);
  }

  :host([checked]:focus-within) {
    --_track: var(--color-switch-checked-track-active);
    --_border: var(--color-switch-checked-border-active);
    --_thumb: var(--color-switch-checked-thumb-active);
    --_icon: var(--color-switch-checked-icon-active);
  }

  :host([state='error']),
  :host([state='error']:hover),
  :host([state='error']:focus-within) {
    --_track: var(--color-switch-track-error);
    --_border: var(--color-switch-border-error);
    --_thumb: var(--color-switch-thumb-error);
    --_icon: var(--color-switch-icon-error);
  }

  :host([state='error'][checked]),
  :host([state='error'][checked]:hover),
  :host([state='error'][checked]:focus-within) {
    --_track: var(--color-switch-checked-track-error);
    --_border: var(--color-switch-checked-border-error);
    --_thumb: var(--color-switch-checked-thumb-error);
    --_icon: var(--color-switch-checked-icon-error);
  }

  :host([disabled]),
  :host([state='disabled']) {
    --_track: var(--color-switch-track-disabled);
    --_border: var(--color-switch-border-disabled);
    --_thumb: var(--color-switch-thumb-disabled);
    --_icon: var(--color-switch-icon-disabled);
  }

  :host([disabled][checked]),
  :host([state='disabled'][checked]) {
    --_track: var(--color-switch-checked-track-disabled);
    --_border: var(--color-switch-checked-border-disabled);
    --_thumb: var(--color-switch-checked-thumb-disabled);
    --_icon: var(--color-switch-checked-icon-disabled);
  }

  /* ---- Layout ---- */

  .row {
    display: flex;
    flex: 1;
    align-items: flex-start;
    gap: var(--switch-field-gap);
    cursor: pointer;
  }

  :host([label-position='left']) .row {
    flex-direction: row-reverse;
  }

  :host([disabled]) .row,
  :host([state='disabled']) .row {
    cursor: not-allowed;
  }

  /* ---- Control ---- */

  .control {
    position: relative;
    display: inline-flex;
    flex-shrink: 0;
    /* Match the label's first line box so the control lines up with the label. */
    height: var(--switch-field-line-height);
    align-items: center;
  }

  .track {
    position: relative;
    box-sizing: border-box;
    width: var(--switch-track-width);
    height: var(--switch-track-height);
    border: var(--switch-border-width) solid var(--_border);
    border-radius: var(--switch-radius);
    background-color: var(--_track);
    transition:
      background-color var(--duration-150) ease,
      border-color var(--duration-150) ease;
  }

  :host(:focus-within) .track {
    outline: var(--stroke-ring) var(--ring-style) var(--color-ring-default);
    outline-offset: var(--ring-offset);
  }

  .thumb {
    position: absolute;
    top: 50%;
    left: var(--_inset);
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--switch-thumb-size);
    height: var(--switch-thumb-size);
    border-radius: var(--switch-radius);
    background-color: var(--_thumb);
    translate: 0 -50%;
    transition:
      translate var(--duration-150) ease,
      background-color var(--duration-150) ease;
  }

  :host([checked]) .thumb {
    translate: var(--_travel) -50%;
  }

  /* ---- Hidden native input ---- */

  .input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    opacity: 0;
    cursor: inherit;
  }

  /* ---- Icons ---- */

  .icon {
    display: none;
    align-items: center;
    justify-content: center;
    width: var(--switch-icon-size);
    height: var(--switch-icon-size);
    color: var(--_icon);
  }

  .icon ::slotted(*) {
    width: 100%;
    height: 100%;
    display: block;
  }

  .icon--off {
    display: flex;
  }

  :host([checked]) .icon--off {
    display: none;
  }

  :host([checked]) .icon--on {
    display: flex;
  }

  /* ---- Text ---- */

  .text {
    display: flex;
    flex: 1;
    min-width: 0;
    flex-direction: column;
    gap: var(--switch-description-gap);
  }

  .text:empty {
    display: none;
  }

  .label {
    line-height: var(--switch-field-line-height);
    color: var(--color-control-outline-text-default);
  }

  :host(:hover) .label {
    color: var(--color-control-outline-text-hover);
  }

  :host(:focus-within) .label {
    color: var(--color-control-outline-text-active);
  }

  :host([state='error']) .label,
  :host([state='error']:hover) .label,
  :host([state='error']:focus-within) .label {
    color: var(--color-control-outline-text-error);
  }

  :host([disabled]) .label,
  :host([state='disabled']) .label {
    color: var(--color-control-outline-text-disabled);
  }

  .description {
    font-size: var(--control-hint-font-size);
    line-height: var(--control-hint-line-height);
    font-weight: var(--control-hint-font-weight);
    color: var(--color-control-outline-hint-default);
  }

  :host(:hover) .description {
    color: var(--color-control-outline-hint-hover);
  }

  :host(:focus-within) .description {
    color: var(--color-control-outline-hint-active);
  }

  :host([state='error']) .description,
  :host([state='error']:hover) .description,
  :host([state='error']:focus-within) .description {
    color: var(--color-control-outline-hint-error);
  }

  :host([disabled]) .description,
  :host([state='disabled']) .description {
    color: var(--color-control-outline-hint-disabled);
  }
`;
