import { type OptionOf } from './component.ts';
import { type TextControlProps } from './text-field.ts';
export declare const textareaField: {
    readonly name: "TextareaField";
    readonly tag: "ui-textarea-field";
    readonly category: "Inputs";
    readonly status: "done";
    readonly figma: "2175:457";
    readonly design: {
        readonly flags: readonly ["disabled"];
        readonly booleans: readonly [];
        readonly codeOnly: readonly ["resize", "maxRows"];
        readonly previews: {
            readonly interaction: {
                readonly options: readonly ["rest", "active", "focus"];
                readonly default: "rest";
                readonly note: "Previews hover and press (active) and keyboard focus. Leave it at rest in a design.";
            };
            readonly valueState: {
                readonly options: readonly ["empty", "filled"];
                readonly default: "empty";
                readonly note: "Chooses the layout of an empty or a filled field. Keep it consistent with the text of value.";
            };
        };
    };
    readonly summary: "A multi-line text input with a label, hint and validation feedback.";
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
        readonly resize: {
            readonly options: readonly ["vertical", "none", "auto"];
            readonly default: "vertical";
        };
    };
    readonly labels: readonly [];
    readonly parts: readonly ["base", "control", "input", "label", "label-text", "hint", "hint-text"];
    readonly slots: readonly [];
    readonly events: readonly ["ui-value-change"];
    readonly stories: readonly ["Playground", "Variants", "Resize", "OnSurfaces"];
    readonly exceptions: readonly [{
        readonly items: readonly ["form", "validity", "validationMessage", "willValidate"];
        readonly reason: "The web component exposes its form-associated state. React exposes the native state through the ref of its textarea, and its form prop is the native form ID attribute.";
    }, {
        readonly items: readonly ["defaultValue"];
        readonly reason: "React uses defaultValue for an uncontrolled initial and reset value. The web component uses its value attribute for that, and its property for the current value.";
    }, {
        readonly items: readonly ["inputMode", "enterKeyHint", "spellCheck"];
        readonly reason: "The web component passes the native inputmode, enterkeyhint and spellcheck attributes of its host to the textarea, since HTMLElement already owns these properties. React takes them as props of the textarea.";
    }];
};
export type TextareaFieldResize = OptionOf<typeof textareaField, 'resize'>;
export interface TextareaFieldProps extends TextControlProps {
    resize?: TextareaFieldResize;
    maxRows?: number;
}
