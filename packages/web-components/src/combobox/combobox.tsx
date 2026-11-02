import type { UiCoreConfig } from '@mszczygiel-projects/ui-core-foundations/config';
import { getUiCoreConfig } from '@mszczygiel-projects/ui-core-foundations/config';
import { iconChevronDown, iconClose } from '@mszczygiel-projects/ui-core-icons';
import {
  combobox,
  type ComboboxFilterMode,
  type ComboboxProps,
} from '@mszczygiel-projects/ui-core-shared/combobox';
import type {
  ListboxItems,
  ListboxOption,
  ListboxValue,
} from '@mszczygiel-projects/ui-core-shared/listbox';
import {
  filterItems,
  firstEnabled,
  flattenOptions,
  hasExactLabel,
  indexOfValue,
  isChosen,
  lastEnabled,
  moveHighlight,
  toggleValue,
  valuesOf,
} from '@mszczygiel-projects/ui-core-shared/listbox-navigation';
import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import {
  textField,
  type TextFieldLabelPlacement,
  type TextFieldSize,
  type TextFieldState,
  type TextFieldVariant,
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
  Watch,
} from '@stencil/core';

import type { ChipDismiss } from '../chip/events.ts';
import { followConfig } from '../internal/config.ts';
import { Field, fieldAppearance, fieldDescription, fieldPlaceholder } from '../internal/field.tsx';
import { followAttribute } from '../internal/follow-attribute.ts';
import type { FormAssociated } from '../internal/form-associated.ts';
import { ListboxView, optionId, type WebListboxItems } from '../internal/listbox.tsx';
import { ListboxValueControl } from '../internal/listbox-value.ts';
import { Popup } from '../internal/popup.ts';
import { hasAssignedContent } from '../internal/slots.ts';
import type { ListboxValueChange } from '../listbox/events.ts';
import type { SelectFieldOpenChange } from '../select-field/events.ts';
import type { ComboboxQuery } from './events.ts';

