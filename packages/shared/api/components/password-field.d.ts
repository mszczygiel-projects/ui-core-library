import { type TextControlProps } from './text-field.ts';
export declare const passwordField: {
    readonly name: "PasswordField";
    readonly tag: "ui-password-field";
    readonly category: "Inputs";
    readonly status: "in-progress";
    readonly figma: "229:3491";
    readonly design: {
        readonly flags: readonly ["revealed"];
        readonly booleans: readonly [];
        readonly codeOnly: readonly [];
        readonly previews: {};
        readonly nested: "TextField";
    };
    readonly summary: "A password input with a button that shows or hides the password.";
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
    readonly labels: readonly ["reveal"];
    readonly parts: readonly ["base", "control", "input-row", "input", "label", "label-text", "hint", "hint-text", "reveal", "reveal-icon"];
    readonly slots: readonly [];
    readonly events: readonly ["ui-value-change", "ui-revealed-change"];
    readonly stories: readonly ["Playground", "Variants", "Revealed", "OnSurfaces"];
    readonly exceptions: readonly [{
        readonly items: readonly ["form", "validity", "validationMessage", "willValidate"];
        readonly reason: "The web component exposes its form-associated state. React exposes the native state through the ref of its input, and its form prop is the native form ID attribute.";
    }, {
        readonly items: readonly ["defaultValue", "defaultRevealed"];
        readonly reason: "React uses defaultValue and defaultRevealed for uncontrolled initial and reset values. The web component uses its value and revealed attributes for them, and its properties for the current state.";
    }, {
        readonly items: readonly ["inputMode", "enterKeyHint", "spellCheck"];
        readonly reason: "The web component passes the native inputmode, enterkeyhint and spellcheck attributes of its host to the input, since HTMLElement already owns these properties. React takes them as props of the input.";
    }];
};
export interface PasswordFieldRevealedChangeDetails<OriginalEvent> {
    readonly originalEvent: OriginalEvent;
}
export interface PasswordFieldRevealedChangeDetail<OriginalEvent> extends PasswordFieldRevealedChangeDetails<OriginalEvent> {
    readonly value: boolean;
}
export interface PasswordFieldProps extends TextControlProps {
    pattern?: string;
    revealed?: boolean;
    revealLabel?: string;
}
