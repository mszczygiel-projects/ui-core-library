import { css } from 'lit';

/*
 * The popover panel already provides surface, border, radius, shadow, and
 * padding via popover/* tokens — this component only arranges its content.
 */
export const datePickerStyles = css`
  :host {
    display: inline-block;
  }

  /*
   * The popover is inline-block on its own (it usually wraps a button), which
   * would shrink-to-fit the trigger and leave a full-width field — DateField's
   * .field-wrapper — narrower than its host. The picker's own :host display
   * stays the single width knob: inline-block here, overridden to block by
   * DateField. Consumers cannot reach this rule (no exportparts across the
   * picker's shadow root), so the fix belongs to the library.
   */
  ui-popover {
    display: block;
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: var(--date-picker-gap);
  }

  .footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--date-picker-gap);
  }
`;
