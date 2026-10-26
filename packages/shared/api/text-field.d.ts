import { type OptionOf } from './component.ts';
export declare const textField: {
    readonly name: "TextField";
    readonly tag: "ui-text-field";
    readonly category: "Inputs";
    readonly status: "done";
    readonly figma: "144:293";
    readonly summary: "A single-line text input with a label, hint and validation feedback.";
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
        readonly type: {
            readonly options: readonly ["text", "email", "tel", "url"];
            readonly default: "text";
        };
    };
    readonly labels: readonly [];
    readonly parts: readonly ["base", "control", "input-row", "input", "label", "label-text", "hint", "hint-text", "leading-icon", "trailing-icon"];
    readonly slots: readonly ["leading-icon", "trailing-icon"];
    readonly events: readonly ["ui-value-change"];
    readonly stories: readonly ["Playground", "Variants", "OnSurfaces", "WithIcons"];
    readonly exceptions: readonly [{
        readonly items: readonly ["form", "validity", "validationMessage", "willValidate"];
        readonly reason: "The web component exposes its form-associated state. React exposes the native state through the ref of its input, and its form prop is the native form ID attribute.";
    }, {
        readonly items: readonly ["defaultValue"];
        readonly reason: "React uses defaultValue for an uncontrolled initial and reset value. The web component uses its value attribute for that, and its property for the current value.";
    }, {
        readonly items: readonly ["inputMode", "enterKeyHint"];
        readonly reason: "The web component keeps the string types of the properties HTMLElement already has. React keeps the narrower unions of its input attributes. Both pass them to the native input.";
    }];
};
export type TextFieldVariant = OptionOf<typeof textField, 'variant'>;
export type TextFieldSize = OptionOf<typeof textField, 'size'>;
export type TextFieldLabelPlacement = OptionOf<typeof textField, 'labelPlacement'>;
export type TextFieldState = OptionOf<typeof textField, 'state'>;
export type TextFieldType = OptionOf<typeof textField, 'type'>;
export interface TextFieldValueChangeDetails<OriginalEvent> {
    readonly originalEvent: OriginalEvent;
}
export interface TextFieldValueChangeDetail<OriginalEvent> extends TextFieldValueChangeDetails<OriginalEvent> {
    readonly value: string;
}
export interface TextFieldProps {
    variant?: TextFieldVariant;
    size?: TextFieldSize;
    labelPlacement?: TextFieldLabelPlacement;
    label?: string;
    placeholder?: string;
    hint?: string;
    state?: TextFieldState;
    disabled?: boolean;
    readOnly?: boolean;
    required?: boolean;
    name?: string;
    value?: string;
    type?: TextFieldType;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    autoComplete?: string;
    spellCheck?: boolean;
}
