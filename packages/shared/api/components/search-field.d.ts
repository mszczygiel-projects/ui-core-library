import { type TextControlProps } from './text-field.ts';
export declare const searchField: {
    readonly name: "SearchField";
    readonly tag: "ui-search-field";
    readonly category: "Inputs";
    readonly status: "done";
    readonly figma: "2972:1698";
    readonly design: {
        readonly flags: readonly [];
        readonly booleans: readonly [];
        readonly codeOnly: readonly [];
        readonly previews: {};
        readonly nested: "TextField";
    };
    readonly summary: "A search input with a button that clears the query.";
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
    readonly labels: readonly ["clear"];
    readonly parts: readonly ["base", "control", "input-row", "input", "label", "label-row", "label-text", "label-hint", "hint", "hint-text", "leading-icon", "clear", "clear-icon"];
    readonly slots: readonly [];
    readonly events: readonly ["ui-value-change", "ui-clear"];
    readonly stories: readonly ["Playground", "Variants", "InForm", "OnSurfaces"];
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
export interface SearchFieldClearDetails<OriginalEvent> {
    readonly originalEvent: OriginalEvent;
}
export interface SearchFieldProps extends TextControlProps {
    pattern?: string;
    clearLabel?: string;
}
