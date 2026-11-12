import { type OptionOf } from './component.ts';
import type { ListboxItems, ListboxValue } from './listbox.ts';
import { type FieldControlProps } from './text-field.ts';
export declare const combobox: {
    readonly name: "Combobox";
    readonly tag: "ui-combobox";
    readonly category: "Selection";
    readonly status: "done";
    readonly figma: "2273:665";
    readonly design: {
        readonly flags: readonly ["open", "multiple"];
        readonly booleans: readonly ["clearable"];
        readonly codeOnly: readonly ["options", "name", "required", "filterMode", "loading", "allowCreate"];
        readonly previews: {};
        readonly nested: "TextField";
    };
    readonly summary: "A text field that filters a list of options from which a user chooses one value or several.";
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
        readonly filterMode: {
            readonly options: readonly ["local", "remote"];
            readonly default: "local";
        };
    };
    readonly labels: readonly ["clear", "create"];
    readonly parts: readonly ["base", "label", "label-row", "label-text", "label-hint", "control", "input-row", "chips", "chip", "input", "leading-icon", "indicator", "clear", "popup", "listbox", "group", "group-label", "option", "option-icon", "option-label", "option-mark", "create", "message", "hint", "hint-text"];
    readonly slots: readonly ["leading-icon"];
    readonly events: readonly ["ui-value-change", "ui-open-change", "ui-query-change", "ui-create"];
    readonly stories: readonly ["Playground", "Multiple", "RemoteFiltering", "Create", "OnSurfaces"];
    readonly exceptions: readonly [{
        readonly items: readonly ["form", "validity", "validationMessage", "willValidate"];
        readonly reason: "The web component exposes its form-associated state. React renders a hidden native select with the chosen options, so the browser validates and submits them.";
    }, {
        readonly items: readonly ["defaultValue", "defaultOpen"];
        readonly reason: "React uses defaultValue and defaultOpen for an uncontrolled initial state. The web component uses its value attribute for one value, its defaultValue property for several and its open attribute, and its properties for the current state.";
    }, {
        readonly items: readonly ["value"];
        readonly reason: "The empty string means that no option is chosen, so no option may have it as its value. The query a user types is never a value.";
    }, {
        readonly items: readonly ["icon"];
        readonly reason: "The icon of an option is an SVG string of the icon package in the web component and a React node in React, since data cannot carry a slot.";
    }];
};
export type ComboboxFilterMode = OptionOf<typeof combobox, 'filterMode'>;
export interface ComboboxQueryDetails<OriginalEvent> {
    readonly originalEvent: OriginalEvent;
}
export interface ComboboxQueryDetail<OriginalEvent> extends ComboboxQueryDetails<OriginalEvent> {
    readonly value: string;
}
export interface ComboboxProps<Icon = unknown> extends FieldControlProps {
    options?: ListboxItems<Icon>;
    value?: ListboxValue;
    multiple?: boolean;
    open?: boolean;
    clearable?: boolean;
    filterMode?: ComboboxFilterMode;
    loading?: boolean;
    allowCreate?: boolean;
    clearLabel?: string;
    emptyLabel?: string;
    loadingLabel?: string;
    getCreateLabel?: (query: string) => string;
}
