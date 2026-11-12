import {
  getUiCoreConfig,
  type UiCoreConfig,
} from '@mszczygiel-projects/ui-core-foundations/config';
import { iconCalendar } from '@mszczygiel-projects/ui-core-icons';
import {
  type DateConstraints,
  type DateValidationContext,
  formatDateText,
  parseDateText,
  validateDate,
} from '@mszczygiel-projects/ui-core-shared/date';
import type { DateFieldProps } from '@mszczygiel-projects/ui-core-shared/date-field';
import { resolveLocale } from '@mszczygiel-projects/ui-core-shared/locale';
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
  Watch,
} from '@stencil/core';

import type { CalendarChange } from '../calendar/events.ts';
import { followConfig } from '../internal/config.ts';
import { DateMask } from '../internal/date-mask.ts';
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
import { restoreLocaleState, saveLocaleState } from '../internal/locale-state.ts';
import { Popup } from '../internal/popup.ts';
import { TextControl } from '../internal/text-control.ts';
import type { DateFieldOpenChange, DateFieldValueChange } from './events.ts';

/** The elements of a calendar that take the focus, in the order of Tab. */
const CALENDAR_STOPS = 'ui-icon-button:not([disabled]), .zoom, [role="gridcell"][tabindex="0"]';

// HTMLElement is repeated because the first build runs before Stencil declares the element.
declare global {
  interface HTMLUiDateFieldElement extends HTMLElement, FormAssociated {
    /** The canonical value. The value attribute supplies the initial and reset value. */
    value: string;
    /** Sets a custom constraint; an empty string clears it. */
    setCustomValidity(message: string): void;
  }
}

/**
 * A masked date input with a locale-aware display and an ISO calendar-date value.
 *
 * The native input owns accessibility and editable text. ElementInternals submits the canonical
 * value and saves the draft with its locale. Parsing and constraint errors use customError.
 *
 * The button after the input opens a calendar in a modal dialog in the top layer, which makes the
 * rest of the page inert until it closes, with the focus on the chosen date, else on today. Tab
 * stays inside the dialog. Picking a date writes its text, as one edit, closes the dialog and
 * returns the focus to the button; Escape closes it without a change, and a click outside closes
 * it without reaching the page. The reflected `open` attribute shows whether the calendar is open.
 *
 * @part base - The field, label and hint.
 * @part control - The input surface, border and focus indicator.
 * @part input-row - The input and the calendar button.
 * @part input - The native editable input.
 * @part calendar-button - The button that opens the calendar.
 * @part panel - The dialog that holds the calendar.
 * @part calendar - The calendar inside the dialog.
 * @part label-row - The row of the label on top and its hint.
 * @part label - The visible label and its floating background.
 * @part label-text - The visible label text.
 * @part label-hint - The short text at the end of the label row, such as a count.
 * @part hint - The help or feedback container.
 * @part hint-text - The help or feedback text.
 */
@Component({
  tag: 'ui-date-field',
  styleUrls: ['../internal/field.css', 'date-field.css'],
  shadow: { delegatesFocus: true },
  formAssociated: true,
})
export class UiDateField implements DateFieldProps, FormAssociated {
  @Element() host!: HTMLUiDateFieldElement;

  @AttachInternals() internals!: ElementInternals;

  /** The surface and border treatment. */
  @Prop() variant: TextFieldVariant = 'outline';

  /** The size, which follows the density. */
  @Prop() size: TextFieldSize = 'medium';

  /** The position of the visible label. */
  @Prop() labelPlacement: TextFieldLabelPlacement = 'top';

  /** Hides the visible label, which still names the control. */
  @Prop() hideLabel = false;

  /** Visual feedback, independent of form validity. */
  @Prop() state: TextFieldState = 'default';

  /** A persistent visible name. Include any required marker in this text. */
  @Prop() label?: string;

  /** An example or short prompt, never a replacement for the label. */
  @Prop() placeholder?: string;

  /** Help or feedback connected to the input. */
  @Prop() hint?: string;

  /** Short text at the end of the label row, such as a count of characters, in the description. */
  @Prop() labelHint?: string;

