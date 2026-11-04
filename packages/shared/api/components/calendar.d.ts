import type { DateConstraints } from '../utils/date.ts';
export declare const calendar: {
    readonly name: "Calendar";
    readonly tag: "ui-calendar";
    readonly category: "Inputs";
    readonly status: "in-progress";
    readonly figma: "2107:46";
    readonly design: {
        readonly flags: readonly ["range"];
        readonly booleans: readonly [];
        readonly codeOnly: readonly ["value", "month", "min", "max", "disabledDates", "locale", "firstDayOfWeek", "today", "previousMonthLabel", "nextMonthLabel", "previousYearLabel", "nextYearLabel", "previousYearsLabel", "nextYearsLabel", "getChooseMonthLabel", "getChooseYearLabel"];
        readonly previews: {
            readonly view: {
                readonly options: readonly ["days", "months", "years"];
                readonly default: "days";
                readonly note: "Previews the grid the heading button opens: the days of a month, the months of a year or a page of 24 years. Code starts on the days and moves between the grids as the user picks.";
            };
        };
    };
    readonly summary: "A month of days, with a grid of months and of years behind its heading, to pick a date or a range.";
    readonly options: {};
    readonly labels: readonly ["previousMonth", "nextMonth", "previousYear", "nextYear", "previousYears", "nextYears", "chooseMonth", "chooseYear"];
    readonly parts: readonly ["base", "header", "heading", "previous", "next", "grid", "weekday", "cell"];
    readonly slots: readonly [];
    readonly events: readonly ["ui-value-change", "ui-month-change"];
    readonly stories: readonly ["Playground", "Range", "WithConstraints", "WithLocale", "OnSurfaces"];
    readonly exceptions: readonly [{
        readonly items: readonly ["size"];
        readonly reason: "The cells have the one size of a hit area, so the calendar has no size prop.";
    }, {
        readonly items: readonly ["value", "range"];
        readonly reason: "A range is one string, the ISO interval start/end that a form submits, so that the web component takes it as an attribute. The value changes once a user picks the end of a range, and not when they pick its start.";
    }, {
        readonly items: readonly ["defaultValue", "defaultMonth"];
        readonly reason: "React pairs value with defaultValue and month with defaultMonth for an uncontrolled calendar. The web component takes the first value and month from its attributes and holds the current ones in its properties.";
    }, {
        readonly items: readonly ["disabledDates"];
        readonly reason: "The web component takes an array or predicate as a property only, without an attribute.";
    }];
};
export interface CalendarChangeDetails<OriginalEvent> {
    readonly originalEvent: OriginalEvent;
}
export interface CalendarChangeDetail<OriginalEvent> extends CalendarChangeDetails<OriginalEvent> {
    readonly value: string;
}
export interface CalendarProps extends DateConstraints {
    value?: string;
    range?: boolean;
    month?: string;
    locale?: string;
    firstDayOfWeek?: number;
    today?: string;
    previousMonthLabel?: string;
    nextMonthLabel?: string;
    previousYearLabel?: string;
    nextYearLabel?: string;
    previousYearsLabel?: string;
    nextYearsLabel?: string;
    getChooseMonthLabel?: (monthAndYear: string) => string;
    getChooseYearLabel?: (year: string) => string;
}
