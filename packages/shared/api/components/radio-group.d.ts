import { type ChoiceControlProps, type ChoiceState } from './checkbox-field.ts';
import { type OptionOf } from './component.ts';
export declare const radioGroup: {
    readonly name: "RadioGroup";
    readonly tag: "ui-radio-group";
    readonly category: "Selection";
    readonly status: "done";
    readonly figma: "2997:163";
    readonly design: {
        readonly flags: readonly ["disabled"];
        readonly booleans: readonly [];
        readonly codeOnly: readonly [];
        readonly previews: {};
    };
    readonly summary: "A set of radio options from which a user chooses exactly one value.";
    readonly options: {
        readonly orientation: {
            readonly options: readonly ["vertical", "horizontal"];
            readonly default: "vertical";
        };
        readonly state: {
            readonly options: readonly ["default", "error"];
            readonly default: "default";
        };
    };
    readonly labels: readonly [];
    readonly parts: readonly ["base", "label", "label-text", "options", "hint", "hint-text"];
    readonly slots: readonly [];
    readonly events: readonly ["ui-value-change"];
    readonly stories: readonly ["Playground", "Horizontal", "InForm", "WithDisabledOption", "OnSurfaces"];
    readonly exceptions: readonly [{
        readonly items: readonly ["state"];
        readonly reason: "A choice has no success state: a chosen option already confirms the choice. The state of the choice controls is default or error.";
    }, {
        readonly items: readonly ["form", "validity", "validationMessage", "willValidate"];
        readonly reason: "The web component exposes its form-associated state. React renders native radio buttons that share a name, so the browser validates and submits them.";
    }, {
        readonly items: readonly ["defaultValue"];
        readonly reason: "React uses defaultValue for an uncontrolled initial and reset value. The web component uses its value attribute for that, and its property for the current value.";
    }];
};
export type RadioGroupOrientation = OptionOf<typeof radioGroup, 'orientation'>;
export interface RadioGroupValueChangeDetails<OriginalEvent> {
    readonly originalEvent: OriginalEvent;
}
export interface RadioGroupValueChangeDetail<OriginalEvent> extends RadioGroupValueChangeDetails<OriginalEvent> {
    readonly value: string;
}
export interface RadioGroupProps extends ChoiceControlProps {
    orientation?: RadioGroupOrientation;
    value?: string;
    name?: string;
    required?: boolean;
    state?: ChoiceState;
}
