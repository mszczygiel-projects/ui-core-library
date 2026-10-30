import { type ChoiceControlProps, type ChoiceState } from './checkbox-field.ts';
import { type OptionOf } from './component.ts';
export declare const switchField: {
    readonly name: "SwitchField";
    readonly tag: "ui-switch-field";
    readonly category: "Selection";
    readonly status: "done";
    readonly figma: "2251:2499";
    readonly design: {
        readonly flags: readonly ["checked", "disabled"];
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
    readonly summary: "A switch with a label and hint that turns a setting on or off at once.";
    readonly options: {
        readonly labelPosition: {
            readonly options: readonly ["start", "end"];
            readonly default: "end";
        };
        readonly state: {
            readonly options: readonly ["default", "error"];
            readonly default: "default";
        };
    };
    readonly labels: readonly [];
    readonly parts: readonly ["base", "label", "control", "thumb", "icon", "input", "label-text", "hint", "hint-text"];
    readonly slots: readonly ["icon-on", "icon-off"];
    readonly events: readonly ["ui-checked-change"];
    readonly stories: readonly ["Playground", "LabelPosition", "WithIcons", "OnSurfaces"];
    readonly exceptions: readonly [{
        readonly items: readonly ["state"];
        readonly reason: "A choice has no success state: a switch that is on already confirms the setting. The state of the choice controls is default or error.";
    }, {
        readonly items: readonly ["required"];
        readonly reason: "A switch applies a setting at once and has no answer a form could require; ARIA does not support aria-required on the switch role. A choice the form requires is a CheckboxField.";
    }, {
        readonly items: readonly ["form", "validity", "validationMessage", "willValidate"];
        readonly reason: "The web component exposes its form-associated state. React exposes the native state through the ref of its input, and its form prop is the native form ID attribute.";
    }, {
        readonly items: readonly ["defaultChecked"];
        readonly reason: "React uses defaultChecked for an uncontrolled initial and reset state. The web component uses its checked attribute for that, and its property for the current state, as a native checkbox does.";
    }, {
        readonly items: readonly ["value"];
        readonly reason: "As on a native checkbox, value is the string the form submits while the switch is on, not its state, which is checked.";
    }];
};
export type SwitchFieldLabelPosition = OptionOf<typeof switchField, 'labelPosition'>;
export interface SwitchFieldProps extends ChoiceControlProps {
    labelPosition?: SwitchFieldLabelPosition;
    checked?: boolean;
    state?: ChoiceState;
    name?: string;
    value?: string;
}
