import { type OptionOf } from './component.ts';
export declare const chip: {
    readonly name: "Chip";
    readonly tag: "ui-chip";
    readonly category: "Selection";
    readonly status: "done";
    readonly figma: "2068:2859";
    readonly design: {
        readonly flags: readonly ["selected", "disabled"];
        readonly booleans: readonly ["dismissible"];
        readonly codeOnly: readonly ["selectable", "skipDismissInTabOrder"];
        readonly previews: {
            readonly interaction: {
                readonly options: readonly ["rest", "active", "focus"];
                readonly default: "rest";
                readonly note: "Previews hover and press (active) and keyboard focus. Leave it at rest in a design.";
            };
        };
    };
    readonly summary: "A compact choice that a user turns on and off, or a chosen value that a user removes.";
    readonly options: {
        readonly variant: {
            readonly options: readonly ["outline", "subtle"];
            readonly default: "outline";
        };
        readonly size: {
            readonly options: readonly ["small", "medium"];
            readonly default: "medium";
        };
    };
    readonly labels: readonly ["dismiss"];
    readonly parts: readonly ["base", "control", "icon", "label", "dismiss"];
    readonly slots: readonly ["icon"];
    readonly events: readonly ["ui-selected-change", "ui-dismiss"];
    readonly stories: readonly ["Playground", "Variants", "Selectable", "Dismissible", "OnSurfaces"];
    readonly exceptions: readonly [{
        readonly items: readonly ["form", "validity", "validationMessage", "willValidate"];
        readonly reason: "The web component is form-associated only to follow a disabled fieldset, as the native buttons of React do. It submits nothing and exposes no form API.";
    }, {
        readonly items: readonly ["defaultSelected"];
        readonly reason: "React uses defaultSelected for an uncontrolled initial state. The web component uses its selected attribute for that, and its property for the current state, as a native checkbox does with checked.";
    }];
};
export type ChipVariant = OptionOf<typeof chip, 'variant'>;
export type ChipSize = OptionOf<typeof chip, 'size'>;
export interface ChipSelectedChangeDetails<OriginalEvent> {
    readonly originalEvent: OriginalEvent;
}
export interface ChipSelectedChangeDetail<OriginalEvent> extends ChipSelectedChangeDetails<OriginalEvent> {
    readonly value: boolean;
}
export interface ChipDismissDetail<OriginalEvent> {
    readonly originalEvent: OriginalEvent;
}
export interface ChipProps {
    variant?: ChipVariant;
    size?: ChipSize;
    selectable?: boolean;
    selected?: boolean;
    disabled?: boolean;
    dismissible?: boolean;
    dismissLabel?: string;
    skipDismissInTabOrder?: boolean;
}
