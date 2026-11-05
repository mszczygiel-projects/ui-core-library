import { type ChoiceState } from './checkbox-field.ts';
import { type OptionOf } from './component.ts';
export declare const listbox: {
    readonly name: "Listbox";
    readonly tag: "ui-listbox";
    readonly category: "Selection";
    readonly status: "done";
    readonly figma: "3031:560";
    readonly design: {
        readonly flags: readonly ["multiple", "disabled"];
        readonly booleans: readonly [];
        readonly codeOnly: readonly ["options", "name", "required"];
        readonly previews: {
            readonly interaction: {
                readonly options: readonly ["rest", "active", "focus"];
                readonly default: "rest";
                readonly note: "Previews hover and press (active) and keyboard focus. Leave it at rest in a design.";
            };
            readonly content: {
                readonly options: readonly ["options", "groups", "empty"];
                readonly default: "options";
                readonly note: "Chooses a flat list, a list in groups or the message of an empty list. Keep it consistent with the options of the design.";
            };
        };
    };
    readonly summary: "A visible list of options from which a user chooses one value or several.";
    readonly options: {
        readonly size: {
            readonly options: readonly ["small", "medium", "large"];
            readonly default: "medium";
        };
        readonly state: {
            readonly options: readonly ["default", "error"];
            readonly default: "default";
        };
    };
    readonly labels: readonly ["empty"];
    readonly parts: readonly ["base", "label", "label-text", "listbox", "group", "group-label", "option", "option-icon", "option-label", "option-mark", "message", "hint", "hint-text"];
    readonly slots: readonly [];
    readonly events: readonly ["ui-value-change"];
    readonly stories: readonly ["Playground", "Multiple", "Groups", "OnSurfaces"];
    readonly exceptions: readonly [{
        readonly items: readonly ["state"];
        readonly reason: "A choice has no success state: a chosen option already confirms the choice. The state of the choice controls is default or error.";
    }, {
        readonly items: readonly ["form", "validity", "validationMessage", "willValidate"];
        readonly reason: "The web component exposes its form-associated state. React renders a hidden native select with the same options, so the browser validates and submits them.";
    }, {
        readonly items: readonly ["defaultValue"];
        readonly reason: "React uses defaultValue for an uncontrolled initial and reset value. The web component uses its value attribute for one value and its defaultValue property for several, since an attribute cannot hold a list.";
    }, {
        readonly items: readonly ["value"];
        readonly reason: "The empty string means that no option is chosen, so no option may have it as its value.";
    }, {
        readonly items: readonly ["icon"];
        readonly reason: "The icon of an option is an SVG string of the icon package in the web component and a React node in React, since data cannot carry a slot.";
    }];
};
export type ListboxSize = OptionOf<typeof listbox, 'size'>;
export interface ListboxOption<Icon = never> {
    readonly value: string;
    readonly label: string;
    readonly disabled?: boolean;
    readonly icon?: Icon;
}
export interface ListboxGroup<Icon = never> {
    readonly label?: string;
    readonly options: readonly ListboxOption<Icon>[];
}
export type ListboxItems<Icon = never> = readonly ListboxOption<Icon>[] | readonly ListboxGroup<Icon>[];
export type ListboxValue = string | readonly string[];
export interface ListboxValueChangeDetails<OriginalEvent> {
    readonly originalEvent: OriginalEvent;
}
export interface ListboxValueChangeDetail<OriginalEvent, Value extends ListboxValue = ListboxValue> extends ListboxValueChangeDetails<OriginalEvent> {
    readonly value: Value;
}
export interface ListboxProps<Icon = unknown> {
    label?: string;
    hint?: string;
    size?: ListboxSize;
    state?: ChoiceState;
    multiple?: boolean;
    disabled?: boolean;
    required?: boolean;
    name?: string;
    options?: ListboxItems<Icon>;
    value?: ListboxValue;
    emptyLabel?: string;
}
