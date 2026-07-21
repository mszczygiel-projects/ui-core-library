import { css } from 'lit';

/*
 * The popover panel already provides surface, border, radius, shadow, and
 * padding via popover/* tokens — this component only arranges its content.
 */
export const datePickerStyles = css`
  :host {
    display: inline-block;
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
