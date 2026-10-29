import type { UiCoreConfig } from '@mszczygiel-projects/ui-core-foundations/config';
import { getUiCoreConfig } from '@mszczygiel-projects/ui-core-foundations/config';
import { iconChevronDown, iconClose } from '@mszczygiel-projects/ui-core-icons';
import type { ListboxOption } from '@mszczygiel-projects/ui-core-shared/listbox';
import {
  EMPTY_TYPEAHEAD,
  firstEnabled,
  flattenOptions,
  indexOfValue,
  lastEnabled,
  moveHighlight,
  typeahead,
  type TypeaheadState,
} from '@mszczygiel-projects/ui-core-shared/listbox-navigation';
import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import type { SelectFieldProps } from '@mszczygiel-projects/ui-core-shared/select-field';
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

import { followConfig } from '../internal/config.ts';
import { Field, fieldAppearance, fieldDescription } from '../internal/field.tsx';
import { followAttribute } from '../internal/follow-attribute.ts';
import type { FormAssociated } from '../internal/form-associated.ts';
import { ListboxView, optionId, type WebListboxItems } from '../internal/listbox.tsx';
import { ListboxValueControl } from '../internal/listbox-value.ts';
import { Popup } from '../internal/popup.ts';
import { hasAssignedContent } from '../internal/slots.ts';
import type { ListboxValueChange } from '../listbox/events.ts';
import type { SelectFieldOpenChange } from './events.ts';

// HTMLElement is repeated because the first build runs before Stencil declares the element.
declare global {
  interface HTMLUiSelectFieldElement extends HTMLElement, FormAssociated {
    /** The value of the chosen option. The `value` attribute supplies the initial and reset value. */
    value: string;
    /** Sets a custom constraint; an empty string clears it. */
    setCustomValidity(message: string): void;
  }
}

const { size: sizes } = textField.options;

/**
 * A field that opens a list of options from which a user chooses one value.
 *
 * The trigger is a button with the role combobox, which keeps the focus while its list is open
 * and names the highlighted option with `aria-activedescendant`. The arrow keys, Enter, Space, Home
 * and End open the list; in an open list they move the highlight, Enter and Space choose, Escape
 * and Tab close without a change, and typed letters move to the option they start, also while it
 * is closed. The list opens in the top layer, below the field or above it when the window has no
 * room below. The host is form-associated and submits the chosen value, or an empty string. The
 * `value` attribute supplies the initial and reset value, and the property holds the current one;
 * the reflected `open` attribute shows whether the list is open. An author's `aria-label` names the
 * field when it has no visible label.
 *
 * @slot leading-icon - A decorative icon before the value, in reading order.
 *
 * @part base - The field, label and hint.
 * @part label - The visible label and its floating background.
 * @part label-text - The visible label text.
 * @part control - The surface, border and focus indicator of the field.
 * @part trigger - The button with the role combobox.
 * @part value - The label of the chosen option, or the placeholder.
 * @part leading-icon - The decorative leading icon.
 * @part indicator - The arrow that shows the list can open.
 * @part clear - The button that clears the chosen option.
 * @part popup - The surface of the open list.
 * @part listbox - The list, with the role listbox.
 * @part group - A group of options.
 * @part group-label - The heading of a group.
 * @part option - An option.
 * @part option-icon - The decorative icon of an option.
 * @part option-label - The text of an option.
 * @part option-mark - The check of the chosen option.
 * @part message - The message of a list without options.
 * @part hint - The help or feedback container.
 * @part hint-text - The help or feedback text.
 */
@Component({
  tag: 'ui-select-field',
  styleUrls: ['../internal/field.css', '../internal/listbox.css', 'select-field.css'],
  shadow: { delegatesFocus: true },
  formAssociated: true,
})
export class UiSelectField implements SelectFieldProps<string>, FormAssociated {
  @Element() host!: HTMLUiSelectFieldElement;

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

  /** The text shown while no option is chosen, never a replacement for the label. */
  @Prop() placeholder?: string;

  /** Help or validation feedback, connected to the description of the trigger. */
  @Prop() hint?: string;

  /** Prevents interaction and submission. */
  @Prop({ reflect: true }) disabled = false;

  /** Requires a chosen option for native validation. */
  @Prop() required = false;

  /** The name of the form entry. */
  @Prop({ reflect: true }) name?: string;

  /**
   * The options, alone or in groups. An icon is the SVG string of an icon of the icon package; it
   * renders as markup, so it must never hold text from a user.
   */
  @Prop() options: WebListboxItems = [];

  /** Whether the list of options is open. The attribute follows the list. */
  @Prop({ mutable: true, reflect: true }) open = false;

  /** Shows a button that clears the chosen option. */
  @Prop() clearable = false;

  /** The name of the clear button, falling back to `labels.selectField.clear`. */
  @Prop() clearLabel?: string;

  /** The text shown when there are no options, falling back to `labels.listbox.empty`. */
  @Prop() emptyLabel?: string;

  /** A choice of the user, with the new value and the original event. */
  @Event({ eventName: 'ui-value-change' }) valueChange!: EventEmitter<ListboxValueChange>;

