import type { TimeConstraints } from '../utils/time.ts';
import { type TextControlProps } from './text-field.ts';
export declare const timeField: {
    readonly name: "TimeField";
    readonly tag: "ui-time-field";
    readonly category: "Inputs";
    readonly status: "in-progress";
    readonly figma: "3329:4";
    readonly design: {
        readonly nested: "TextField";
        readonly flags: readonly [];
        readonly booleans: readonly [];
        readonly codeOnly: readonly ["min", "max", "readOnly", "required", "name", "autoComplete"];
        readonly previews: {};
    };
    readonly summary: "A time input with a native time picker and a 24-hour value with minute precision.";
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
    readonly labels: readonly ["inconsistentLimits"];
    readonly parts: readonly ["base", "control", "input-row", "input", "label", "label-row", "label-text", "label-hint", "hint", "hint-text"];
    readonly slots: readonly [];
    readonly events: readonly ["ui-value-change"];
    readonly stories: readonly ["Playground", "Variants", "WithConstraints", "OnSurfaces"];
    readonly exceptions: readonly [{
        readonly items: readonly ["form", "validity", "validationMessage", "willValidate"];
        readonly reason: "The web component exposes its form-associated state. React exposes the native state through the ref of its input, and its form prop is the native form ID attribute.";
    }, {
        readonly items: readonly ["defaultValue"];
        readonly reason: "React uses defaultValue for an uncontrolled initial and reset value. The web component uses its value attribute for that, and its property for the current value.";
    }, {
        readonly items: readonly ["inputMode", "enterKeyHint", "spellCheck"];
        readonly reason: "The web component passes the native inputmode, enterkeyhint and spellcheck attributes of its host to the input, since HTMLElement already owns these properties. React takes them as props of the input.";
    }];
};
export interface TimeFieldValueChangeDetails<OriginalEvent> {
    readonly originalEvent: OriginalEvent;
}
export interface TimeFieldValueChangeDetail<OriginalEvent> extends TimeFieldValueChangeDetails<OriginalEvent> {
    readonly value: string;
}
export interface TimeFieldProps extends Omit<TextControlProps, 'minLength' | 'maxLength' | 'placeholder'>, TimeConstraints {
    value?: string;
}
