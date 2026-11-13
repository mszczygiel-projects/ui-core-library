import {
  getUiCoreConfig,
  type UiCoreConfig,
} from '@mszczygiel-projects/ui-core-foundations/config';
import { iconCalendar } from '@mszczygiel-projects/ui-core-icons';
import { type DateConstraints, formatDateText } from '@mszczygiel-projects/ui-core-shared/date';
import type { DateFieldOpenChangeDetail } from '@mszczygiel-projects/ui-core-shared/date-field';
import {
  dateTimeDraftParts,
  dateTimeMaskOptions,
  formatDateTimeText,
  parseDateTimeText,
  validateDateTime,
} from '@mszczygiel-projects/ui-core-shared/date-time';
import type {
  DateTimeFieldProps,
  DateTimeFieldValueChangeDetail,
  DateTimeValidationContext,
} from '@mszczygiel-projects/ui-core-shared/date-time-field';
import { resolveLocale } from '@mszczygiel-projects/ui-core-shared/locale';
import type {
  TextFieldLabelPlacement,
  TextFieldSize,
  TextFieldState,
  TextFieldVariant,
} from '@mszczygiel-projects/ui-core-shared/text-field';
import {
  isIsoLocalDateTime,
  joinLocalDateTime,
  timeBoundsForDate,
} from '@mszczygiel-projects/ui-core-shared/time';
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

declare global {
  interface HTMLUiDateTimeFieldElement extends HTMLElement, FormAssociated {
    /** Current canonical local date and time. */
    value: string;
    /** Sets a consumer constraint; an empty string clears it. */
    setCustomValidity(message: string): void;
  }
}

/**
 * A masked date and time input with a combined picker and a local value with minute precision.
 *
 * @part base - The field, label and hint.
 * @part control - The input surface, border and focus indicator.
 * @part input-row - The editable input and picker button.
 * @part input - The native editable text input.
 * @part picker-button - The button that opens the picker.
 * @part panel - The dialog containing the picker.
 * @part calendar - The calendar inside the dialog.
 * @part time - The time control inside the dialog.
 * @part done-button - The button that closes the dialog.
 * @part label - The visible label.
 * @part label-row - The row holding the label and its hint.
 * @part label-text - The text of the visible label.
 * @part label-hint - The short note at the end of the label row.
 * @part hint - The help or feedback container.
 * @part hint-text - The help or feedback text.
 */
@Component({
  tag: 'ui-date-time-field',
  styleUrls: ['../internal/field.css', 'date-time-field.css'],
  shadow: { delegatesFocus: true },
  formAssociated: true,
})
export class UiDateTimeField implements DateTimeFieldProps, FormAssociated {
  @Element() host!: HTMLUiDateTimeFieldElement;

  @AttachInternals() internals!: ElementInternals;

  /** Surface and border treatment. */
  @Prop() variant: TextFieldVariant = 'outline';

  /** Size of the field. */
  @Prop() size: TextFieldSize = 'medium';

  /** Position of the label. */
  @Prop() labelPlacement: TextFieldLabelPlacement = 'top';

  /** Hides the visible label while retaining its accessible name. */
  @Prop() hideLabel = false;

  /** Visual feedback independent of native validity. */
  @Prop() state: TextFieldState = 'default';

  /** The visible name of the input. */
  @Prop() label?: string;

  /** Help or feedback connected to the input. */
  @Prop() hint?: string;

  /** A short note in the label row. */
  @Prop() labelHint?: string;

  /** An example or short prompt. */
  @Prop() placeholder?: string;

  /** Prevents interaction and submission. */
  @Prop({ reflect: true }) disabled = false;

  /** Prevents editing but keeps submission. */
  @Prop({ attribute: 'readonly', reflect: true }) readOnly = false;

  /** Requires a complete value. */
  @Prop() required = false;

  /** The name of the canonical form entry. */
  @Prop({ reflect: true }) name?: string;

  /** The purpose of browser autofill. */
  @Prop() autoComplete?: string;

  /** BCP 47 locale before the configured locale and browser language. */
  @Prop() locale?: string;

  /** Earliest inclusive local date-time, YYYY-MM-DDTHH:mm; malformed values are ignored. */
  @Prop() min?: string;

  /** Latest inclusive local date-time, YYYY-MM-DDTHH:mm; malformed values are ignored. */
  @Prop() max?: string;