  /** The user opened or closed the list, with the original event. */
  @Event({ eventName: 'ui-open-change' }) openChange!: EventEmitter<SelectFieldOpenChange>;

  @State() private current = '';

  @State() private highlighted = -1;

  @State() private formDisabled = false;

  @State() private hasLeadingIcon = false;

  @State() private ariaLabel: string | null = null;

  @State() private config: UiCoreConfig = getUiCoreConfig();

  private search: TypeaheadState = EMPTY_TYPEAHEAD;

  /** Whether the pointer pressed the trigger itself, rather than the label that forwards a click. */
  private pressed = false;

  private stopFollowing: (() => void)[] = [];

  private readonly control = new ListboxValueControl({
    host: () => this.host,
    internals: () => this.internals,
    name: () => this.name,
    multiple: () => false,
    required: () => this.required,
    disabled: () => this.isDisabled(),
    options: () => this.flat(),
    anchor: () => this.trigger(),
    onValue: (value) => {
      this.current = typeof value === 'string' ? value : '';
    },
  });

  private readonly popup = new Popup({
    host: () => this.host,
    anchor: () => this.host.shadowRoot?.querySelector<HTMLElement>('.control') ?? null,
    popup: () => this.host.shadowRoot?.querySelector<HTMLElement>('.popup') ?? null,
    onDismiss: (event) => {
      this.setOpen(false, event);
    },
  });

  /** The value of the chosen option. The `value` attribute supplies the initial and reset value. */
  get value(): string {
    return this.current;
  }

