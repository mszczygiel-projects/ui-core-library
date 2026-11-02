import type { UiCoreConfig } from '@mszczygiel-projects/ui-core-foundations/config';
import { getUiCoreConfig } from '@mszczygiel-projects/ui-core-foundations/config';
import type { ChoiceState } from '@mszczygiel-projects/ui-core-shared/checkbox-field';
import {
  listbox,
  type ListboxOption,
  type ListboxProps,
  type ListboxSize,
  type ListboxValue,
} from '@mszczygiel-projects/ui-core-shared/listbox';
import {
  EMPTY_TYPEAHEAD,
  flattenOptions,
  indexOfValue,
  isChosen,
  moveHighlight,
  toggleValue,
  typeahead,
  type TypeaheadState,
  valuesOf,
} from '@mszczygiel-projects/ui-core-shared/listbox-navigation';
import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
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
  Watch,
} from '@stencil/core';

import { followConfig } from '../internal/config.ts';
import { followAttribute } from '../internal/follow-attribute.ts';
import type { FormAssociated } from '../internal/form-associated.ts';
import { ListboxView, optionId, type WebListboxItems } from '../internal/listbox.tsx';
import { ListboxValueControl } from '../internal/listbox-value.ts';
import type { ListboxValueChange } from './events.ts';

// HTMLElement is repeated because the first build runs before Stencil declares the element.
declare global {
  interface HTMLUiListboxElement extends HTMLElement, FormAssociated {
    /**
     * The chosen value: a string, or a list of strings with `multiple`. The `value` attribute
     * supplies the initial and reset value of a single choice.
     */
    value: ListboxValue;
    /** The initial and reset value of a multiple choice. */
    defaultValue: readonly string[];
    /** Sets a custom constraint; an empty string clears it. */
    setCustomValidity(message: string): void;
  }
}

const { options: specOptions } = listbox;

/**
 * A visible list of options from which a user chooses one value or several.
 *
 * The list takes one stop in the order of the Tab key and names its highlighted option with
 * `aria-activedescendant`. The arrow keys, Home, End, Page Up and Page Down move the highlight,
 * and typed letters move it to the option they start; in a single choice the choice follows the
 * highlight, as in a native select that shows its options, and in a multiple choice Space and a
 * click turn an option on and off. The host is form-associated: it submits one entry for each
 * chosen value. The `value` attribute supplies the initial and reset value of a single choice,
 * the `defaultValue` property that of a multiple choice, and the `value` property holds the
 * current one. An author's `aria-label` names the list when it has no visible label.
 *
 * @part base - The label, the list and the hint.
 * @part label - The visible name of the list.
 * @part label-text - The visible label text.
 * @part listbox - The list, with the role listbox.
 * @part group - A group of options.
 * @part group-label - The heading of a group.
 * @part option - An option.
 * @part option-icon - The decorative icon of an option.
 * @part option-label - The text of an option.
 * @part option-mark - The check of a chosen option, or the box of a multiple choice.
 * @part message - The message of a list without options.
 * @part hint - The help or feedback container.
 * @part hint-text - The help or feedback text.
 */
@Component({
  tag: 'ui-listbox',
  styleUrls: ['../internal/listbox.css', 'listbox.css'],
  shadow: { delegatesFocus: true },
  formAssociated: true,
})
export class UiListbox implements ListboxProps<string>, FormAssociated {
  @Element() host!: HTMLUiListboxElement;

  @AttachInternals() internals!: ElementInternals;

  /** A persistent visible name. Include any required marker in this text. */
  @Prop() label?: string;

  /** Help or validation feedback, connected to the description of the list. */
  @Prop() hint?: string;

  /** The size of the rows, which follows the density. */
  @Prop() size: ListboxSize = 'medium';

  /** Visual feedback; `error` also sets `aria-invalid`, without changing native validity. */
  @Prop() state: ChoiceState = 'default';

  /** Lets a user choose several options. The value is then a list of strings. */
  @Prop() multiple = false;

  /** Prevents interaction and submission. */
  @Prop({ reflect: true }) disabled = false;

  /** Requires a chosen option for native validation. */
  @Prop() required = false;

