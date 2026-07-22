import { css } from 'lit';

/**
 * Size ramp and per-variant colour aliases shared by the field components
 * (`ui-select-field`, `ui-combobox`).
 *
 * Defines private custom properties only — no element selectors — so each
 * component consumes them with its own class names. Keyed off `data-size` and
 * the `variant` attribute on the host, both of which every field carries.
 */
export const controlFieldStyles = css`
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
`;
