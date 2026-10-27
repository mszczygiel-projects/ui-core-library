import type { UiCoreConfig } from '@mszczygiel-projects/ui-core-foundations/config';
import { getUiCoreConfig } from '@mszczygiel-projects/ui-core-foundations/config';
import { iconClose, iconSearch } from '@mszczygiel-projects/ui-core-icons';
import type { SearchFieldProps } from '@mszczygiel-projects/ui-core-shared/search-field';
import type {
  TextFieldLabelPlacement,
  TextFieldSize,
  TextFieldState,
  TextFieldVariant,
} from '@mszczygiel-projects/ui-core-shared/text-field';
import {
  AttachInternals,
  Component,
  Element,
  Event,
  type EventEmitter,
  h,
  Prop,
  State,
  type VNode,
} from '@stencil/core';

import { followConfig } from '../internal/config.ts';
import {
  Field,
  fieldAppearance,
  fieldDescription,
  fieldPlaceholder,
  FORWARDED_ATTRIBUTES,
  forwardedAttributes,
} from '../internal/field.tsx';
import { followAttribute } from '../internal/follow-attribute.ts';
import type { FormAssociated } from '../internal/form-associated.ts';
import { TextControl } from '../internal/text-control.ts';
import type { TextFieldValueChange } from '../text-field/events.ts';
import type { SearchFieldClear } from './events.ts';

// HTMLElement is repeated because the first build runs before Stencil declares the element.
declare global {
  interface HTMLUiSearchFieldElement extends HTMLElement, FormAssociated {
    /** The current value. The `value` attribute supplies the initial and reset value. */
    value: string;
    /** Sets a custom constraint; an empty string clears it. */
    setCustomValidity(message: string): void;
  }

  interface HTMLElementEventMap {
    'ui-clear': CustomEvent<SearchFieldClear>;
  }
}

/**
 * A search input with a button that clears the query.
 *
 * Its inner input, of type search, owns accessibility; ElementInternals associates the host with
 * the outer form. The clear button shows only while the field holds a query that the user may
 * change; it and Escape empty the field, keep the focus in the input and dispatch
 * `ui-value-change` and `ui-clear`. Escape in an empty field reaches the page, for example to
 * close a dialog. The field is no landmark: a page wraps the search form in `<search>`. The
 * `value` attribute supplies the reset value, and the property holds the current value. The native
 * `inputmode`, `enterkeyhint` and `spellcheck` attributes and an author's `aria-label` reach the
 * input.
 *
 * @part base - The field, label and hint.
 * @part control - The input surface, border and focus indicator.
 * @part input-row - The search icon, the input and the clear button.
 * @part input - The native editable input.
 * @part label - The visible label and its floating background.
 * @part label-text - The visible label text.
 * @part hint - The help or feedback container.
 * @part hint-text - The help or feedback text.
 * @part leading-icon - The decorative search icon.
 * @part clear - The button that clears the query.
 * @part clear-icon - The icon of the clear button.
 */
@Component({
  tag: 'ui-search-field',
  styleUrls: ['../internal/field.css', 'search-field.css'],
  shadow: { delegatesFocus: true },
  formAssociated: true,
})
export class UiSearchField implements SearchFieldProps, FormAssociated {
  @Element() host!: HTMLUiSearchFieldElement;

  @AttachInternals() internals!: ElementInternals;

  /** The surface and border treatment. */
  @Prop() variant: TextFieldVariant = 'outline';

  /** The size, which follows the density. */
  @Prop() size: TextFieldSize = 'medium';

  /** The position of the visible label. */
  @Prop() labelPlacement: TextFieldLabelPlacement = 'top';

  /** Visual feedback; `error` also sets `aria-invalid` without changing native validity. */
  @Prop() state: TextFieldState = 'default';

  /** A persistent visible name. Include any required marker in this text. */
  @Prop() label?: string;

  /** An example or short prompt, never a replacement for the label. */
  @Prop() placeholder?: string;

  /** Help or validation feedback, connected to the description of the input. */
  @Prop() hint?: string;

  /** Prevents interaction and submission. */
  @Prop({ reflect: true }) disabled = false;