  /** The name of the form entry, one entry for each chosen value. */
  @Prop({ reflect: true }) name?: string;

  /**
   * The options, alone or in groups. An icon is the SVG string of an icon of the icon package; it
   * renders as markup, so it must never hold text from a user.
   */
  @Prop() options: WebListboxItems = [];

  /** The text shown when there are no options, falling back to `labels.listbox.empty`. */
  @Prop() emptyLabel?: string;

  /** A choice of the user, with the new value and the original event. */
  @Event({ eventName: 'ui-value-change' }) valueChange!: EventEmitter<ListboxValueChange>;

  @State() private current: ListboxValue = '';

  @State() private highlighted = -1;

  @State() private formDisabled = false;

  @State() private ariaLabel: string | null = null;

  @State() private config: UiCoreConfig = getUiCoreConfig();

  private search: TypeaheadState = EMPTY_TYPEAHEAD;

  private stopFollowing: (() => void)[] = [];

  private readonly control = new ListboxValueControl({
    host: () => this.host,
    internals: () => this.internals,
    name: () => this.name,
    multiple: () => this.multiple,
    required: () => this.required,
    disabled: () => this.isDisabled(),
    options: () => flattenOptions(this.options),
    anchor: () => this.list(),
    onValue: (value) => {
      this.current = value;
    },
  });

  /** The chosen value: a string, or a list of strings with `multiple`. */
  get value(): ListboxValue {
    return this.control.value;
  }

  set value(value: ListboxValue) {
    this.control.set(value);
  }

  /** The initial and reset value of a multiple choice. */
  get defaultValue(): readonly string[] {
    return this.control.defaultsList();
  }

  set defaultValue(values: readonly string[]) {
    this.control.setDefaults(values);
  }

  /** The associated form, including an explicit `form` attribute. */
  get form(): HTMLFormElement | null {
    return this.internals.form;
  }

  /** Native validity, from a native select with the same constraints. */
  get validity(): ValidityState {
    this.control.sync();
    return this.internals.validity;
  }

  /** The native or custom validation message. */
  get validationMessage(): string {
    this.control.sync();
    return this.internals.validationMessage;
  }

  /** Whether the host takes part in native constraint validation. */
  get willValidate(): boolean {
    return this.internals.willValidate;
  }

  /** Checks the form-associated host and dispatches `invalid` when needed. */
  // eslint-disable-next-line stencil/own-methods-must-be-private -- the synchronous API of a native control
  checkValidity(): boolean {
    this.control.sync();
    return this.internals.checkValidity();
  }

  /** Reports invalidity, with the list as the anchor of the message. */
  // eslint-disable-next-line stencil/own-methods-must-be-private -- the synchronous API of a native control
  reportValidity(): boolean {
    this.control.sync();
    return this.internals.reportValidity();
  }

  /** Sets a custom constraint; an empty string clears it. */
  // eslint-disable-next-line stencil/own-methods-must-be-private -- the synchronous API of a native control
  setCustomValidity(message: string): void {
    this.control.setCustomValidity(message);
  }

  @Watch('multiple')
  protected multipleChanged(): void {
    this.control.reshape();
  }

  @Watch('options')
  @Watch('name')
  @Watch('required')
  @Watch('disabled')
  protected constraintsChanged(): void {
    this.control.sync();
  }

