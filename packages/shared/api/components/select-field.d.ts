import type { ListboxItems } from './listbox.ts';
import { type FieldControlProps } from './text-field.ts';
export declare const selectField: {
    readonly name: "SelectField";
    readonly tag: "ui-select-field";
    readonly category: "Selection";
    readonly status: "in-progress";
    readonly figma: "1370:179";
    readonly design: {
        readonly flags: readonly ["disabled", "open"];
        readonly booleans: readonly ["clearable"];
        readonly codeOnly: readonly ["options", "name", "required"];
        readonly previews: {
            readonly interaction: {
                readonly options: readonly ["rest", "active", "focus"];
                readonly default: "rest";
                readonly note: "Previews hover and press (active) and keyboard focus. Leave it at rest in a design.";
            };
            readonly valueState: {
                readonly options: readonly ["empty", "filled"];
                readonly default: "empty";
                readonly note: "Chooses the layout of a field without and with a chosen option. Keep it consistent with the text of value.";
            };
        };
    };
    readonly summary: "A field that opens a list of options from which a user chooses one value.";
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
    readonly parts: readonly ["base", "label", "label-text", "control", "trigger", "value", "leading-icon", "indicator", "clear", "popup", "listbox", "group", "group-label", "option", "option-icon", "option-label", "option-mark", "message", "hint", "hint-text"];
    readonly slots: readonly ["leading-icon"];
    readonly events: readonly ["ui-value-change", "ui-open-change"];
    readonly stories: readonly ["Playground", "Variants", "Groups", "OnSurfaces"];
    readonly exceptions: readonly [{
        readonly items: readonly ["form", "validity", "validationMessage", "willValidate"];
        readonly reason: "The web component exposes its form-associated state. React renders a hidden native select with the same options, so the browser validates and submits it.";
    }, {
        readonly items: readonly ["defaultValue", "defaultOpen"];
        readonly reason: "React uses defaultValue and defaultOpen for an uncontrolled initial state. The web component uses its value and open attributes for that, and its properties for the current state.";
    }, {
        readonly items: readonly ["value"];
        readonly reason: "The empty string means that no option is chosen, so no option may have it as its value.";
    }, {
        readonly items: readonly ["icon"];
        readonly reason: "The icon of an option is an SVG string of the icon package in the web component and a React node in React, since data cannot carry a slot.";
    }];
};
export interface SelectFieldOpenChangeDetails<OriginalEvent> {
    readonly originalEvent: OriginalEvent;
}
export interface SelectFieldOpenChangeDetail<OriginalEvent> extends SelectFieldOpenChangeDetails<OriginalEvent> {
    readonly value: boolean;
}
export interface SelectFieldProps<Icon = unknown> extends FieldControlProps {
    options?: ListboxItems<Icon>;
    value?: string;
    open?: boolean;
    clearable?: boolean;
    clearLabel?: string;
    emptyLabel?: string;
}