  /** Dates excluded from the picker and submission. */
  @Prop({ attribute: null }) disabledDates?: DateConstraints['disabledDates'];

  /** Whether the picker is open. */
  @Prop({ mutable: true, reflect: true }) open = false;

  /** Hides the button that opens the picker. */
  @Prop() hideCalendarButton = false;

  /** First day of the week, from 1 for Monday to 7 for Sunday. */
  @Prop() firstDayOfWeek?: number;

  /** Today's ISO date for the calendar. */
  @Prop() today?: string;

  /** The name of the picker button and dialog. */
  @Prop() openCalendarLabel?: string;

  /** The name of the time control inside the picker. */
  @Prop() timeLabel?: string;

  /** A complete sentence describing the input format. */
  @Prop({ attribute: null }) getFormatHintLabel?: (example: string) => string;

  /** A complete translated validation message. */
  @Prop({ attribute: null }) getValidationMessageLabel?: (
    context: DateTimeValidationContext,
  ) => string;

  /** A user edit, including partial or invalid text. */
  @Event({ eventName: 'ui-value-change' }) valueChange!: EventEmitter<
    DateTimeFieldValueChangeDetail<globalThis.Event>
  >;

  /** A user request to open or close the picker. */
  @Event({ eventName: 'ui-open-change' }) openChange!: EventEmitter<
    DateFieldOpenChangeDetail<globalThis.Event>
  >;

  @State() private current = '';

  @State() private pickerDate = '';

  @State() private pickerTime = '';

  @State() private touched = false;

  @State() private editing = false;

  @State() private formDisabled = false;

  @State() private hostAttributes: Readonly<Record<string, string | null>> = {};

  @State() private config: UiCoreConfig = getUiCoreConfig();

  private displayLocale = 'en-US';

  private stopFollowing: (() => void)[] = [];

  private focusCalendar = false;

  private returnFocus = false;

  private readonly mask = new DateMask();

  private readonly popup = new Popup({
    host: () => this.host,
    anchor: () => this.host.shadowRoot?.querySelector<HTMLElement>('.control') ?? null,
    popup: () => this.panel(),
    onDismiss: (event) => {
      this.setOpen(false, event);
    },
    modal: true,
  });