  /** Prevents interaction and submission. */
  @Prop({ reflect: true }) disabled = false;

  /** Prevents editing but keeps submission. */
  @Prop({ attribute: 'readonly', reflect: true }) readOnly = false;

  /** Requires a nonempty value. */
  @Prop() required = false;

  /** The name of the canonical form entry. */
  @Prop({ reflect: true }) name?: string;

  /** The purpose of the browser's autofill. */
  @Prop() autoComplete?: string;

  /** BCP 47 locale, before configuration and browser language. */
  @Prop() locale?: string;

  /** Inclusive lower ISO date bound. */
  @Prop() min?: string;

  /** Inclusive upper ISO date bound. */
  @Prop() max?: string;

  /** ISO dates that cannot be submitted, or a predicate; property only. */
  @Prop({ attribute: null }) disabledDates?: DateConstraints['disabledDates'];

  /** Whether the calendar is open. The attribute follows the calendar. */
  @Prop({ mutable: true, reflect: true }) open = false;

  /** Hides the button that opens the calendar. */
  @Prop() hideCalendarButton = false;

  /** The first day of the week in the calendar, from 1 for Monday to 7 for Sunday. */
  @Prop() firstDayOfWeek?: number;

  /** Today's date, YYYY-MM-DD, which the calendar marks; the clock of the browser by default. */
  @Prop() today?: string;

  /** The name of the calendar button and its dialog. */
  @Prop() openCalendarLabel?: string;

  /** A complete sentence describing the format, used when hint is absent. */
  @Prop({ attribute: null }) getFormatHintLabel?: (example: string) => string;

  /** A complete translated validation message; property only. */
  @Prop({ attribute: null }) getValidationMessageLabel?: (context: DateValidationContext) => string;

  /** One user edit, including partial text, with its canonical value and validation result. */
  @Event({ eventName: 'ui-value-change' }) valueChange!: EventEmitter<DateFieldValueChange>;

  /** The user opened or closed the calendar, with the original event. */
  @Event({ eventName: 'ui-open-change' }) openChange!: EventEmitter<DateFieldOpenChange>;

  @State() private current = '';

  @State() private touched = false;

  @State() private formDisabled = false;

  @State() private hostAttributes: Readonly<Record<string, string | null>> = {};

  @State() private config: UiCoreConfig = getUiCoreConfig();

  private displayLocale = 'en-US';

  @State() private editing = false;

  private stopFollowing: (() => void)[] = [];

  private readonly mask = new DateMask();

  /** The calendar opened since the last render, or open from the start, so its cell takes the focus. */
  private focusCalendar = false;

  /** The calendar closed by a pick or Escape, so its button takes the focus back. */
  private returnFocus = false;

  private readonly popup = new Popup({
    host: () => this.host,
    anchor: () => this.host.shadowRoot?.querySelector<HTMLElement>('.control') ?? null,
    popup: () => this.panel(),
    onDismiss: (event) => {
      this.setOpen(false, event);
    },
    modal: true,
  });

  private readonly control = new TextControl({
    host: () => this.host,
    internals: () => this.internals,
    control: () => this.input(),
    detached: () => this.detachedInput(),
    name: () => this.name,
    disabled: () => this.isDisabled(),
    onValue: (text) => {
      this.current = text;
    },
    restorable: true,
    implicitSubmission: true,
    defaultText: (value) => formatDateText(value, this.displayLocale),
    serialize: (text) => parseDateText(text, this.displayLocale).value,
    validationMessage: () => this.parserMessage(),
    saveState: (text) => saveLocaleState({ text, locale: this.displayLocale }),
    restoreText: (state) => {
      const saved = restoreLocaleState(state);
      if (saved === null) {
        return state;
      }
      this.displayLocale = resolveLocale(saved.locale);
      return saved.text;
    },
  });

  /** Canonical value; the value attribute supplies the initial and reset value. */
  get value(): string {
    return parseDateText(this.control.value, this.displayLocale).value;
  }

  set value(value: string) {
    if (!this.editing) {
      this.displayLocale = resolveLocale(this.locale, this.config.locale, navigator.language);
    }
    this.control.set(formatDateText(value, this.displayLocale));
  }

