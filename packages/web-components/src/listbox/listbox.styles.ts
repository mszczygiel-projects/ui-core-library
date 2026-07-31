import { css } from 'lit';

/**
 * Styles for the shared option-list surface.
 *
 * Added to the `static styles` of whichever component renders the list
 * (`ui-select-field`, `ui-combobox`) rather than living in its own element —
 * ARIA id references such as `aria-activedescendant` cannot cross a shadow
 * boundary, so the list must render in the same shadow root as the trigger.
 *
 * Self-contained: the host only has to carry `data-size`.
 */
export const listboxStyles = css`
  /* ---- Size ramp ---- */

  :host,
  :host([data-size='default']) {
    --_lb-font-size: var(--control-font-size);
    --_lb-line-height: var(--control-line-height);
    --_lb-option-gap: var(--select-option-gap);
    --_lb-option-padding-stack: var(--select-option-padding-stack);
    --_lb-icon-size: var(--control-icon-size);
  }

  :host([data-size='small']) {
    --_lb-font-size: var(--control-small-font-size);
    --_lb-line-height: var(--control-small-line-height);
    --_lb-option-gap: var(--select-option-small-gap);
    --_lb-option-padding-stack: var(--select-option-small-padding-stack);
    --_lb-icon-size: var(--control-small-icon-size);
  }

  :host([data-size='large']) {
    --_lb-font-size: var(--control-large-font-size);
    --_lb-line-height: var(--control-large-line-height);
    --_lb-option-gap: var(--select-option-gap);
    --_lb-option-padding-stack: var(--select-option-large-padding-stack);
    --_lb-icon-size: var(--control-large-icon-size);
  }

  /* ---- Surface ---- */

  .listbox {
    box-sizing: border-box;
    overflow-y: auto;
    max-height: var(--listbox-max-height, var(--select-dropdown-max-height));
    padding: var(--select-dropdown-padding);
    display: flex;
    flex-direction: column;
    background-color: var(--color-select-dropdown-background);
    border: var(--select-dropdown-border-width) solid var(--color-select-dropdown-border);
    border-radius: var(--select-dropdown-radius);
    box-shadow: var(--shadow-md);
  }

  .listbox:focus,
  .listbox:focus-visible {
    /* Focus stays on the trigger; the list is driven by aria-activedescendant. */
    outline: none;
  }

  /* ---- Group ---- */

  /*
   * Grouped lists inset the options instead of the panel, so the sticky header
   * and its rule can run edge to edge.
   */
  .listbox--grouped {
    padding-inline: 0;
    gap: var(--select-dropdown-gap);
  }

  /* Header and options sit one gap apart, same as two adjacent groups do. */
  .listbox__group {
    display: flex;
    flex-direction: column;
    gap: var(--select-dropdown-gap);
  }

  .listbox__group-options {
    padding-inline: var(--select-dropdown-padding);
  }

  /*
   * Border-only variant of the group header: an unlabelled group is announced
   * by nothing but the rule that divides it from the group above.
   */
  .listbox__group-separator {
    flex: none;
    border-block-end: var(--select-dropdown-border-width) solid var(--color-select-dropdown-border);
  }

  .listbox__group-header {
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    min-height: var(--size-12);
    border-block-end: var(--select-dropdown-border-width) solid var(--color-select-dropdown-border);
    padding-block: var(--select-option-group-padding-stack);
    padding-inline: var(--select-option-group-padding-inline);
    background-color: var(--color-select-option-group-background);
    color: var(--color-select-option-group-text);
    font-family: var(--select-option-group-font-family);
    font-size: var(--select-option-group-font-size);
    font-weight: var(--select-option-group-font-weight);
    line-height: var(--select-option-group-line-height);
    letter-spacing: var(--select-option-group-letter-spacing);
    text-transform: var(--select-option-group-text-transform);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ---- Option ---- */

  .option {
    display: flex;
    align-items: center;
    gap: var(--_lb-option-gap);
    padding-block: var(--_lb-option-padding-stack);
    padding-inline: var(--select-option-padding-inline);
    border-radius: var(--select-option-radius);
    cursor: pointer;
    font-family: var(--control-font-family);
    font-size: var(--_lb-font-size);
    font-weight: var(--control-font-weight);
    line-height: var(--_lb-line-height);
    letter-spacing: var(--control-letter-spacing);
    color: var(--color-select-option-text-default);
    background-color: var(--color-select-option-background-default);
    transition:
      background-color var(--duration-100) ease,
      color var(--duration-100) ease;
  }

  .option__icon {
    display: inline-flex;
    flex-shrink: 0;
    width: var(--_lb-icon-size);
    height: var(--_lb-icon-size);
    /* Inherits the option colour, matching the design's per-state icon binding. */
    color: inherit;
  }

  .option__icon svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  .option__label {
    flex: 1 1 auto;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .option:hover,
  .option--active {
    background-color: var(--color-select-option-background-hover);
    color: var(--color-select-option-text-hover);
  }

  /*
   * Single-select marks the chosen row with the active surface. In multi-select
   * that job belongs to the checkbox, so the row keeps its neutral background
   * and the active surface stays free for the keyboard-highlighted row —
   * otherwise five selections read as a wall of blue.
   */
  .listbox:not(.listbox--multiple) .option--selected,
  .listbox:not(.listbox--multiple) .option--selected:hover,
  .listbox:not(.listbox--multiple) .option--selected.option--active {
    background-color: var(--color-select-option-background-active);
    color: var(--color-select-option-text-active);
  }

  .option--disabled {
    color: var(--color-select-option-text-disabled);
    background-color: var(--color-select-option-background-disabled);
    cursor: not-allowed;
    pointer-events: none;
  }

  /* ---- Multi-select checkbox ---- */

  /*
   * The selected indicator is a checkbox, not a bare tick, and it trails the
   * label. Visuals mirror ui-checkbox-field so the two never drift apart.
   */
  .option__checkbox {
    position: relative;
    box-sizing: border-box;
    flex-shrink: 0;
    width: var(--checkbox-size-default);
    height: var(--checkbox-size-default);
    border: var(--checkbox-border-width) solid var(--color-checkbox-border-default);
    border-radius: var(--checkbox-radius);
    background-color: var(--color-checkbox-background-default);
    color: var(--color-checkbox-checked-mark-default);
  }

  .option--selected .option__checkbox {
    background-color: var(--color-checkbox-checked-background-default);
    border-color: var(--color-checkbox-checked-border-default);
  }

  .option__checkbox::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    display: none;
    width: 5px;
    height: 9px;
    border-right: 2px solid currentColor;
    border-bottom: 2px solid currentColor;
    transform: translate(-50%, -60%) rotate(45deg);
  }

  .option--selected .option__checkbox::after {
    display: block;
  }

  /* ---- Create affordance ---- */

  .option--create {
    color: var(--color-select-option-create-text);
  }

  /* Only the leading word is emphasised; the quoted query stays regular. */
  .option__create-prefix {
    font-weight: var(--typography-body-font-weight-strong);
  }

  /* The plus stays neutral while the label carries the accent colour. */
  .option--create .option__icon {
    color: var(--color-icon-default);
  }

  /* ---- Empty / loading message ---- */

  .listbox__message {
    display: flex;
    align-items: center;
    gap: var(--_lb-option-gap);
    padding-block: var(--_lb-option-padding-stack);
    padding-inline: var(--select-option-padding-inline);
    font-family: var(--control-font-family);
    font-size: var(--_lb-font-size);
    font-weight: var(--control-font-weight);
    line-height: var(--_lb-line-height);
    letter-spacing: var(--control-letter-spacing);
    color: var(--color-select-empty-text);
  }
`;
