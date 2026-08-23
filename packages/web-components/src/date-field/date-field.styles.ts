import { css } from 'lit';

export const dateFieldStyles = css`
  /* Stretch the nested picker/popover chain so the field — and the panel
     anchored to it — spans the host. The picker passes this down to its own
     popover (date-picker.styles.ts); ::part() cannot cross that second shadow
     boundary. */
  ui-date-picker {
    display: block;
  }

  /* Calendar toggle button (trailing icon), mirrors SearchField's clear. */
  .calendar-toggle {
    all: unset;
    box-sizing: border-box;
    cursor: pointer;
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    margin-inline-end: var(--_padding-inline);
    width: var(--_icon-size);
    height: var(--_icon-size);
    color: var(--_icon-action);
  }

  .calendar-toggle svg {
    display: inline-flex;
    flex-shrink: 0;
    width: var(--_icon-size);
    height: var(--_icon-size);
    color: inherit;
  }

  .field-wrapper:hover .calendar-toggle {
    color: var(--_icon-action-hover);
  }

  .field-wrapper:focus-within .calendar-toggle {
    color: var(--_icon-action-active);
  }

  .calendar-toggle:disabled {
    cursor: not-allowed;
  }

  /* Typed-text validation failure: minimal error treatment on top of the
     consumer-controlled state (full error state stays a consumer decision). */
  :host([data-invalid]) .field-wrapper {
    border-color: var(--color-control-outline-border-error);
  }

  :host([data-invalid][variant='filled']) .field-wrapper {
    border-color: var(--color-control-filled-border-error);
  }
`;