  /** The associated form, including an explicit form attribute. */
  get form(): HTMLFormElement | null {
    return this.internals.form;
  }

  /** Native validity, synchronized from the visible input. */
  get validity(): ValidityState {
    this.control.syncValidity();
    return this.internals.validity;
  }

  /** Native or custom validation message. */
  get validationMessage(): string {
    this.control.syncValidity();
    return this.internals.validationMessage;
  }

  /** Whether the host participates in constraint validation. */
  get willValidate(): boolean {
    return this.internals.willValidate;
  }

  /** Checks validity and dispatches invalid when needed. */
  // eslint-disable-next-line stencil/own-methods-must-be-private -- the synchronous API of a native control
  checkValidity(): boolean {
    this.control.syncValidity();
    return this.internals.checkValidity();
  }

  /** Reports invalidity with the visible input as anchor. */
  // eslint-disable-next-line stencil/own-methods-must-be-private -- the synchronous API of a native control
  reportValidity(): boolean {
    this.control.syncValidity();
    return this.internals.reportValidity();
  }

  /** Sets a consumer constraint; an empty string clears it. */
  // eslint-disable-next-line stencil/own-methods-must-be-private -- the synchronous API of a native control
  setCustomValidity(message: string): void {
    this.control.setCustomValidity(message);
  }

  componentWillLoad(): void {
    // The watcher of open runs on changes only, so a calendar open from the start asks here.
    this.focusCalendar = this.open;
  }

  connectedCallback(): void {
    const parsed = parseDateText(this.control.value, this.displayLocale);
    const nextLocale = resolveLocale(this.locale, this.config.locale, navigator.language);
    if (parsed.inputState === 'empty' || parsed.inputState === 'valid') {
      this.displayLocale = nextLocale;
      this.control.reformat(formatDateText(parsed.value, nextLocale));
    }
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
    this.host.addEventListener('invalid', this.onInvalid);
    this.control.connect();
  }

  disconnectedCallback(): void {
    for (const stop of this.stopFollowing) {
      stop();
    }
    this.stopFollowing = [];
    this.host.removeEventListener('invalid', this.onInvalid);
    this.control.disconnect();
    this.mask.disconnect();
    this.popup.hide();
  }

  @Watch('open')
  protected openChanged(open: boolean): void {
    if (open) {
      this.focusCalendar = true;
    }
  }

  /** Tracks keyboard submission when the owning form changes. */
  formAssociatedCallback(form: HTMLFormElement | null): void {
    this.control.formAssociated(form);
  }

  /** Uses the browser's disabled fieldset calculation, including the first legend exception. */
  formDisabledCallback(disabled: boolean): void {
    this.formDisabled = disabled;
  }

  /** Restores the current default attribute without an edit event. */
  formResetCallback(): void {
    this.touched = false;
    this.editing = false;
    this.open = false;
    this.displayLocale = resolveLocale(this.locale, this.config.locale, navigator.language);
    this.control.reset();
  }

  /** Restores the saved draft and grammar, then validates it again. */
  formStateRestoreCallback(state: string | File | FormData | null): void {
    this.control.restoreState(state);
  }

  componentWillRender(): void {
    const nextLocale = resolveLocale(this.locale, this.config.locale, navigator.language);
    const parsed = parseDateText(this.control.value, this.displayLocale);
    if (
      !this.editing &&
      nextLocale !== this.displayLocale &&
      (parsed.inputState === 'empty' || parsed.inputState === 'valid')
    ) {
      this.displayLocale = nextLocale;
      this.control.reformat(formatDateText(parsed.value, nextLocale));
    }
    if (this.isDisabled()) {
      this.internals.states.add('disabled');
    } else {
      this.internals.states.delete('disabled');
    }
    if (!this.canOpen()) {
      this.open = false;
    }
  }

