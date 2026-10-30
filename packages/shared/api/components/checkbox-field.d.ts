import { type OptionOf } from './component.ts';
export declare const checkboxField: {
    readonly name: "CheckboxField";
    readonly tag: "ui-checkbox-field";
    readonly category: "Selection";
    readonly status: "done";
    readonly figma: "1145:1141";
    readonly design: {
        readonly flags: readonly ["checked", "indeterminate", "disabled"];
        readonly booleans: readonly [];
        readonly codeOnly: readonly [];
        readonly previews: {
            readonly interaction: {
                readonly options: readonly ["rest", "active", "focus"];
                readonly default: "rest";
                readonly note: "Previews hover and press (active) and keyboard focus. Leave it at rest in a design.";
            };
        };
    };
    readonly summary: "A checkbox with a label and hint that a user turns on and off, with a mixed state for a partial selection.";
    readonly options: {
        readonly state: {
            readonly options: readonly ["default", "error"];
            readonly default: "default";
        };
    };
    readonly labels: readonly [];
    readonly parts: readonly ["base", "label", "control", "input", "mark", "label-text", "hint", "hint-text"];
    readonly slots: readonly [];
    readonly events: readonly ["ui-checked-change"];
    readonly stories: readonly ["Playground", "States", "Indeterminate", "OnSurfaces"];
    readonly exceptions: readonly [{
        readonly items: readonly ["state"];
        readonly reason: "A choice has no success state: a checked box already confirms the choice. The state of the choice controls is default or error.";
    }, {
        readonly items: readonly ["form", "validity", "validationMessage", "willValidate"];
        readonly reason: "The web component exposes its form-associated state. React exposes the native state through the ref of its input, and its form prop is the native form ID attribute.";
    }, {
        readonly items: readonly ["defaultChecked"];
        readonly reason: "React uses defaultChecked for an uncontrolled initial and reset state. The web component uses its checked attribute for that, and its property for the current state, as a native checkbox does.";
    }, {
        readonly items: readonly ["value"];
        readonly reason: "As on a native checkbox, value is the string the form submits while the box is checked, not its state, which is checked.";
    }];
};
export type ChoiceState = OptionOf<typeof checkboxField, 'state'>;
export interface CheckedChangeDetails<OriginalEvent> {
    readonly originalEvent: OriginalEvent;
}
export interface CheckedChangeDetail<OriginalEvent> extends CheckedChangeDetails<OriginalEvent> {
    readonly value: boolean;
}
export interface ChoiceControlProps {
    label?: string;
    hint?: string;
    disabled?: boolean;
}
export interface CheckboxFieldProps extends ChoiceControlProps {
    checked?: boolean;
    indeterminate?: boolean;
    state?: ChoiceState;
    required?: boolean;
    name?: string;
    value?: string;
}
