/** What a form-associated action needs to submit or reset its outer form. */
export interface FormAction {
  /** Disabled directly or by the owning fieldset, which stops the action even during the click. */
  readonly disabled: boolean;
  readonly name: string | undefined;
  /** The submitted value; a page that removes the value attribute leaves null. */
  readonly value: unknown;
}

/**
 * Cancels a click on a disabled or loading action where it starts, before it bubbles to the page.
 * A click that starts on an active action completes, even when a handler then starts loading.
 */
export function cancelInactiveClick(event: Event, inactive: boolean): void {
  if (inactive) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}

/**
 * Runs the submit or reset of the internal form of an action on its outer form. The internal form
 * receives the native action after the click dispatch finishes, as a native button does, so that a
 * listener anywhere on the page can still cancel the click.
 */
export function runFormAction(event: Event, internals: ElementInternals, action: FormAction): void {
  event.preventDefault();
  event.stopPropagation();
  const form = internals.form;
  if (action.disabled || form === null) {
    return;
  }
  if (event.type === 'reset') {
    form.reset();
    return;
  }
  submit(form, internals, action);
}

function submit(form: HTMLFormElement, internals: ElementInternals, action: FormAction): void {
  const dialog = form.method === 'dialog' ? form.closest('dialog') : null;
  const open = dialog?.open === true;
  let submission: Event | undefined;
  const record = (event: Event) => {
    submission = event;
  };
  form.addEventListener('submit', record, { capture: true });
  const submitted = typeof action.value === 'string' ? action.value : '';
  internals.setFormValue(action.name !== undefined && action.name !== '' ? submitted : null);
  try {
    form.requestSubmit();
  } finally {
    form.removeEventListener('submit', record, { capture: true });
    internals.setFormValue(null);
  }
  // A native submit button gives the dialog that its form closes its value as the return value.
  // A submission without a submitter cannot, so the action sets it.
  if (dialog !== null && open && submission?.defaultPrevented === false) {
    dialog.returnValue = submitted;
  }
}

/** Adds or removes a custom state of the host, which authors style with `:state()`. */
export function setState(internals: ElementInternals, name: string, on: boolean): void {
  if (on) {
    internals.states.add(name);
  } else {
    internals.states.delete(name);
  }
}