  componentDidRender(): void {
    const input = this.input();
    if (input !== null) {
      this.mask.update(input, this.displayLocale, (event) => {
        if (input.value !== this.control.value) {
          this.notify(input.value, event);
        }
      });
    }
    this.control.rendered();
    if (this.open) {
      this.popup.show();
      if (this.focusCalendar) {
        this.focusCalendar = false;
        this.focusCalendarCell();
      }
    } else {
      this.popup.hide();
      if (this.returnFocus) {
        this.returnFocus = false;
        this.calendarButton()?.focus();
      }
    }
  }

  render(): VNode[] {
    const invalid = this.touched && !this.validity.valid;
    const appearance = fieldAppearance({
      variant: this.variant,
      size: this.size,
      labelPlacement: this.labelPlacement,
      state: invalid ? 'error' : this.state,
    });
    const hint =
      this.hint ??
      (this.getFormatHintLabel ?? this.config.labels.dateField.formatHint)(
        formatDateText('2026-12-31', this.displayLocale),
      );
    const calendarLabel = this.openCalendarLabel ?? this.config.labels.dateField.openCalendar;
    const parsed = parseDateText(this.control.value, this.displayLocale);
    return [
      <Field
        classes={appearance.classes}
        placement={appearance.placement}
        label={this.label}
        hideLabel={this.hideLabel}
        hint={hint}
        labelHint={this.labelHint}
        onSubmit={this.control.onInnerSubmit}
      >
        <div part="input-row" class="input-row" onInput={this.onInput}>
          <input
            id="input"
            part="input"
            class="input"
            type="text"
            value={this.current}
            placeholder={fieldPlaceholder(this.placeholder)}
            disabled={this.isDisabled()}
            readOnly={this.readOnly}
            required={this.required}
            autoComplete={this.autoComplete}
            {...forwardedAttributes(this.hostAttributes)}
            inputMode={this.hostAttributes['inputmode'] ?? 'numeric'}
            aria-invalid={appearance.error ? 'true' : undefined}
            aria-describedby={fieldDescription(hint, this.labelHint)}
            onFocus={() => {
              this.editing = true;
            }}
            onBlur={() => {
              this.editing = false;
              this.touched = true;
            }}
            onChange={this.onChange}
          />
          <button
            part="calendar-button"
            class="action calendar-button"
            type="button"
            hidden={this.hideCalendarButton}
            disabled={!this.canOpen()}
            aria-label={calendarLabel}
            aria-haspopup="dialog"
            aria-expanded={this.open ? 'true' : 'false'}
            aria-controls="panel"
            onClick={(event) => {
              this.setOpen(!this.open, event);
            }}
          >
            <span class="action-icon" aria-hidden="true" innerHTML={iconCalendar} />
          </button>
        </div>
      </Field>,
      <dialog
        id="panel"
        part="panel"
        class="panel"
        aria-label={calendarLabel}
        onKeyDown={this.onPanelKeyDown}
        onCancel={this.onCancel}
        onClose={this.onClose}
      >
        {this.open ? (
          <ui-calendar
            part="calendar"
            value={parsed.value}
            min={this.min}
            max={this.max}
            disabledDates={this.disabledDates}
            locale={this.displayLocale}
            firstDayOfWeek={this.firstDayOfWeek}
            today={this.today}
            onUi-value-change={this.onPick}
            onUi-month-change={(event) => {
              event.stopPropagation();
            }}
          />
        ) : null}
      </dialog>,
    ];
  }

  private input(): HTMLInputElement | null {
    return this.host.shadowRoot?.querySelector('input') ?? null;
  }

  private isDisabled(): boolean {
    return this.disabled || this.formDisabled;
  }

  /** A read-only field keeps its date, so its calendar stays closed as well. */
  private canOpen(): boolean {
    return !this.isDisabled() && !this.readOnly;
  }

  private panel(): HTMLElement | null {
    return this.host.shadowRoot?.querySelector<HTMLElement>('.panel') ?? null;
  }

  private calendar(): HTMLUiCalendarElement | null {
    return this.host.shadowRoot?.querySelector('ui-calendar') ?? null;
  }

  private calendarButton(): HTMLButtonElement | null {
    return this.host.shadowRoot?.querySelector('.calendar-button') ?? null;
  }

  private setOpen(open: boolean, originalEvent: globalThis.Event): void {
    if ((open && !this.canOpen()) || this.open === open) {
      return;
    }
    this.open = open;
    this.openChange.emit({ value: open, originalEvent });
  }

