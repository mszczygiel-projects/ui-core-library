import type { ListboxOption, ListboxValue } from '@mszczygiel-projects/ui-core-shared/listbox';
import { normalizeValue, valuesOf } from '@mszczygiel-projects/ui-core-shared/listbox-navigation';

import { followAttribute } from './follow-attribute.ts';
import { copyValidity } from './form-value.ts';

/** What a list of options gives the controller of its value and form. */
export interface ListboxValueOptions {
  /** Getters, since Stencil attaches the host and its internals after the fields initialize. */
  readonly host: () => HTMLElement;
  readonly internals: () => ElementInternals;
  readonly name: () => string | undefined;
  readonly multiple: () => boolean;
  readonly required: () => boolean;
  /** Disabled directly or by the owning fieldset. */
  readonly disabled: () => boolean;
  readonly options: () => readonly ListboxOption<unknown>[];
  /** The element where the browser shows the validation message, or null before it renders. */
  readonly anchor: () => HTMLElement | null;
  /** Receives every new current value, which the component renders. */
  readonly onValue: (value: ListboxValue) => void;
}

/**
 * The value, form and validity of a form-associated list of options, which Listbox and
 * SelectField share. As on a native select, the form receives one entry for each chosen option,
 * and a single choice without an option submits an empty string. The `value` attribute supplies
 * the initial and reset value of a single choice, and `defaultValue` that of a multiple choice,
 * since an attribute cannot hold a list.
 */
export class ListboxValueControl {
  /** The current value, in the shape of the list. */
  value: ListboxValue = '';

  /** Whether a user or a script set the value, after which the defaults only supply a reset. */
  private dirty = false;

  private defaults: readonly string[] = [];

  private customValidity = '';

  private stopFollowing: (() => void)[] = [];

  constructor(private readonly options: ListboxValueOptions) {}

  connect(): void {
    this.stopFollowing.push(
      followAttribute(this.options.host(), 'value', () => {
        if (!this.dirty) {
          this.restore(this.defaultValue());
        }
      }),
    );
    // A form reads the value and validity as soon as the list joins it, before the first render.
    this.sync();
  }

  disconnect(): void {
    for (const stop of this.stopFollowing) {
      stop();
    }
    this.stopFollowing = [];
  }

  /** The value a reset restores. */
  defaultValue(): ListboxValue {
    const attribute = this.options.host().getAttribute('value') ?? '';
    return this.options.multiple() ? normalizeValue(this.defaults, true) : attribute;
  }

  /** Sets the reset value of a multiple choice, which also leads the value until it is dirty. */
  setDefaults(values: unknown): void {
    this.defaults = Array.isArray(values)
      ? valuesOf(values.filter((item) => typeof item === 'string'))
      : [];
    if (!this.dirty) {
      this.restore(this.defaultValue());
    }
  }

  defaultsList(): readonly string[] {
    return this.defaults;
  }

  /** A value that a script sets, which outlives later defaults, as on a native select. */
  set(value: unknown): void {
    this.restore(isValue(value) ? value : '');
    this.dirty = true;
  }

  /** A choice of the user. */
  choose(value: ListboxValue): void {
    this.dirty = true;
    this.restore(value);
  }

  /** Restores the default value; after a reset the defaults lead the value again. */
  reset(): void {
    this.restore(this.defaultValue());
    this.dirty = false;
  }

  /** Restores the choice the browser saved. */
  restoreState(state: string | File | FormData | null): void {
    if (state instanceof FormData) {
      this.restore(state.getAll('value').filter((item) => typeof item === 'string'));
    } else if (typeof state === 'string') {
      this.restore(state);
    }
  }

  /** The shape of the value follows `multiple`, which may change after the value was set. */
  reshape(): void {
    const shaped = normalizeValue(this.value, this.options.multiple());
    if (JSON.stringify(shaped) !== JSON.stringify(this.value)) {
      this.value = shaped;
      this.options.onValue(shaped);
    }
    this.sync();
  }

  setCustomValidity(message: string): void {
    this.customValidity = message;
    this.sync();
  }

  /** The chosen values that an option holds, which the form submits. */
  submitted(): readonly string[] {
    const known = new Set(this.options.options().map((option) => option.value));
    return valuesOf(this.value).filter((value) => known.has(value));
  }

  /**
   * Gives the form one entry for each chosen option, an empty one for a single choice without an
   * option, and copies the validity of a native select with the same constraints.
   */
  sync(): void {
    const internals = this.options.internals();
    const name = this.options.name();
    const multiple = this.options.multiple();
    const values = this.submitted();
    // The saved state is the choice itself, whatever the name, as a browser saves it for a select.
    const state = new FormData();
    for (const value of values) {
      state.append('value', value);
    }
    if (this.options.disabled() || name === undefined || name === '') {
      internals.setFormValue(null, state);
    } else {
      // The entries carry their name, which Stencil writes on the host only when it renders.
      const entries = new FormData();
      for (const value of multiple ? values : [values[0] ?? '']) {
        entries.append(name, value);
      }
      internals.setFormValue(entries, state);
    }
    const select = this.detached(values);
    select.setCustomValidity(this.customValidity);
    copyValidity(internals, select, this.options.anchor() ?? undefined);
  }

  private restore(value: ListboxValue): void {
    this.value = normalizeValue(value, this.options.multiple());
    this.options.onValue(this.value);
    this.sync();
  }

  /** A native select with the constraints and the choice of the list, not on the page. */
  private detached(values: readonly string[]): HTMLSelectElement {
    const select = document.createElement('select');
    select.multiple = this.options.multiple();
    select.required = this.options.required();
    select.disabled = this.options.disabled();
    if (!select.multiple) {
      select.add(new Option('', '', values.length === 0, values.length === 0));
    }
    for (const value of values) {
      select.add(new Option(value, value, true, true));
    }
    return select;
  }
}

function isValue(value: unknown): value is ListboxValue {
  return typeof value === 'string' || Array.isArray(value);
}
