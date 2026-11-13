import type { DateValidationError } from '../utils/date.ts';
import type { ParsedInputDetails } from '../utils/parsed-input.ts';
import type { TimeValidationError } from '../utils/time.ts';
import { type DateFieldProps } from './date-field.ts';
export declare const dateTimeField: {
    readonly name: "DateTimeField";
    readonly tag: "ui-date-time-field";
    readonly category: "Inputs";
    readonly status: "in-progress";
    readonly figma: "3330:621";
    readonly design: {
        readonly nested: "TextField";
        readonly flags: readonly ["open"];
        readonly booleans: readonly [];
        readonly codeOnly: readonly ["locale", "min", "max", "disabledDates", "firstDayOfWeek", "today", "timeLabel", "openCalendarLabel", "readOnly", "required", "name", "autoComplete", "getFormatHintLabel", "getValidationMessageLabel"];
        readonly previews: {};
    };
    readonly summary: "A masked date and time input with a combined picker and a local value with minute precision.";
    readonly options: {
        readonly variant: {
            readonly options: readonly ["outline", "filled", "underlined"];
            readonly default: "outline";
        };
        readonly size: {
            readonly options: readonly ["small", "medium", "large"];
            readonly default: "medium";
        };
        readonly labelPlacement: {
            readonly options: readonly ["top", "floating", "inner"];
            readonly default: "top";
        };
        readonly state: {
            readonly options: readonly ["default", "error", "success"];
            readonly default: "default";
        };
    };
    readonly labels: readonly ["openPicker", "timeLabel", "done", "validationMessage"];
    readonly parts: readonly ["base", "control", "input-row", "input", "picker-button", "panel", "calendar", "time", "done-button", "label", "label-row", "label-text", "label-hint", "hint", "hint-text"];
    readonly slots: readonly [];
    readonly events: readonly ["ui-value-change", "ui-open-change"];
    readonly stories: readonly ["Playground", "Variants", "WithLocale", "WithConstraints", "OnSurfaces"];
    readonly exceptions: readonly [{
        readonly items: readonly ["value", "name", "min", "max"];
        readonly reason: "The visible input holds localized editable text while the form submits one canonical local date-time without a time-zone conversion.";
    }, {
        readonly items: readonly ["disabledDates"];
        readonly reason: "The web component takes an array or predicate as a property only, without an attribute.";
    }];
};
export type DateTimeValidationError = DateValidationError | TimeValidationError;
export interface DateTimeValidationContext {
    readonly reason: DateTimeValidationError;
    readonly locale: string;
    readonly min?: string;
    readonly max?: string;
}
export type DateTimeFieldValueChangeDetails<OriginalEvent> = ParsedInputDetails<OriginalEvent, DateTimeValidationError>;
export interface DateTimeFieldValueChangeDetail<OriginalEvent> extends DateTimeFieldValueChangeDetails<OriginalEvent> {
    readonly value: string;
}
export interface DateTimeFieldProps extends Omit<DateFieldProps, 'getValidationMessageLabel'> {
    value?: string;
    timeLabel?: string;
    openCalendarLabel?: string;
    getValidationMessageLabel?: (context: DateTimeValidationContext) => string;
}
