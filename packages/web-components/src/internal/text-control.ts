import { followAttribute } from './follow-attribute.ts';
import { copyValidity, submitNamed } from './form-value.ts';

/** The native control of a text field: a single-line input or a textarea. */
export type NativeTextControl = HTMLInputElement | HTMLTextAreaElement;

/** The tags of the single-line text fields, which a native form counts for implicit submission. */
const TEXT_FIELD_TAGS = ['ui-text-field', 'ui-password-field', 'ui-search-field'];

/** The input types that a native form counts when it decides on implicit submission. */
const IMPLICIT_SUBMISSION_TYPES = [
  'text',
  'search',
  'url',
  'tel',
  'email',
  'password',
  'date',
  'month',
  'week',
  'time',
  'datetime-local',
  'number',
];

/** What a text field gives the controller of its value and form. */
export interface TextControlOptions {
  /** Getters, since Stencil attaches the host and its internals after the fields initialize. */
  readonly host: () => HTMLElement;
  readonly internals: () => ElementInternals;
  /** The rendered native control, or null before the first render. */
  readonly control: () => NativeTextControl | null;
  /** A native control with the constraints of the field, not on the page, for early checks. */
  readonly detached: () => NativeTextControl;
  readonly name: () => string | undefined;
  /** Disabled directly or by the owning fieldset. */
  readonly disabled: () => boolean;
  /** Receives every new current value, which the field renders. */
  readonly onValue: (value: string) => void;
  /** Whether the browser may save the value and restore it later; a password must not. */
  readonly restorable: boolean;
  /** Whether Enter submits the owning form, as in a single-line native input. */
  readonly implicitSubmission: boolean;
}

/**
 * The value, form and validity of a form-associated text field, which TextField, PasswordField,
 * SearchField and TextareaField share. The `value` attribute supplies the initial and reset value,
 * and the current value lives here, as on a native input.
 */
export class TextControl {
  /** The current string of the field. */
  value = '';

  /** Whether a user or a script set the value, after which the attribute only supplies a reset. */
  private dirty = false;

  private customValidity = '';

  private stopFollowing: (() => void)[] = [];

  private formKeyEvents?: AbortController;

  constructor(private readonly options: TextControlOptions) {}

  connect(): void {
    this.stopFollowing.push(
      followAttribute(this.options.host(), 'value', (value) => {
        // Once the value is dirty, the attribute only supplies what a reset restores.
        if (!this.dirty) {
          this.restore(value ?? '');
        }
      }),
    );
    // A form reads the value and validity as soon as the field joins it, before the first render.
    this.submit();
    this.syncValidity();
    this.observeFormKeys(this.options.internals().form);
  }

  disconnect(): void {
    for (const stop of this.stopFollowing) {
      stop();
    }
    this.stopFollowing = [];
    this.formKeyEvents?.abort();
  }

  /** A value that a script sets, which outlives later defaults, as on a native input. */
  set(value: unknown): void {
    // A form reads the new value and validity at once, as it does for a native input, so they
    // change now rather than at the next render.
    this.restore(typeof value === 'string' ? value : '');
    this.dirty = true;
  }

  /** One edit of the user, read from the native control. */
  edit(value: string): void {
    this.value = value;
    this.dirty = true;
    this.options.onValue(value);
    this.submit();
    this.syncValidity();
  }

  /** Restores the value of the attribute; after a reset the attribute leads the value again. */
  reset(): void {
    this.restore(this.options.host().getAttribute('value') ?? '');
    this.dirty = false;
  }

  /** Restores a string the browser saved. */
  restoreState(state: string | File | FormData | null): void {
    if (this.options.restorable && typeof state === 'string') {
      this.restore(state);
    }
  }

  /** Takes over what the rendered control holds, since some types sanitize their value. */
  rendered(): void {
    const control = this.options.control();
    if (control !== null && control.value !== this.value) {
      this.value = control.value;
      this.options.onValue(this.value);
    }
    this.submit();
    this.syncValidity();
  }