  /**
   * The calendar renders its days in a frame after it connects, and the custom elements build has
   * no promise of that render, so the field looks for the cell over a few frames.
   */
  private focusCalendarCell(frames = 10): void {
    const cell = this.calendar()?.shadowRoot?.querySelector<HTMLElement>(
      '[role="gridcell"][tabindex="0"]',
    );
    if (cell !== null && cell !== undefined) {
      cell.focus();
    } else if (frames > 0 && this.open) {
      requestAnimationFrame(() => {
        this.focusCalendarCell(frames - 1);
      });
    }
  }

  /**
   * Closes the calendar and returns the focus to its button, once the modal dialog has closed and
   * the button is no longer inert.
   */
  private close(event: globalThis.Event): void {
    this.returnFocus = true;
    this.setOpen(false, event);
  }

  private constraints() {
    return { min: this.min, max: this.max, disabledDates: this.disabledDates };
  }

  private parserMessage(): string {
    const reason = validateDate(
      parseDateText(this.control.value, this.displayLocale),
      this.constraints(),
    );
    return reason === null
      ? ''
      : (this.getValidationMessageLabel ?? this.config.labels.dateField.validationMessage)({
          ...this.constraints(),
          reason,
          locale: this.displayLocale,
        });
  }

  private detachedInput(): HTMLInputElement {
    const input = document.createElement('input');
    input.required = this.required;
    input.readOnly = this.readOnly;
    input.disabled = this.isDisabled();
    input.value = this.control.value;
    return input;
  }

  private notify(text: string, originalEvent: globalThis.Event): void {
    this.control.edit(text);
    const parsed = parseDateText(text, this.displayLocale);
    this.valueChange.emit({
      ...parsed,
      text,
      originalEvent,
      validationError: validateDate(parsed, this.constraints()),
    });
  }

  private readonly onInput = (event: globalThis.Event): void => {
    const input = event.target;
    if (input instanceof HTMLInputElement && !(event instanceof InputEvent && event.isComposing)) {
      this.notify(input.value, event);
    }
  };

  /** The calendar's own event stays inside, and the field reports the pick as an edit. */
  private readonly onPick = (event: CustomEvent<CalendarChange>): void => {
    event.stopPropagation();
    // A fieldset can disable the field while its calendar is open; the pick then changes nothing.
    if (!this.canOpen()) {
      return;
    }
    this.notify(formatDateText(event.detail.value, this.displayLocale), event.detail.originalEvent);
    this.close(event.detail.originalEvent);
  };

  /** Escape that reaches the dialog itself, not the cell, closes it as Escape on a cell does. */
  private readonly onCancel = (event: globalThis.Event): void => {
    event.preventDefault();
    this.close(event);
  };

  /** The browser may close a modal dialog on its own, such as on a repeated Escape. */
  private readonly onClose = (event: globalThis.Event): void => {
    this.setOpen(false, event);
  };

  /**
   * Escape that the calendar leaves, in its days, closes the dialog. Tab and Shift+Tab go round
   * the stops of the calendar, which a modal dialog never lets the focus leave.
   */
  private readonly onPanelKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close(event);
      return;
    }
    if (event.key !== 'Tab') {
      return;
    }
    const stops = [
      ...(this.calendar()?.shadowRoot?.querySelectorAll<HTMLElement>(CALENDAR_STOPS) ?? []),
    ];
    const first = stops.at(0);
    const last = stops.at(-1);
    if (first === undefined || last === undefined) {
      return;
    }
    const path = event.composedPath();
    const edge = event.shiftKey ? first : last;
    if (path.includes(edge)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    }
  };

  private readonly onInvalid = (): void => {
    this.touched = true;
  };

  /** Native change does not cross a shadow boundary. */
  private readonly onChange = (): void => {
    this.host.dispatchEvent(new globalThis.Event('change', { bubbles: true, composed: true }));
  };
}

/** Checks that optional specification props are present in the implementation too. */
type _DeclaresEveryProp = Pick<UiDateField, keyof DateFieldProps>;