  connectedCallback(): void {
    this.stopFollowing = [
      followConfig((config) => {
        this.config = config;
      }),
      followAttribute(this.host, 'aria-label', (value) => {
        this.ariaLabel = value;
      }),
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

  /**
   * Takes the disabled state the browser computes: the host's own `disabled` attribute or a
   * disabled fieldset. The browser calls it only when that state changes, so it is kept as given.
   */
  formDisabledCallback(disabled: boolean): void {
    this.formDisabled = disabled;
    this.control.sync();
  }

  /** Restores the default value without emitting an event. */
  formResetCallback(): void {
    this.control.reset();
  }

  /** Restores the choice the browser saved, without emitting an event. */
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
    this.list()
      ?.querySelector(`#${CSS.escape(optionId('listbox', this.highlighted))}`)
      ?.scrollIntoView({ block: 'nearest' });
  }

  render(): VNode {
    const disabled = this.isDisabled();
    const state = oneOf(this.state, specOptions.state.options, specOptions.state.default);
    const size = oneOf(this.size, specOptions.size.options, specOptions.size.default);
    const labelled = this.label !== undefined && this.label !== '';
    const hinted = this.hint !== undefined && this.hint !== '';
    return (
      <div part="base" class={`base ${state}${disabled ? ' disabled' : ''}`}>
        {labelled ? (
          <span id="label" part="label" class="label">
            <span part="label-text">{this.label}</span>
          </span>
        ) : null}
        <ListboxView
          id="listbox"
          items={this.options}
          value={this.current}
          multiple={this.multiple}
          size={size}
          highlighted={this.highlighted}
          emptyLabel={this.emptyLabel ?? this.config.labels.listbox.empty}
          labelledBy={labelled ? 'label' : undefined}
          ariaLabel={this.ariaLabel ?? undefined}
          describedBy={hinted ? 'hint' : undefined}
          invalid={state === 'error'}
          required={this.required}
          disabled={disabled}
          focusable={true}
          onChoose={this.onChoose}
          onHighlight={this.onHighlight}
          onKeyDown={this.onKeyDown}
          onFocus={this.onFocus}
        />
        {hinted ? (
          <span id="hint" part="hint" class="hint">
            <span part="hint-text">{this.hint}</span>
          </span>
        ) : null}
      </div>
    );
  }

  private list(): HTMLElement | null {
    return this.host.shadowRoot?.querySelector('.listbox') ?? null;
  }

  /** Disabled directly or by the owning fieldset. */
  private isDisabled(): boolean {
    return this.disabled || this.formDisabled;
  }

  private flat(): readonly ListboxOption<string>[] {
    return flattenOptions(this.options);
  }

  /** A choice of the user: a single choice takes the option, a multiple one turns it over. */
  private choose(index: number, originalEvent: globalThis.Event): void {
    const option = this.flat()[index];
    if (option === undefined || option.disabled === true || this.isDisabled()) {
      return;
    }
    this.highlighted = index;
    if (!this.multiple && isChosen(this.current, option.value)) {
      return;
    }
    const value = this.multiple ? toggleValue(valuesOf(this.current), option.value) : option.value;
    this.control.choose(value);
    this.valueChange.emit({ value: this.control.value, originalEvent });
    this.host.dispatchEvent(new globalThis.Event('input', { bubbles: true, composed: true }));
    this.host.dispatchEvent(new globalThis.Event('change', { bubbles: true, composed: true }));
  }

  private readonly onChoose = (index: number, event: MouseEvent): void => {
    this.list()?.focus();
    this.choose(index, event);
  };

  private readonly onHighlight = (index: number): void => {
    this.highlighted = index;
  };

  /** Entering the list highlights its first chosen option, else its first one. */
  private readonly onFocus = (): void => {
    if (this.highlighted >= 0) {
      return;
    }
    const options = this.flat();
    const chosen = indexOfValue(options, valuesOf(this.current)[0] ?? '');
    this.highlighted = chosen >= 0 ? chosen : (moveHighlight(options, -1, 'ArrowDown') ?? -1);
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (
      this.isDisabled() ||
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    ) {
      return;
    }
    const options = this.flat();
    const moved = moveHighlight(options, this.highlighted, event.key);
    const typed =
      moved === undefined
        ? typeahead(this.search, event.key, event.timeStamp, options, this.highlighted)
        : undefined;
    const next = moved ?? typed?.index;
    if (typed !== undefined) {
      this.search = typed.state;
    }
    if (next !== undefined) {
      event.preventDefault();
      this.highlighted = next;
      if (!this.multiple && next >= 0) {
        this.choose(next, event);
      }
      return;
    }
    if ((event.key === ' ' || event.key === 'Enter') && this.highlighted >= 0) {
      event.preventDefault();
      this.choose(this.highlighted, event);
    }
  };
}

/**
 * Every prop of the specification is a prop of the component. `implements` alone accepts a class
 * that leaves out an optional prop, so a prop added to the specification would go unnoticed.
 */
type _DeclaresEveryProp = Pick<UiListbox, keyof ListboxProps>;