  private readonly control: TextControl = new TextControl({
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
    defaultText: (value) => formatDateTimeText(value, this.displayLocale),
    serialize: (text) => parseDateTimeText(text, this.displayLocale).value,
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

  /** The canonical value; the attribute supplies the initial and reset value. */
  get value(): string {
    return parseDateTimeText(this.control.value, this.displayLocale).value;
  }

  set value(value: string) {
    if (!this.editing) {
      this.displayLocale = resolveLocale(this.locale, this.config.locale, navigator.language);
    }
    this.control.set(formatDateTimeText(value, this.displayLocale));
    this.pickerTime = '';
    if (this.open) {
      this.preparePicker();
    }
  }

  /** The associated form. */
  get form(): HTMLFormElement | null {
    return this.internals.form;
  }

  /** Native validity of the host. */
  get validity(): ValidityState {
    this.control.syncValidity();
    return this.internals.validity;
  }

  /** Native or custom validation message. */
  get validationMessage(): string {
    this.control.syncValidity();
    return this.internals.validationMessage;
  }

  /** Whether the host participates in validation. */
  get willValidate(): boolean {
    return this.internals.willValidate;
  }

  /** Checks validity and dispatches invalid when needed. */
  // eslint-disable-next-line stencil/own-methods-must-be-private -- the synchronous API of a native control
  checkValidity(): boolean {
    this.control.syncValidity();
    return this.internals.checkValidity();
  }

  /** Reports validity using the visible input as anchor. */
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
    if (this.open) {
      this.preparePicker();
      this.focusCalendar = true;
    }
  }

  connectedCallback(): void {
    const parsed = parseDateTimeText(this.control.value, this.displayLocale);
    const nextLocale = resolveLocale(this.locale, this.config.locale, navigator.language);
    if (parsed.inputState === 'empty' || parsed.inputState === 'valid') {
      this.displayLocale = nextLocale;
      this.control.reformat(formatDateTimeText(parsed.value, nextLocale));
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
      this.preparePicker(true);
      this.focusCalendar = true;
    }
  }

  formAssociatedCallback(form: HTMLFormElement | null): void {
    this.control.formAssociated(form);
  }

  formDisabledCallback(disabled: boolean): void {
    this.formDisabled = disabled;
  }

  formResetCallback(): void {
    this.touched = false;
    this.editing = false;
    this.open = false;
    this.pickerTime = '';
    this.displayLocale = resolveLocale(this.locale, this.config.locale, navigator.language);
    this.control.reset();
  }

  formStateRestoreCallback(state: string | File | FormData | null): void {
    this.control.restoreState(state);
  }

  componentWillRender(): void {
    const nextLocale = resolveLocale(this.locale, this.config.locale, navigator.language);
    const parsed = parseDateTimeText(this.control.value, this.displayLocale);
    if (
      !this.editing &&
      nextLocale !== this.displayLocale &&
      (parsed.inputState === 'empty' || parsed.inputState === 'valid')
    ) {
      this.displayLocale = nextLocale;
      this.control.reformat(formatDateTimeText(parsed.value, nextLocale));
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
      this.mask.update(
        input,
        this.displayLocale,
        (event) => {
          if (input.value !== this.control.value) {
            this.notify(input.value, event);
          }
        },
        dateTimeMaskOptions,
      );
    }
    this.control.rendered();
    if (this.open) {
      const time = this.timeField();
      if (time !== null && time.value !== this.pickerTime) {
        time.value = this.pickerTime;
      }
      this.popup.show();
      if (this.focusCalendar) {
        this.focusCalendar = false;
        this.focusCalendarCell();
      }
    } else {
      this.popup.hide();
      if (this.returnFocus) {
        this.returnFocus = false;
        this.pickerButton()?.focus();
      }
    }
  }

  render(): VNode[] {
    const invalid = this.touched && !this.validity.valid;
    const appearance = fieldAppearance({
      variant: this.variant,
      size: this.size,
      labelPlacement: this.labelPlacement,
      hideLabel: this.hideLabel,
      state: invalid ? 'error' : this.state,
    });
    const hint =
      this.hint ??
      (this.getFormatHintLabel ?? this.config.labels.dateField.formatHint)(
        formatDateTimeText('2026-12-31T09:30', this.displayLocale),
      );
    const pickerLabel = this.openCalendarLabel ?? this.config.labels.dateTimeField.openPicker;
    const min =
      this.min !== undefined && isIsoLocalDateTime(this.min) ? this.min.slice(0, 10) : undefined;
    const max =
      this.max !== undefined && isIsoLocalDateTime(this.max) ? this.max.slice(0, 10) : undefined;
    const timeBounds = timeBoundsForDate(this.pickerDate, { min: this.min, max: this.max });
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
            part="picker-button"
            class="action picker-button"
            type="button"
            hidden={this.hideCalendarButton}
            disabled={!this.canOpen()}
            aria-label={pickerLabel}
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
        aria-label={pickerLabel}
        onKeyDown={this.onPanelKeyDown}
        onCancel={this.onCancel}
        onClose={this.onClose}
      >
        {this.open
          ? [
              <ui-calendar
                part="calendar"
                value={this.pickerDate}
                min={min}
                max={max}
                disabledDates={this.disabledDates}
                locale={this.displayLocale}
                firstDayOfWeek={this.firstDayOfWeek}
                today={this.today}
                onUi-value-change={this.onDatePick}
                onUi-month-change={(event) => {
                  event.stopPropagation();
                }}
              />,
              <ui-time-field
                part="time"
                label={this.timeLabel ?? this.config.labels.dateTimeField.timeLabel}
                min={timeBounds.min}
                max={timeBounds.max}
                onUi-value-change={this.onTimePick}
              />,
              <ui-button
                part="done-button"
                type="button"
                variant="secondary"
                onClick={(event) => {
                  this.close(event);
                }}
              >
                {this.config.labels.dateTimeField.done}
              </ui-button>,
            ]
          : null}
      </dialog>,
    ];
  }

  private input(): HTMLInputElement | null {
    return this.host.shadowRoot?.querySelector('input') ?? null;
  }

  private isDisabled(): boolean {
    return this.disabled || this.formDisabled;
  }

  private canOpen(): boolean {
    return !this.isDisabled() && !this.readOnly;
  }

  private panel(): HTMLDialogElement | null {
    return this.host.shadowRoot?.querySelector('dialog') ?? null;
  }

  private calendar(): HTMLUiCalendarElement | null {
    return this.host.shadowRoot?.querySelector('ui-calendar') ?? null;
  }

