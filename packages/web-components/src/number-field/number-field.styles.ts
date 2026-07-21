import { css } from 'lit';

export const numberFieldStyles = css`
  .stepper {
    all: unset;
    box-sizing: border-box;
    cursor: pointer;
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: var(--_icon-size);
    height: var(--_icon-size);
    color: var(--_icon);
    /* Press-and-hold must not scroll the page or select text on touch. */
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }

  /*
   * The all:unset above wipes the inset that .icon--leading / .icon--trailing
   * apply in textFieldStyles, and numberFieldStyles is loaded after them — so
   * the steppers would sit flush against the border. Re-apply it as margin
   * (not padding: the button is border-box at exactly --_icon-size, so padding
   * would shrink the glyph instead of insetting it).
   */
  .stepper.icon--leading {
    margin-inline-start: var(--_padding-inline);
  }

  .stepper.icon--trailing {
    margin-inline-end: var(--_padding-inline);
  }

  .stepper svg {
    display: inline-flex;
    width: var(--_icon-size);
    height: var(--_icon-size);
    color: inherit;
    flex-shrink: 0;
  }

  .field-wrapper:hover .stepper {
    color: var(--_icon-hover);
  }

  .field-wrapper:focus-within .stepper {
    color: var(--_icon-active);
  }

  .stepper:focus-visible {
    outline: var(--stroke-ring) var(--ring-style) var(--color-ring-default);
    outline-offset: var(--ring-offset);
    border-radius: var(--radius-sm);
  }

  :host([state='success']) .stepper {
    color: var(--_icon-success);
  }

  :host([state='error']) .stepper {
    color: var(--_icon-error);
  }

  .stepper[disabled],
  :host([state='disabled']) .stepper,
  :host([disabled]) .stepper {
    color: var(--_icon-disabled);
    cursor: not-allowed;
    pointer-events: none;
  }

  /* The value sits between the two steppers, so it reads centred. */
  :host([controls='inline']) .input {
    text-align: center;
  }
`;
