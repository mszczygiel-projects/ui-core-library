import { copyValidity } from './form-value.ts';

/** What a checkable control gives the controller of its form state. */
export interface CheckedControlOptions {
  /** Getters, since Stencil attaches the host and its internals after the fields initialize. */
  readonly host: () => HTMLElement;
  readonly internals: () => ElementInternals;
  /** The rendered native checkbox, or null before the first render. */
  readonly control: () => HTMLInputElement | null;
  readonly name: () => string | undefined;
  /** The string the form submits while the control is checked. */
  readonly value: () => string;
  readonly required: () => boolean;
  /** Disabled directly or by the owning fieldset. */
  readonly disabled: () => boolean;
  /** Receives the checked state that a reset or a restore sets. */
  readonly onChecked: (checked: boolean) => void;
}

/**
 * The form state of a form-associated checkbox, which CheckboxField and SwitchField share. The
 * `checked` attribute supplies the initial and reset state, and the property the current one, as
 * on a native checkbox. The entry and the validity follow the state at each render.
 */
export class CheckedControl {
  private customValidity = '';

  constructor(private readonly options: CheckedControlOptions) {}

  /** Restores the state of the attribute without emitting an event. */
  reset(): void {
    this.options.onChecked(this.options.host().hasAttribute('checked'));
  }

  /** Restores the state the browser saved. */
  restoreState(state: string | File | FormData | null): void {
    if (typeof state === 'string') {
      this.options.onChecked(state === 'on');
    }
  }

  setCustomValidity(message: string): void {
    this.customValidity = message;
    this.sync(this.options.control()?.checked ?? false);
  }

  /**
   * Gives the form the entry of a checked control and copies the validity of the native checkbox.
   * Before the first render, which Stencil runs later, a detached checkbox with the same
   * constraints answers, so that a form checks the control as soon as it joins.
   */
  sync(checked: boolean): void {
    const { internals, name, value, disabled } = this.options;
    const entryName = name();
    // The entry carries its name, which Stencil writes on the host only when it renders. The saved
    // state is the checkedness, whatever the value, as a browser saves it for a native checkbox.
    if (checked && !disabled() && entryName !== undefined && entryName !== '') {
      const entry = new FormData();
      entry.append(entryName, value());
      internals().setFormValue(entry, 'on');
    } else {
      internals().setFormValue(null, checked ? 'on' : 'off');
    }
    const rendered = this.options.control();
    const control = rendered ?? this.detached(checked);
    control.setCustomValidity(this.customValidity);
    copyValidity(internals(), control, rendered ?? undefined);
  }

  private detached(checked: boolean): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = checked;
    input.required = this.options.required();
    input.disabled = this.options.disabled();
    return input;
  }
}