// HTMLElement is repeated because the first build runs before Stencil declares the element.
declare global {
  interface HTMLUiComboboxElement extends HTMLElement, FormAssociated {
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

const { size: sizes } = textField.options;
const { filterMode: filterModes } = combobox.options;

/** The keys that move the highlight of an open list; Home and End stay with the text. */
const MOVING_KEYS = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp']);

/**
 * A text field that filters a list of options from which a user chooses one value or several.
 *
 * The input has the role combobox and list autocomplete: typing opens the list, filters it and
 * highlights the first match, which Enter chooses. The arrow keys and Page Up and Page Down move
 * the highlight; Home, End and the left and right arrows move the cursor in the text. Escape,
 * Tab and a press outside close the list, and the query, which is never a value, gives way to the
 * label of the chosen option. A multiple choice shows its options as chips before the query, keeps
 * the list open while a user chooses, and removes the last chip with Backspace in an empty query.
 * With `filterMode="remote"`, the author filters the options from `ui-query-change`; a chosen
 * option keeps its label after it leaves the options. `allowCreate` offers to create an option
 * from a query that no label equals, with `ui-create`. The host is form-associated and submits one
 * entry for each chosen value. An author's `aria-label` names the field when it has no visible
 * label.
 *
 * @slot leading-icon - A decorative icon before the chips and the query, in reading order.
 *
 * @part base - The field, label and hint.
 * @part label - The visible label and its floating background.
 * @part label-text - The visible label text.
 * @part control - The surface, border and focus indicator of the field.
 * @part input-row - The row of the leading icon, the chips and the query, and the buttons.
 * @part chips - The chips of a multiple choice and the input after them.
 * @part chip - A chip of a chosen option, a Chip component.
 * @part input - The text input with the role combobox.
 * @part leading-icon - The decorative leading icon.
 * @part indicator - The arrow that opens and closes the list.
 * @part clear - The button that clears the chosen options and the query.
 * @part popup - The surface of the open list.
 * @part listbox - The list, with the role listbox.
 * @part group - A group of options.
 * @part group-label - The heading of a group.
 * @part option - An option.
 * @part option-icon - The decorative icon of an option.
 * @part option-label - The text of an option.
 * @part option-mark - The check of a chosen option, or the box of a multiple choice.
 * @part create - The option that creates one from the query.
 * @part message - The message of a list without matches, or of a list that loads.
 * @part hint - The help or feedback container.
 * @part hint-text - The help or feedback text.
 */
@Component({
  tag: 'ui-combobox',
  styleUrls: ['../internal/field.css', '../internal/listbox.css', 'combobox.css'],
  shadow: { delegatesFocus: true },
  formAssociated: true,
})
export class UiCombobox implements ComboboxProps<string>, FormAssociated {
  @Element() host!: HTMLUiComboboxElement;

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

  /** The text shown while the query is empty and no option is chosen, never a replacement for the label. */
  @Prop() placeholder?: string;

  /** Help or validation feedback, connected to the description of the input. */
  @Prop() hint?: string;

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

  /** Lets a user choose several options, shown as chips. The value is then a list of strings. */
  @Prop() multiple = false;

  /** Whether the list of options is open. The attribute follows the list. */
  @Prop({ mutable: true, reflect: true }) open = false;

  /** Shows a button that clears the chosen options and the query. */
  @Prop() clearable = false;

  /**
   * `local` filters the options by the query; `remote` shows them as given, for an author who
   * filters them from `ui-query-change`.
   */
  @Prop() filterMode: ComboboxFilterMode = 'local';

  /** Shows that the options are loading instead of the options. */
  @Prop() loading = false;

  /** Offers to create an option from a query that no label equals, with `ui-create`. */
  @Prop() allowCreate = false;

  /** The name of the clear button, falling back to `labels.combobox.clear`. */
  @Prop() clearLabel?: string;

  /** The text shown when no option matches, falling back to `labels.listbox.empty`. */
  @Prop() emptyLabel?: string;

  /** The text shown while the options load, falling back to `labels.listbox.loading`. */
  @Prop() loadingLabel?: string;

  /** The text of the option that creates one from the query, falling back to `labels.combobox.create`. */
  @Prop() getCreateLabel?: (query: string) => string;

  /** A choice of the user, with the new value and the original event. */
  @Event({ eventName: 'ui-value-change' }) valueChange!: EventEmitter<ListboxValueChange>;

  /** The user opened or closed the list, with the original event. */
  @Event({ eventName: 'ui-open-change' }) openChange!: EventEmitter<SelectFieldOpenChange>;

  /** The user changed the query, by typing or by a choice that empties it. */
  @Event({ eventName: 'ui-query-change' }) queryChange!: EventEmitter<ComboboxQuery>;

  /** The user chose to create an option from the query. The author adds it and chooses it. */
  @Event({ eventName: 'ui-create' }) create!: EventEmitter<ComboboxQuery>;

  @State() private current: ListboxValue = '';

  @State() private query = '';

  /** Whether the input of a single choice shows the query instead of the chosen label. */
  @State() private editing = false;

  @State() private highlighted = -1;

  @State() private formDisabled = false;

  @State() private hasLeadingIcon = false;

  @State() private ariaLabel: string | null = null;

  @State() private config: UiCoreConfig = getUiCoreConfig();

  /** The chosen options seen in the options, whose labels outlast them in remote filtering. */
  private readonly remembered = new Map<string, ListboxOption<string>>();

  private stopFollowing: (() => void)[] = [];

  /** Whether a composition, such as a Japanese one, is under way in the input. */
  private composing = false;

  private readonly control = new ListboxValueControl({
    host: () => this.host,
    internals: () => this.internals,
    name: () => this.name,
    multiple: () => this.multiple,
    required: () => this.required,
    disabled: () => this.isDisabled(),
    options: () => this.known(),
    anchor: () => this.input(),
    onValue: (value) => {
      this.current = value;
      this.remember();
    },
  });

  private readonly popup = new Popup({
    host: () => this.host,
    anchor: () => this.host.shadowRoot?.querySelector<HTMLElement>('.control') ?? null,
    popup: () => this.host.shadowRoot?.querySelector<HTMLElement>('.popup') ?? null,
    onDismiss: (event) => {
      this.leave(event);
    },
  });

  /**
   * The chosen value: a string, or a list of strings with `multiple`. The `value` attribute
   * supplies the initial and reset value of a single choice.
   */
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

  /** Reports invalidity, with the input as the anchor of the message. */
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
  protected optionsChanged(): void {
    this.remember();
    this.control.sync();
  }

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
    this.popup.hide();
  }

  /**
   * Takes the disabled state the browser computes: the host's own `disabled` attribute or a
   * disabled fieldset. The browser calls it only when that state changes, so it is kept as given.
   */
  formDisabledCallback(disabled: boolean): void {
    this.formDisabled = disabled;
    this.control.sync();
  }

  /** Restores the default value, empties the query and closes the list, without an event. */
  formResetCallback(): void {
    this.control.reset();
    this.open = false;
    this.query = '';
    this.editing = false;
  }

  /** Restores the choice the browser saved, without emitting an event. */
  formStateRestoreCallback(state: string | File | FormData | null): void {
    this.control.restoreState(state);
  }

  componentWillRender(): void {
    if (this.isDisabled()) {
      this.internals.states.add('disabled');
      this.open = false;
    } else {
      this.internals.states.delete('disabled');
    }
    this.settleHighlight();
  }

  componentDidRender(): void {
    // Stencil sets the value only when it differs from the last render, which a user may have
    // typed over since: several changes in one frame would leave the typed text in place.
    const input = this.input();
    if (input !== null && !this.composing && input.value !== this.shownText()) {
      input.value = this.shownText();
    }
    if (this.open) {
      this.popup.show();
      this.host.shadowRoot
        ?.querySelector(`#${CSS.escape(optionId('listbox', this.highlighted))}`)
        ?.scrollIntoView({ block: 'nearest' });
    } else {
      this.popup.hide();
    }
  }

  render(): VNode[] {
    const appearance = fieldAppearance(this);
    const disabled = this.isDisabled();
    const size = oneOf(this.size, sizes.options, sizes.default);
    const chips = this.multiple ? this.chosenOptions() : [];
    const shown = this.shownText();
    const clearable =
      this.clearable && !disabled && (valuesOf(this.current).length > 0 || this.query !== '');
    const create = this.createLabel();
    return [
      <Field
        classes={`${appearance.classes}${this.open ? ' open' : ''}`}
        placement={appearance.placement}
        label={this.label}
        hint={this.hint}
        onLabelClick={this.onLabelClick}
      >
        <div part="input-row" class="input-row" onClick={this.onRowClick}>
          <span
            part="leading-icon"
            class="leading-icon"
            aria-hidden="true"
            hidden={!this.hasLeadingIcon}
          >
            <slot name="leading-icon" onSlotchange={this.onLeadingSlotChange} />
          </span>
          <div part="chips" class="chips">
            {chips.map((option) => (
              <ui-chip
                key={option.value}
                part="chip"
                class="chip"
                size={size === 'large' ? 'medium' : 'small'}
                dismissible
                skipDismissInTabOrder
                disabled={disabled}
                data-value={option.value}
                onUi-dismiss={this.onChipDismiss}
              >
                {option.label}
              </ui-chip>
            ))}
            <input
              id="input"
              part="input"
              class="input"
              type="text"
              role="combobox"
              autocomplete="off"
              spellcheck={false}
              value={shown}
              placeholder={chips.length > 0 ? undefined : fieldPlaceholder(this.placeholder)}
              disabled={disabled}
              aria-autocomplete="list"
              aria-expanded={this.open ? 'true' : 'false'}
              aria-controls="listbox"
              aria-activedescendant={
                this.open && this.highlighted >= 0
                  ? optionId('listbox', this.highlighted)
                  : undefined
              }
              aria-label={this.ariaLabel ?? undefined}
              aria-invalid={appearance.error ? 'true' : undefined}
              aria-required={this.required ? 'true' : undefined}
              aria-describedby={fieldDescription(this.hint)}
              onInput={this.onInput}
              onCompositionstart={this.onCompositionStart}
              onCompositionend={this.onCompositionEnd}
              onClick={this.onInputClick}
              onKeyDown={this.onKeyDown}
            />
          </div>
          <button
            part="clear"
            class="action"
            type="button"
            hidden={!clearable}
            tabIndex={-1}
            aria-label={this.clearLabel ?? this.config.labels.combobox.clear}
            onClick={this.onClear}
          >
            <span class="action-icon" aria-hidden="true" innerHTML={iconClose} />
          </button>
          <span part="indicator" class="indicator" aria-hidden="true" innerHTML={iconChevronDown} />
        </div>
      </Field>,
      <div part="popup" class="popup" popover="manual" hidden={!this.popupSupported()}>
        <ListboxView
          id="listbox"
          items={this.visibleItems()}
          value={this.current}
          multiple={this.multiple}
          size={size}
          highlighted={this.highlighted}
          emptyLabel={this.emptyLabel ?? this.config.labels.listbox.empty}
          create={create}
          loader={
            this.loading ? (
              <span class="message-loader" aria-hidden="true">
                <ui-loader size="small" />
              </span>
            ) : undefined
          }
          loadingLabel={this.loadingLabel ?? this.config.labels.listbox.loading}
          labelledBy={this.label !== undefined && this.label !== '' ? 'label' : undefined}
          ariaLabel={this.ariaLabel ?? undefined}
          focusable={false}
          onChoose={this.onChoose}
          onHighlight={this.onHighlight}
        />
      </div>,
    ];
  }

  /** The text of the input: the query, or the label of the chosen option of a single choice. */
  private shownText(): string {
    return this.multiple || this.editing ? this.query : (this.chosenOptions()[0]?.label ?? '');
  }

  private input(): HTMLInputElement | null {
    return this.host.shadowRoot?.querySelector('.input') ?? null;
  }

  private popupSupported(): boolean {
    return typeof HTMLElement.prototype.showPopover === 'function';
  }

  /** Disabled directly or by the owning fieldset. */
  private isDisabled(): boolean {
    return this.disabled || this.formDisabled;
  }

  private remote(): boolean {
    return oneOf(this.filterMode, filterModes.options, filterModes.default) === 'remote';
  }

  /** The options and the chosen options the list remembers, which the form submits. */
  private known(): readonly ListboxOption<string>[] {
    const options = flattenOptions(this.options);
    const values = new Set(options.map((option) => option.value));
    return [
      ...options,
      ...[...this.remembered.values()].filter((option) => !values.has(option.value)),
    ];
  }

  /**
   * Remembers the options of the chosen and the default value that the options hold, so that a
   * reset finds its labels, and forgets the others.
   */
  private remember(): void {
    const kept = new Set([...valuesOf(this.current), ...valuesOf(this.control.defaultValue())]);
    for (const option of flattenOptions(this.options)) {
      if (kept.has(option.value)) {
        this.remembered.set(option.value, option);
      }
    }
    for (const value of this.remembered.keys()) {
      if (!kept.has(value)) {
        this.remembered.delete(value);
      }
    }
  }

  /** The chosen options in the order of the value, each with its label. */
  private chosenOptions(): readonly ListboxOption<string>[] {
    const known = this.known();
    return valuesOf(this.current).flatMap((value) => {
      const option = known.find((candidate) => candidate.value === value);
      return option === undefined ? [] : [option];
    });
  }

  private visibleItems(query = this.query): ListboxItems<string> {
    return this.remote() ? this.options : filterItems(this.options, query);
  }

  private createLabel(query = this.query): string | undefined {
    const trimmed = query.trim();
    if (
      !this.allowCreate ||
      this.loading ||
      trimmed === '' ||
      hasExactLabel(this.options, trimmed)
    ) {
      return undefined;
    }
    return (this.getCreateLabel ?? this.config.labels.combobox.create)(trimmed);
  }

  /** The rows a user moves through: the visible options, then the option that creates one. */
  private rows(query = this.query): readonly ListboxOption<unknown>[] {
    if (this.loading) {
      return [];
    }
    const options = flattenOptions(this.visibleItems(query));
    const create = this.createLabel(query);
    return create === undefined ? options : [...options, { value: '', label: create }];
  }

  /**
   * An open list always highlights a row it shows, from where the last change left it. Keys can
   * come faster than renders, so they settle it too before they move it.
   */
  private settleHighlight(): void {
    if (!this.open) {
      this.highlighted = -1;
    } else if (this.highlighted < 0 || this.highlighted >= this.rows().length) {
      this.highlighted = this.initialHighlight();
    }
  }

  /** An open list highlights the first chosen option it shows, else its first row. */
  private initialHighlight(): number {
    const rows = this.rows();
    const chosen = rows.findIndex(
      (row) => row.disabled !== true && isChosen(this.current, row.value),
    );
    return chosen >= 0 ? chosen : (firstEnabled(rows) ?? -1);
  }

  private setOpen(open: boolean, originalEvent: globalThis.Event, highlight?: number): void {
    if (open && this.isDisabled()) {
      return;
    }
    if (highlight !== undefined) {
      this.highlighted = highlight;
    }
    if (!open) {
      // The query is never a value: closing gives way to the chosen label again.
      this.editing = false;
      this.setQuery('', originalEvent);
    }
    if (this.open === open) {
      return;
    }
    this.open = open;
    this.openChange.emit({ value: open, originalEvent });
  }

  /**
   * Closes the list as a user leaves it. A single clearable choice whose text the user emptied
   * becomes no choice, which the keyboard reaches without the clear button.
   */
  private leave(originalEvent: globalThis.Event): void {
    if (
      this.editing &&
      !this.multiple &&
      this.clearable &&
      this.query.trim() === '' &&
      this.current !== ''
    ) {
      this.emitValue('', originalEvent);
    }
    this.setOpen(false, originalEvent);
  }

  private setQuery(query: string, originalEvent: globalThis.Event): void {
    if (query === this.query) {
      return;
    }
    this.query = query;
    this.queryChange.emit({ value: query, originalEvent });
  }

  private emitValue(value: ListboxValue, originalEvent: globalThis.Event): void {
    this.control.choose(value);
    this.valueChange.emit({ value: this.control.value, originalEvent });
    this.host.dispatchEvent(new globalThis.Event('input', { bubbles: true, composed: true }));
    this.host.dispatchEvent(new globalThis.Event('change', { bubbles: true, composed: true }));
  }

  /** A choice of a row: an option, or the option that creates one from the query. */
  private choose(index: number, originalEvent: globalThis.Event): void {
    const options = flattenOptions(this.visibleItems());
    this.input()?.focus();
    if (index === options.length && this.createLabel() !== undefined) {
      this.create.emit({ value: this.query.trim(), originalEvent });
      if (this.multiple) {
        this.setQuery('', originalEvent);
      } else {
        this.setOpen(false, originalEvent);
      }
      return;
    }
    const option = options[index];
    if (option === undefined || option.disabled === true) {
      return;
    }
    this.remembered.set(option.value, option);
    if (!this.multiple) {
      this.setOpen(false, originalEvent);
      if (option.value !== this.current) {
        this.emitValue(option.value, originalEvent);
      }
      return;
    }
    this.emitValue(toggleValue(valuesOf(this.current), option.value), originalEvent);
    if (this.query !== '') {
      this.setQuery('', originalEvent);
      // The list shows every option again, with the highlight on the one just chosen.
      this.highlighted = indexOfValue(flattenOptions(this.visibleItems('')), option.value);
    }
  }

  private removeChosen(value: string, originalEvent: globalThis.Event): void {
    this.emitValue(
      valuesOf(this.current).filter((item) => item !== value),
      originalEvent,
    );
    this.input()?.focus();
  }

  private readonly onChoose = (index: number, event: MouseEvent): void => {
    this.choose(index, event);
  };

  private readonly onHighlight = (index: number): void => {
    this.highlighted = index;
  };

  private readonly onCompositionStart = (): void => {
    this.composing = true;
  };

  private readonly onCompositionEnd = (event: globalThis.Event): void => {
    this.composing = false;
    this.onInput(event);
  };

  private readonly onInput = (event: globalThis.Event): void => {
    const input = event.currentTarget;
    // A composition, such as a Japanese one, filters once it ends.
    if (!(input instanceof HTMLInputElement) || this.composing) {
      return;
    }
    const query = input.value;
    this.editing = true;
    this.setQuery(query, event);
    const rows = this.rows(query);
    this.setOpen(true, event, query.trim() === '' ? -1 : (firstEnabled(rows) ?? -1));
  };

  /** A press on the input opens the list, without closing it again, so that it can place the cursor. */
  private readonly onInputClick = (event: MouseEvent): void => {
    if (!this.open) {
      this.setOpen(true, event);
    }
  };

  /** A press elsewhere in the row focuses the input; the arrow also opens and closes the list. */
  private readonly onRowClick = (event: MouseEvent): void => {
    const target = event.target;
    if (
      !(target instanceof globalThis.Element) ||
      target.closest('ui-chip, .action, .input') !== null ||
      this.isDisabled()
    ) {
      return;
    }
    this.input()?.focus();
    if (target.closest('.indicator') !== null && this.open) {
      this.leave(event);
    } else {
      this.setOpen(true, event);
    }
  };

  /** A click of the label only moves the focus, as on the other fields with a list. */
  private readonly onLabelClick = (event: MouseEvent): void => {
    event.preventDefault();
    this.input()?.focus();
  };

  private readonly onClear = (event: MouseEvent): void => {
    this.input()?.focus();
    this.editing = false;
    this.setQuery('', event);
    if (valuesOf(this.current).length > 0) {
      this.emitValue(this.multiple ? [] : '', event);
    }
  };

  private readonly onChipDismiss = (event: CustomEvent<ChipDismiss>): void => {
    // The chips belong to the field: the page hears of the new value, not of a chip.
    event.stopPropagation();
    const value =
      event.currentTarget instanceof HTMLElement ? event.currentTarget.dataset['value'] : undefined;
    if (value !== undefined && !this.isDisabled()) {
      this.removeChosen(value, event.detail.originalEvent);
    }
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (this.isDisabled() || event.defaultPrevented || event.isComposing) {
      return;
    }
    const { key } = event;
    const rows = this.rows();
    this.settleHighlight();
    if (!this.open) {
      if (key === 'ArrowDown' || key === 'ArrowUp') {
        event.preventDefault();
        const highlight =
          key === 'ArrowDown' || event.altKey ? this.initialHighlight() : this.lastHighlight(rows);
        this.setOpen(true, event, highlight);
      } else if (key === 'Backspace') {
        this.removeLast(event);
      }
      return;
    }
    if (key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.setOpen(false, event);
    } else if (key === 'Tab' || (key === 'ArrowUp' && event.altKey)) {
      this.leave(event);
    } else if (key === 'Enter') {
      if (this.highlighted >= 0) {
        event.preventDefault();
        this.choose(this.highlighted, event);
      }
    } else if (MOVING_KEYS.has(key)) {
      event.preventDefault();
      this.highlighted = moveHighlight(rows, this.highlighted, key) ?? this.highlighted;
    } else if (key === 'Backspace') {
      this.removeLast(event);
    }
  };

  /** ArrowUp opens on the last chosen option, else on the last row. */
  private lastHighlight(rows: readonly ListboxOption<unknown>[]): number {
    const chosen = rows.findLastIndex(
      (row) => row.disabled !== true && isChosen(this.current, row.value),
    );
    return chosen >= 0 ? chosen : (lastEnabled(rows) ?? -1);
  }

  /** Backspace in an empty query removes the last chip of a multiple choice. */
  private removeLast(event: KeyboardEvent): void {
    const values = valuesOf(this.current);
    const last = values.at(-1);
    if (this.multiple && this.query === '' && last !== undefined) {
      event.preventDefault();
      this.removeChosen(last, event);
    }
  }

  private readonly onLeadingSlotChange = (event: globalThis.Event): void => {
    this.hasLeadingIcon = hasAssignedContent(event);
  };
}

/**
 * Every prop of the specification is a prop of the component. `implements` alone accepts a class
 * that leaves out an optional prop, so a prop added to the specification would go unnoticed.
 */
type _DeclaresEveryProp = Pick<UiCombobox, keyof ComboboxProps>;