  setCustomValidity(message: string): void {
    this.customValidity = message;
    this.syncValidity();
  }

  /**
   * Copies the validity of the control to the host. Before the first render, which Stencil runs
   * later, a detached control with the same constraints answers, so that a form checks the field
   * as soon as it joins; the browser writes its message in the user's language either way.
   */
  syncValidity(): void {
    const rendered = this.options.control();
    const control = rendered ?? this.options.detached();
    control.setCustomValidity(this.customValidity);
    copyValidity(this.options.internals(), control, rendered ?? undefined);
  }

  /** Tracks keyboard submission when the owning form changes. */
  formAssociated(form: HTMLFormElement | null): void {
    this.observeFormKeys(form);
  }

  /**
   * The inner form of a single-line field receives Enter as a native default action, after
   * keyboard cancellation and input methods. Its submit event bridges to the associated outer form.
   */
  readonly onInnerSubmit = (event: Event): void => {
    event.preventDefault();
    event.stopPropagation();
    const form = this.options.internals().form;
    if (form === null || !this.options.host().isConnected || this.options.disabled()) {
      return;
    }
    const submitter = defaultSubmitter(form);
    if (submitter !== undefined) {
      if (!submitter.matches(':disabled')) {
        submitter.click();
      }
      return;
    }
    if (blockingFields(form).length === 1) {
      form.requestSubmit();
    }
  };

  private restore(value: string): void {
    const control = this.options.control();
    if (control !== null) {
      control.value = value;
    }
    // Some input types sanitize their value as soon as they receive the string.
    this.value = control?.value ?? value;
    this.options.onValue(this.value);
    this.submit();
    this.syncValidity();
  }

  private submit(): void {
    submitNamed(
      this.options.internals(),
      this.options.name(),
      this.options.control()?.value ?? this.value,
      this.options.restorable,
    );
  }

  private observeFormKeys(form: HTMLFormElement | null): void {
    this.formKeyEvents?.abort();
    if (!this.options.implicitSubmission || form === null || !this.options.host().isConnected) {
      return;
    }
    this.formKeyEvents = new AbortController();
    // External inputs with a form attribute do not bubble through the form itself.
    form.getRootNode().addEventListener('keydown', this.onAssociatedKeyDown, {
      signal: this.formKeyEvents.signal,
    });
  }

  private readonly onAssociatedKeyDown = (event: Event): void => {
    if (
      !(event instanceof KeyboardEvent) ||
      event.key !== 'Enter' ||
      event.isComposing ||
      event.defaultPrevented
    ) {
      return;
    }
    const input = event.composedPath()[0];
    const form = this.options.internals().form;
    if (
      !(input instanceof HTMLInputElement) ||
      form === null ||
      input.form !== form ||
      !blocksImplicitSubmission(input)
    ) {
      return;
    }
    // Native implicit submission does not count form-associated custom elements.
    if (defaultSubmitter(form) === undefined && blockingFields(form).length > 1) {
      event.preventDefault();
    }
  };
}

function defaultSubmitter(form: HTMLFormElement): HTMLButtonElement | HTMLInputElement | undefined {
  const root = form.getRootNode();
  if (!(root instanceof Document || root instanceof ShadowRoot)) {
    return undefined;
  }
  return Array.from(root.querySelectorAll('button, input')).find(
    (node): node is HTMLButtonElement | HTMLInputElement =>
      (node instanceof HTMLButtonElement || node instanceof HTMLInputElement) &&
      node.form === form &&
      (node.type === 'submit' || node.type === 'image'),
  );
}

function blocksImplicitSubmission(node: Element): boolean {
  return (
    TEXT_FIELD_TAGS.includes(node.localName) ||
    (node instanceof HTMLInputElement && IMPLICIT_SUBMISSION_TYPES.includes(node.type))
  );
}

function blockingFields(form: HTMLFormElement): Element[] {
  return Array.from(form.elements).filter((node) => blocksImplicitSubmission(node));
}
