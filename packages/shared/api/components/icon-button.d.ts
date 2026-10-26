import { type OptionOf } from './component.ts';
export declare const iconButton: {
    readonly name: "IconButton";
    readonly tag: "ui-icon-button";
    readonly category: "Actions";
    readonly status: "done";
    readonly figma: "182:1049";
    readonly design: {
        readonly flags: readonly ["disabled", "loading"];
        readonly codeOnly: readonly ["type"];
        readonly previews: {
            readonly interaction: {
                readonly options: readonly ["rest", "active", "focus"];
                readonly default: "rest";
                readonly note: "Previews hover and press (active) and keyboard focus. Leave it at rest in a design.";
            };
        };
    };
    readonly summary: "Triggers an action named only by an icon, as a square of the height of a button.";
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
    readonly parts: readonly ["base", "icon", "loader"];
    readonly slots: readonly ["icon"];
    readonly events: readonly [];
    readonly stories: readonly ["Playground", "Variants", "OnSurfaces"];
    readonly exceptions: readonly [{
        readonly items: readonly ["form", "validity", "validationMessage", "willValidate"];
        readonly reason: "The web component exposes its form-associated state as read-only properties. React exposes the native state through its ref, and its form prop is the native form ID attribute.";
    }];
};
export type IconButtonVariant = OptionOf<typeof iconButton, 'variant'>;
export type IconButtonSize = OptionOf<typeof iconButton, 'size'>;
export type IconButtonType = OptionOf<typeof iconButton, 'type'>;
export interface IconButtonProps {
    label: string;
    variant?: IconButtonVariant;
    size?: IconButtonSize;
    disabled?: boolean;
    loading?: boolean;
    type?: IconButtonType;
    name?: string;
    value?: string;
    loadingLabel?: string;
}
