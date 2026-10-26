/**
 * The form API that a form-associated component exposes on its element, synchronously, as native
 * controls do. Stencil types an element from its props and methods only, so each component adds
 * this interface to the type of its element.
 */
export interface FormAssociated {
  /** The outer form associated by the browser, including an explicit `form` attribute. */
  readonly form: HTMLFormElement | null;
  /** The validity of the control. */
  readonly validity: ValidityState;
  /** The browser's validation message. */
  readonly validationMessage: string;
  /** Whether the browser includes the control in constraint validation. */
  readonly willValidate: boolean;
  /** Checks the validity of the control. */
  checkValidity(): boolean;
  /** Reports the validity of the control to the user. */
  reportValidity(): boolean;
}
