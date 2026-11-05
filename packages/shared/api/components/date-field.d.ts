import type { DateConstraints, DateValidationContext, DateValidationError } from '../utils/date.ts';
import type { ParsedFieldProps, ParsedInputDetails } from '../utils/parsed-input.ts';
export declare const dateField: {
    readonly name: "DateField";
    readonly tag: "ui-date-field";
    readonly category: "Inputs";
    readonly status: "done";
    readonly figma: "3190:372";
    readonly design: {
        readonly nested: "TextField";
        readonly flags: readonly ["open"];
        readonly booleans: readonly [];
        readonly previews: {};
        readonly codeOnly: readonly ["locale", "min", "max", "disabledDates", "firstDayOfWeek", "today", "openCalendarLabel", "readOnly", "required", "name", "autoComplete", "getFormatHintLabel", "getValidationMessageLabel"];
    };
    readonly summary: "A masked date input with a locale-aware display and an ISO calendar-date value, and a calendar to pick the date from.";
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
    readonly labels: readonly ["formatHint", "validationMessage", "openCalendar"];
    readonly parts: readonly ["base", "control", "input-row", "input", "calendar-button", "panel", "calendar", "label", "label-text", "hint", "hint-text"];
    readonly slots: readonly [];
    readonly events: readonly ["ui-value-change", "ui-open-change"];
    readonly stories: readonly ["Playground", "Variants", "WithLocale", "WithConstraints", "OnSurfaces"];
    readonly exceptions: readonly [{
        readonly items: readonly ["form", "validity", "validationMessage", "willValidate"];
        readonly reason: "The web component exposes its form-associated state. React exposes the native state through the ref of its input, and its form prop is the native form ID attribute.";
    }, {
        readonly items: readonly ["defaultValue"];
        readonly reason: "React uses defaultValue for an uncontrolled initial and reset value. The web component uses its value attribute for that, and its property for the current value.";
    }, {
        readonly items: readonly ["inputMode", "enterKeyHint", "spellCheck"];
        readonly reason: "The web component passes the native inputmode, enterkeyhint and spellcheck attributes of its host to the input, since HTMLElement already owns these properties. React takes them as props of the input.";
    }, {
        readonly items: readonly ["value", "name", "min", "max"];
        readonly reason: "The visible input and its ref hold editable text. Form data and value use the canonical ISO date. React submits through a hidden input. Parsing and constraint errors use customError on the text input.";
    }, {
        readonly items: readonly ["disabledDates"];
        readonly reason: "The web component takes an array or predicate as a property only, without an attribute.";
    }, {
        readonly items: readonly ["defaultOpen"];
        readonly reason: "React uses defaultOpen for an uncontrolled initial state. The web component uses its open attribute for that, and its property for the current state.";
    }];
};
export type DateFieldValueChangeDetails<OriginalEvent> = ParsedInputDetails<OriginalEvent, DateValidationError>;
export interface DateFieldValueChangeDetail<OriginalEvent> extends DateFieldValueChangeDetails<OriginalEvent> {
    readonly value: string;
}
export interface DateFieldOpenChangeDetails<OriginalEvent> {
    readonly originalEvent: OriginalEvent;
}
export interface DateFieldOpenChangeDetail<OriginalEvent> extends DateFieldOpenChangeDetails<OriginalEvent> {
    readonly value: boolean;
}
export interface DateFieldProps extends ParsedFieldProps, DateConstraints {
    value?: string;
    open?: boolean;
    hideCalendarButton?: boolean;
    firstDayOfWeek?: number;
    today?: string;
    openCalendarLabel?: string;
    getFormatHintLabel?: (example: string) => string;
    getValidationMessageLabel?: (context: DateValidationContext) => string;
}
