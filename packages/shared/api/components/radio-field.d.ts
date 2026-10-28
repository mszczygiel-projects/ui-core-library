import { type ChoiceControlProps } from './checkbox-field.ts';
export declare const radioField: {
    readonly name: "RadioField";
    readonly tag: "ui-radio-field";
    readonly category: "Selection";
    readonly status: "in-progress";
    readonly figma: "1217:1382";
    readonly design: {
        readonly flags: readonly ["disabled"];
        readonly booleans: readonly [];
        readonly codeOnly: readonly [];
        readonly previews: {
            readonly interaction: {
                readonly options: readonly ["rest", "active", "focus"];
                readonly default: "rest";
                readonly note: "Previews hover and press (active) and keyboard focus. Leave it at rest in a design.";
            };
            readonly checked: {
                readonly options: readonly ["false", "true"];
                readonly default: "false";
                readonly note: "Previews the chosen option. In code, the value of the RadioGroup chooses it.";
            };
            readonly state: {
                readonly options: readonly ["default", "error"];
                readonly default: "default";
                readonly note: "Previews the error state. In code, the state of the RadioGroup sets it on every option.";
            };
        };
    };
    readonly summary: "One option of a RadioGroup, with a label and hint.";
    readonly options: {};
    readonly labels: readonly [];
    readonly parts: readonly ["base", "label", "control", "input", "label-text", "hint", "hint-text"];
    readonly slots: readonly [];
    readonly events: readonly [];
    readonly stories: readonly ["Playground", "WithHint", "Disabled"];
    readonly exceptions: readonly [{
        readonly items: readonly ["checked", "name", "required", "state"];
        readonly reason: "An option belongs to a RadioGroup, which holds the chosen value, the form entry, the validation and the state. Outside a group, an option has no state and submits nothing.";
    }];
};
export interface RadioFieldProps extends ChoiceControlProps {
    value: string;
}