  private timeField(): HTMLUiTimeFieldElement | null {
    return this.host.shadowRoot?.querySelector('ui-time-field') ?? null;
  }

  private pickerButton(): HTMLButtonElement | null {
    return this.host.shadowRoot?.querySelector('.picker-button') ?? null;
  }

  private preparePicker(preservePending = false): void {
    const parts = dateTimeDraftParts(this.control.value, this.displayLocale);
    this.pickerDate = parts.date;
    if (!preservePending || parts.date !== '' || this.control.value !== '') {
      this.pickerTime = parts.time;
    }
  }

  private setOpen(open: boolean, originalEvent: globalThis.Event): void {
    if ((open && !this.canOpen()) || this.open === open) {
      return;
    }
    this.open = open;
    this.openChange.emit({ value: open, originalEvent });
  }

  private close(event: globalThis.Event): void {
    this.returnFocus = true;
    this.setOpen(false, event);
  }

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

  private parserMessage(): string {
    const reason = validateDateTime(parseDateTimeText(this.control.value, this.displayLocale), {
      min: this.min,
      max: this.max,
      disabledDates: this.disabledDates,
    });
    return reason === null
      ? ''
      : (this.getValidationMessageLabel ?? this.config.labels.dateTimeField.validationMessage)({
          reason,
          locale: this.displayLocale,
          min: this.min,
          max: this.max,
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
    if (!this.open) {
      this.pickerTime = '';
    }
    this.control.edit(text);
    const parsed = parseDateTimeText(text, this.displayLocale);
    this.valueChange.emit({
      ...parsed,
      text,
      originalEvent,
      validationError: validateDateTime(parsed, {
        min: this.min,
        max: this.max,
        disabledDates: this.disabledDates,
      }),
    });
  }

  private applyPicker(originalEvent: globalThis.Event): void {
    if (this.pickerDate === '') {
      return;
    }
    const value = joinLocalDateTime({ date: this.pickerDate, time: this.pickerTime });
    this.notify(
      value === ''
        ? formatDateText(this.pickerDate, this.displayLocale)
        : formatDateTimeText(value, this.displayLocale),
      originalEvent,
    );
  }

  private readonly onInput = (event: globalThis.Event): void => {
    const input = event.target;
    if (input instanceof HTMLInputElement && !(event instanceof InputEvent && event.isComposing)) {
      this.notify(input.value, event);
    }
  };

  private readonly onDatePick = (event: CustomEvent<CalendarChange>): void => {
    event.stopPropagation();
    if (!this.canOpen()) {
      return;
    }
    this.pickerDate = event.detail.value;
    this.applyPicker(event.detail.originalEvent);
  };

  private readonly onTimePick = (
    event: CustomEvent<{ value: string; originalEvent: globalThis.Event }>,
  ): void => {
    event.stopPropagation();
    if (!this.canOpen()) {
      return;
    }
    this.pickerTime = event.detail.value;
    this.applyPicker(event.detail.originalEvent);
  };

  private readonly onCancel = (event: globalThis.Event): void => {
    event.preventDefault();
    this.close(event);
  };

  private readonly onClose = (event: globalThis.Event): void => {
    this.setOpen(false, event);
  };

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
      ...(this.calendar()?.shadowRoot?.querySelectorAll<HTMLElement>(
        'ui-icon-button:not([disabled]), .zoom, [role="gridcell"][tabindex="0"]',
      ) ?? []),
    ];
    const time = this.timeField()?.shadowRoot?.querySelector<HTMLElement>('input');
    const done = this.host.shadowRoot
      ?.querySelector('ui-button')
      ?.shadowRoot?.querySelector<HTMLElement>('button');
    if (time !== null && time !== undefined) {
      stops.push(time);
    }
    if (done !== null && done !== undefined) {
      stops.push(done);
    }
    const first = stops.at(0);
    const last = stops.at(-1);
    if (first === undefined || last === undefined) {
      return;
    }
    if (event.composedPath().includes(event.shiftKey ? first : last)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    }
  };

  private readonly onInvalid = (): void => {
    this.touched = true;
  };

  private readonly onChange = (): void => {
    this.host.dispatchEvent(new globalThis.Event('change', { bubbles: true, composed: true }));
  };
}

type _DeclaresEveryProp = Pick<UiDateTimeField, keyof DateTimeFieldProps>;
