/**
 * Gives the owning form the entry of a control. A string value takes its name from the `name`
 * attribute, which Stencil writes only when it renders, so the entry carries the name itself. A
 * control without a name submits nothing, as a native control does. A value that is not
 * `restorable`, such as a password, gives the browser no state to save and restore.
 */
export function submitNamed(
  internals: ElementInternals,
  name: string | undefined,
  value: string,
  restorable = true,
): void {
  if (name === undefined || name === '') {
    internals.setFormValue(null);
    return;
  }
  const entry = new FormData();
  entry.append(name, value);
  internals.setFormValue(entry, restorable ? value : null);
}

/**
 * Copies the validity of a native control to the host. `anchor` is the rendered control, where the
 * browser shows its message; without it, the validity comes from a control not on the page.
 */
export function copyValidity(
  internals: ElementInternals,
  control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  anchor: HTMLElement | undefined,
): void {
  const validity = control.validity;
  internals.setValidity(
    control.willValidate
      ? {
          badInput: validity.badInput,
          customError: validity.customError,
          patternMismatch: validity.patternMismatch,
          rangeOverflow: validity.rangeOverflow,
          rangeUnderflow: validity.rangeUnderflow,
          stepMismatch: validity.stepMismatch,
          tooLong: validity.tooLong,
          tooShort: validity.tooShort,
          typeMismatch: validity.typeMismatch,
          valueMissing: validity.valueMissing,
        }
      : {},
    control.validationMessage,
    anchor,
  );
}
