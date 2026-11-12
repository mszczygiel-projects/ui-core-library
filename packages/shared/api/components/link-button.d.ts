import { type OptionOf } from './component.ts';
export declare const linkButton: {
    readonly name: "LinkButton";
    readonly tag: "ui-link-button";
    readonly category: "Actions";
    readonly status: "done";
    readonly figma: null;
    readonly design: {
        readonly flags: readonly [];
        readonly booleans: readonly [];
        readonly codeOnly: readonly [];
        readonly previews: {};
    };
    readonly summary: "Navigates to another page or resource while looking like a button.";
    readonly options: {
        readonly variant: {
            readonly options: readonly ["primary", "secondary", "outline", "ghost", "danger"];
            readonly default: "primary";
        };
        readonly size: {
            readonly options: readonly ["small", "medium", "large"];
            readonly default: "medium";
        };
        readonly shape: {
            readonly options: readonly ["square", "rounded"];
            readonly default: "square";
        };
    };
    readonly labels: readonly [];
    readonly parts: readonly ["base", "content", "leading-icon", "label", "trailing-icon"];
    readonly slots: readonly ["leading-icon", "trailing-icon"];
    readonly events: readonly [];
    readonly stories: readonly ["Playground", "Variants", "Shapes", "WithIcons", "OnSurfaces"];
    readonly exceptions: readonly [{
        readonly items: readonly ["render"];
        readonly reason: "React applications navigate with the link component of their router, which the React prop renders. A web component cannot render another framework, and an application intercepts the native link instead.";
    }];
};
export type LinkButtonVariant = OptionOf<typeof linkButton, 'variant'>;
export type LinkButtonSize = OptionOf<typeof linkButton, 'size'>;
export type LinkButtonShape = OptionOf<typeof linkButton, 'shape'>;
export interface LinkButtonProps {
    href: string;
    target?: string;
    rel?: string;
    download?: string;
    variant?: LinkButtonVariant;
    size?: LinkButtonSize;
    shape?: LinkButtonShape;
    disabled?: boolean;
    label?: string;
}
