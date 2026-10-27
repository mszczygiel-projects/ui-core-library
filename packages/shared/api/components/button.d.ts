import { type OptionOf } from './component.ts';
export declare const button: {
    readonly name: "Button";
    readonly tag: "ui-button";
    readonly category: "Actions";
    readonly status: "done";
    readonly figma: "179:100";
    readonly design: {
        readonly flags: readonly ["disabled", "loading"];
        readonly booleans: readonly [];
        readonly codeOnly: readonly ["type"];
        readonly previews: {
            readonly interaction: {
                readonly options: readonly ["rest", "active", "focus"];
                readonly default: "rest";
                readonly note: "Previews hover and press (active) and keyboard focus. Leave it at rest in a design.";
            };
        };
    };
    readonly summary: "Triggers an action, with optional icons and a loading state.";
    readonly options: {
        readonly variant: {
            readonly options: readonly ["primary", "secondary", "outline", "ghost", "danger"];
            readonly default: "primary";
        };
        readonly size: {
            readonly options: readonly ["small", "medium", "large"];
            readonly default: "medium";
        };
        readonly type: {
            readonly options: readonly ["button", "submit", "reset"];
            readonly default: "button";
        };
    };
    readonly labels: readonly ["loading"];
    readonly parts: readonly ["base", "wrapper", "content", "leading-icon", "label", "trailing-icon", "loader"];
    readonly slots: readonly ["leading-icon", "trailing-icon"];
    readonly events: readonly [];
    readonly stories: readonly ["Playground", "Variants", "WithIcons", "OnSurfaces"];
    readonly exceptions: readonly [{
        readonly items: readonly ["form", "validity", "validationMessage", "willValidate"];
        readonly reason: "The web component exposes its form-associated state as read-only properties. React exposes the native state through its ref, and its form prop is the native form ID attribute.";
    }];
};
export type ButtonVariant = OptionOf<typeof button, 'variant'>;
export type ButtonSize = OptionOf<typeof button, 'size'>;
export type ButtonType = OptionOf<typeof button, 'type'>;
export interface ButtonProps {
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    loading?: boolean;
    type?: ButtonType;
    name?: string;
    value?: string;
    label?: string;
    loadingLabel?: string;
}