  /** Prevents editing but keeps submission, and removes the clear button. */
  @Prop({ attribute: 'readonly', reflect: true }) readOnly = false;

  /** Requires a nonempty value for native validation. */
  @Prop() required = false;

  /** The name of the form entry. */
  @Prop({ reflect: true }) name?: string;

  /** The minimum length a user enters, in UTF-16 code units. */
  @Prop() minLength?: number;

  /** The maximum length a user enters, in UTF-16 code units. */
  @Prop() maxLength?: number;

  /** A native regular expression for the whole value. */
  @Prop() pattern?: string;

  /** The purpose of the browser's autofill. */
  @Prop() autoComplete?: string;

  /** The name of the clear button, falling back to `labels.searchField.clear`. */
  @Prop() clearLabel?: string;

  /** One user edit, with the new value and the original input event. */
  @Event({ eventName: 'ui-value-change' }) valueChange!: EventEmitter<TextFieldValueChange>;

  /** The user cleared the query, with the clear button or Escape. */
  @Event({ eventName: 'ui-clear' }) clear!: EventEmitter<SearchFieldClear>;

  @State() private current = '';

  @State() private formDisabled = false;

  @State() private hostAttributes: Readonly<Record<string, string | null>> = {};

  @State() private config: UiCoreConfig = getUiCoreConfig();

  private stopFollowing: (() => void)[] = [];

  private readonly control = new TextControl({
    host: () => this.host,
    internals: () => this.internals,
    control: () => this.input(),
    detached: () => this.detachedInput(),
    name: () => this.name,
    disabled: () => this.isDisabled(),
    onValue: (value) => {
      this.current = value;
    },
    restorable: true,
    implicitSubmission: true,
  });

  /** The current string. The `value` attribute supplies the initial and reset value. */
  get value(): string {
    return this.control.value;
  }

  set value(value: string) {
    this.control.set(value);
  }

  /** The associated form, including an explicit `form` attribute. */
  get form(): HTMLFormElement | null {
    return this.internals.form;
  }

  /** Native validity, synchronized from the inner input. */
  get validity(): ValidityState {
    this.control.syncValidity();
    return this.internals.validity;
  }

  /** The native or custom validation message. */
  get validationMessage(): string {
    this.control.syncValidity();
    return this.internals.validationMessage;
  }

  /** Whether the host takes part in native constraint validation. */
  get willValidate(): boolean {
    return this.internals.willValidate;
  }

  /** Checks the form-associated host and dispatches `invalid` when needed. */
  // eslint-disable-next-line stencil/own-methods-must-be-private -- the synchronous API of a native control
  checkValidity(): boolean {
    this.control.syncValidity();
    return this.internals.checkValidity();
  }

  /** Reports invalidity, with the native input as the anchor of the message. */
  // eslint-disable-next-line stencil/own-methods-must-be-private -- the synchronous API of a native control
  reportValidity(): boolean {
    this.control.syncValidity();
    return this.internals.reportValidity();
  }

  /** Sets a custom constraint; an empty string clears it. */
  // eslint-disable-next-line stencil/own-methods-must-be-private -- the synchronous API of a native control
  setCustomValidity(message: string): void {
    this.control.setCustomValidity(message);
  }

  connectedCallback(): void {
    this.stopFollowing = [
      followConfig((config) => {
        this.config = config;
      }),
      ...FORWARDED_ATTRIBUTES.map((name) =>
        followAttribute(this.host, name, (value) => {
          this.hostAttributes = { ...this.hostAttributes, [name]: value };
        }),
      ),
    ];
    this.control.connect();
  }

  disconnectedCallback(): void {
    for (const stop of this.stopFollowing) {
      stop();
    }
    this.stopFollowing = [];
    this.control.disconnect();
  }

  /** Tracks keyboard submission when the owning form changes. */
  formAssociatedCallback(form: HTMLFormElement | null): void {
    this.control.formAssociated(form);
  }

  /**
   * Takes the disabled state the browser computes: the host's own `disabled` attribute or a
   * disabled fieldset. The browser calls it only when that state changes, so it is kept as given.
   */
  formDisabledCallback(disabled: boolean): void {
    this.formDisabled = disabled;
  }