  set value(value: string) {
    this.control.set(value);
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

  /** Reports invalidity, with the trigger as the anchor of the message. */
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

  /** Restores the value of the attribute and closes the list, without emitting an event. */
  formResetCallback(): void {
    this.control.reset();
    this.open = false;
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
    if (this.open && this.highlighted < 0) {
      this.highlighted = this.initialHighlight();
    } else if (!this.open) {
      this.highlighted = -1;
    }
  }

  componentDidRender(): void {
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
    const options = this.flat();
    const chosen = options[indexOfValue(options, this.current)];
    const clearable = this.clearable && chosen !== undefined && !disabled;
    return [
      <Field
        classes={`${appearance.classes}${this.open ? ' open' : ''}`}
        placement={appearance.placement}
        label={this.label}
        hint={this.hint}
      >
        <div part="input-row" class="input-row">
          <span
            part="leading-icon"
            class="leading-icon"
            aria-hidden="true"
            hidden={!this.hasLeadingIcon}
          >
            <slot name="leading-icon" onSlotchange={this.onLeadingSlotChange} />
          </span>
          <button
            id="input"
            part="trigger"
            class={`input trigger${chosen === undefined ? ' empty' : ''}`}
            type="button"
            role="combobox"
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={this.open ? 'true' : 'false'}
            aria-controls="listbox"
            aria-activedescendant={
              this.open && this.highlighted >= 0 ? optionId('listbox', this.highlighted) : undefined
            }
            aria-label={this.ariaLabel ?? undefined}
            aria-invalid={appearance.error ? 'true' : undefined}
            aria-required={this.required ? 'true' : undefined}
            aria-describedby={fieldDescription(this.hint)}
            onPointerDown={this.onTriggerPointerDown}
            onClick={this.onTriggerClick}
            onKeyDown={this.onKeyDown}
          >
            <span part="value" class={`value${chosen === undefined ? ' placeholder' : ''}`}>
              {chosen?.label ?? this.placeholder ?? ''}
            </span>
          </button>
          <button
            part="clear"
            class="action"
            type="button"
            hidden={!clearable}
            tabIndex={-1}
            aria-label={this.clearLabel ?? this.config.labels.selectField.clear}
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
          items={this.options}
          value={this.current}
          multiple={false}
          size={oneOf(this.size, sizes.options, sizes.default)}
          highlighted={this.highlighted}
          emptyLabel={this.emptyLabel ?? this.config.labels.listbox.empty}
          labelledBy={this.label !== undefined && this.label !== '' ? 'label' : undefined}
          ariaLabel={this.ariaLabel ?? undefined}
          focusable={false}
          onChoose={this.onChoose}
          onHighlight={this.onHighlight}
        />
      </div>,
    ];
  }

  private trigger(): HTMLButtonElement | null {
    return this.host.shadowRoot?.querySelector('.trigger') ?? null;
  }

  private popupSupported(): boolean {
    return typeof HTMLElement.prototype.showPopover === 'function';
  }

  /** Disabled directly or by the owning fieldset. */
  private isDisabled(): boolean {
    return this.disabled || this.formDisabled;
  }

  private flat(): readonly ListboxOption<string>[] {
    return flattenOptions(this.options);
  }

  /** An open list highlights the chosen option, else its first enabled one. */
  private initialHighlight(): number {
    const options = this.flat();
    const chosen = indexOfValue(options, this.current);
    return chosen >= 0 && options[chosen]?.disabled !== true
      ? chosen
      : (firstEnabled(options) ?? -1);
  }

  private setOpen(open: boolean, originalEvent: globalThis.Event, highlight?: number): void {
    if (open && this.isDisabled()) {
      return;
    }
    if (highlight !== undefined) {
      this.highlighted = highlight;
    }
    if (this.open === open) {
      return;
    }
    this.open = open;
    this.openChange.emit({ value: open, originalEvent });
  }

  /** A choice of the user, which closes the list and keeps the focus on the trigger. */
  private choose(index: number, originalEvent: globalThis.Event): void {
    const option = this.flat()[index];
    if (option === undefined || option.disabled === true) {
      return;
    }
    this.setOpen(false, originalEvent);
    this.trigger()?.focus();
    if (option.value === this.current) {
      return;
    }
    this.control.choose(option.value);
    this.valueChange.emit({ value: option.value, originalEvent });
    this.host.dispatchEvent(new globalThis.Event('input', { bubbles: true, composed: true }));
    this.host.dispatchEvent(new globalThis.Event('change', { bubbles: true, composed: true }));
  }

  private clearValue(originalEvent: globalThis.Event): void {
    if (this.current === '') {
      return;
    }
    this.control.choose('');
    this.valueChange.emit({ value: '', originalEvent });
    this.host.dispatchEvent(new globalThis.Event('input', { bubbles: true, composed: true }));
    this.host.dispatchEvent(new globalThis.Event('change', { bubbles: true, composed: true }));
  }

  private readonly onChoose = (index: number, event: MouseEvent): void => {
    this.choose(index, event);
  };

  private readonly onHighlight = (index: number): void => {
    this.highlighted = index;
  };

  /**
   * A press of the pointer on the field opens and closes the list. A click that the label
   * forwards only moves the focus, as the label of a native select does.
   */
  private readonly onTriggerClick = (event: MouseEvent): void => {
    if (!this.pressed) {
      return;
    }
    this.pressed = false;
    this.setOpen(!this.open, event);
  };

  private readonly onTriggerPointerDown = (event: PointerEvent): void => {
    this.pressed = event.button === 0;
  };

  private readonly onClear = (event: MouseEvent): void => {
    this.trigger()?.focus();
    this.clearValue(event);
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (this.isDisabled() || event.defaultPrevented || event.isComposing) {
      return;
    }
    const options = this.flat();
    const { key } = event;
    if (!this.open) {
      this.onClosedKey(event, options);
      return;
    }
    if (key === 'Escape' || key === 'Tab') {
      if (key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
      }
      this.setOpen(false, event);
      return;
    }
    if (key === ' ' && this.onTypeahead(event, options)) {
      return;
    }
    if (key === 'Enter' || key === ' ' || (key === 'ArrowUp' && event.altKey)) {
      event.preventDefault();
      if (this.highlighted >= 0) {
        this.choose(this.highlighted, event);
      } else {
        this.setOpen(false, event);
      }
      return;
    }
    const moved = moveHighlight(options, this.highlighted, key);
    if (moved !== undefined) {
      event.preventDefault();
      this.highlighted = moved;
      return;
    }
    this.onTypeahead(event, options);
  };

  private onClosedKey(event: KeyboardEvent, options: readonly ListboxOption<string>[]): void {
    const { key } = event;
    if (key === 'ArrowDown' || key === 'Enter' || key === ' ') {
      event.preventDefault();
      this.setOpen(true, event, this.initialHighlight());
    } else if (key === 'ArrowUp') {
      event.preventDefault();
      const chosen = indexOfValue(options, this.current);
      this.setOpen(true, event, chosen >= 0 ? chosen : (lastEnabled(options) ?? -1));
    } else if (key === 'Home' || key === 'End') {
      event.preventDefault();
      this.setOpen(
        true,
        event,
        (key === 'Home' ? firstEnabled(options) : lastEnabled(options)) ?? -1,
      );
    } else if ((key === 'Delete' || key === 'Backspace') && this.clearable) {
      event.preventDefault();
      this.clearValue(event);
    } else if (!event.altKey && !event.ctrlKey && !event.metaKey) {
      const typed = typeahead(
        this.search,
        key,
        event.timeStamp,
        options,
        indexOfValue(options, this.current),
      );
      if (typed !== undefined) {
        event.preventDefault();
        this.search = typed.state;
        this.setOpen(true, event, typed.index);
      }
    }
  }

  /** Moves the highlight to the option that typed letters start, and says whether it did. */
  private onTypeahead(event: KeyboardEvent, options: readonly ListboxOption<string>[]): boolean {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return false;
    }
    const typed = typeahead(this.search, event.key, event.timeStamp, options, this.highlighted);
    if (typed === undefined) {
      return false;
    }
    event.preventDefault();
    this.search = typed.state;
    this.highlighted = typed.index;
    return true;
  }

  private readonly onLeadingSlotChange = (event: globalThis.Event): void => {
    this.hasLeadingIcon = hasAssignedContent(event);
  };
}

/**
 * Every prop of the specification is a prop of the component. `implements` alone accepts a class
 * that leaves out an optional prop, so a prop added to the specification would go unnoticed.
 */
type _DeclaresEveryProp = Pick<UiSelectField, keyof SelectFieldProps>;
