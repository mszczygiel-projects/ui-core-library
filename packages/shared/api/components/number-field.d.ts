import type { NumberConstraints, NumberValidationContext, NumberValidationError } from '../utils/numeric.ts';
import type { ParsedFieldProps, ParsedInputDetails } from '../utils/parsed-input.ts';
import { type OptionOf } from './component.ts';
export declare const numberField: {
    readonly name: "NumberField";
    readonly tag: "ui-number-field";
    readonly category: "Inputs";
    readonly status: "in-progress";
    readonly figma: "2193:2228";
    readonly design: {
        readonly nested: "TextField";
        readonly flags: readonly [];
        readonly booleans: readonly [];
        readonly previews: {};
        readonly codeOnly: readonly ["locale", "min", "max", "step", "precision", "readOnly", "required", "name", "autoComplete", "decrementLabel", "incrementLabel", "getValidationMessageLabel"];
    };
    readonly summary: "A locale-aware number input with validation and optional decrement and increment buttons.";
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
        readonly controls: {
            readonly options: readonly ["none", "inline"];
            readonly default: "none";
        };
    };
    readonly labels: readonly ["decrement", "increment", "validationMessage"];
    readonly parts: readonly ["base", "control", "input-row", "input", "label", "label-text", "hint", "hint-text", "decrement", "decrement-icon", "increment", "increment-icon"];
    readonly slots: readonly [];
    readonly events: readonly ["ui-value-change"];
    readonly stories: readonly ["Playground", "Variants", "WithControls", "WithDecimals", "WithLocale", "OnSurfaces"];
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
        readonly items: readonly ["value", "name", "min", "max", "step", "precision"];
        readonly reason: "The visible input and its ref hold editable text. Form data and value use the canonical number. React submits through a hidden input. Parsing and constraint errors use customError on the text input.";
    }];
};
export type NumberFieldControls = OptionOf<typeof numberField, 'controls'>;
export type NumberFieldValueChangeDetails<OriginalEvent> = ParsedInputDetails<OriginalEvent, NumberValidationError>;
export interface NumberFieldValueChangeDetail<OriginalEvent> extends NumberFieldValueChangeDetails<OriginalEvent> {
    readonly value: number | null;
}
export interface NumberFieldProps extends ParsedFieldProps, NumberConstraints {
    value?: number | null;
    controls?: NumberFieldControls;
    decrementLabel?: string;
    incrementLabel?: string;
    getValidationMessageLabel?: (context: NumberValidationContext) => string;
}