  /** Restores the value of the attribute without emitting an edit event. */
  formResetCallback(): void {
    this.control.reset();
  }

  /** Restores a string the browser saved, without emitting an edit event. */
  formStateRestoreCallback(state: string | File | FormData | null): void {
    this.control.restoreState(state);
  }

  componentWillRender(): void {
    if (this.isDisabled()) {
      this.internals.states.add('disabled');
    } else {
      this.internals.states.delete('disabled');
    }
  }

  componentDidRender(): void {
    this.control.rendered();
  }

  render(): VNode {
    const appearance = fieldAppearance(this);
    const disabled = this.isDisabled();
    const clearable = this.current !== '' && !disabled && !this.readOnly;
    return (
      <Field
        classes={appearance.classes}
        placement={appearance.placement}
        label={this.label}
        hint={this.hint}
        onSubmit={this.control.onInnerSubmit}
      >
        <div part="input-row" class="input-row">
          <span
            part="leading-icon"
            class="leading-icon"
            aria-hidden="true"
            innerHTML={iconSearch}
          />
          <input
            id="input"
            part="input"
            class="input"
            type="search"
            value={this.current}
            placeholder={fieldPlaceholder(this.placeholder)}
            disabled={disabled}
            readOnly={this.readOnly}
            required={this.required}
            minLength={this.minLength}
            maxLength={this.maxLength}
            pattern={this.pattern}
            autoComplete={this.autoComplete}
            {...forwardedAttributes(this.hostAttributes)}
            aria-invalid={appearance.error ? 'true' : undefined}
            aria-describedby={fieldDescription(this.hint)}
            onInput={this.onInput}
            onChange={this.onChange}
            onKeyDown={this.onKeyDown}
          />
          <button
            part="clear"
            class="action"
            type="button"
            hidden={!clearable}
            aria-controls="input"
            aria-label={this.clearLabel ?? this.config.labels.searchField.clear}
            onClick={this.onClear}
          >
            <span part="clear-icon" class="action-icon" aria-hidden="true" innerHTML={iconClose} />
          </button>
        </div>
      </Field>
    );
  }

  private input(): HTMLInputElement | null {
    return this.host.shadowRoot?.querySelector('input') ?? null;
  }

  /** Disabled directly or by the owning fieldset. */
  private isDisabled(): boolean {
    return this.disabled || this.formDisabled;
  }

  /** An input with the constraints of the field, for checks before the first render. */
  private detachedInput(): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'search';
    input.required = this.required;
    input.readOnly = this.readOnly;
    input.disabled = this.isDisabled();
    if (this.pattern !== undefined) {
      input.pattern = this.pattern;
    }
    input.value = this.control.value;
    return input;
  }

  /** Empties the field as a user edit, and keeps the focus in the input. */
  private clearQuery(originalEvent: globalThis.Event): void {
    const input = this.input();
    if (input !== null) {
      input.value = '';
      input.focus();
    }
    this.control.edit('');
    this.valueChange.emit({ value: '', originalEvent });
    this.clear.emit({ originalEvent });
  }

  private readonly onClear = (event: MouseEvent): void => {
    this.clearQuery(event);
  };

  /** Escape clears a query the user may change; otherwise it reaches the page. */
  private readonly onKeyDown = (event: KeyboardEvent): void => {
    const input = event.currentTarget;
    if (
      event.key !== 'Escape' ||
      event.isComposing ||
      !(input instanceof HTMLInputElement) ||
      input.value === '' ||
      input.readOnly
    ) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.clearQuery(event);
  };

  private readonly onInput = (event: globalThis.Event): void => {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }
    this.control.edit(input.value);
    this.valueChange.emit({ value: input.value, originalEvent: event });
  };

  /** The native change event stays in the shadow root, so the host dispatches its own. */
  private readonly onChange = (): void => {
    this.host.dispatchEvent(new globalThis.Event('change', { bubbles: true, composed: true }));
  };
}

/**
 * Every prop of the specification is a prop of the component. `implements` alone accepts a class
 * that leaves out an optional prop, so a prop added to the specification would go unnoticed.
 */
type _DeclaresEveryProp = Pick<UiSearchField, keyof SearchFieldProps>;
