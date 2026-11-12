import { type OptionOf } from './component.ts';
export declare const badge: {
    readonly name: "Badge";
    readonly tag: "ui-badge";
    readonly category: "Feedback";
    readonly status: "done";
    readonly figma: "2037:98";
    readonly design: {
        readonly flags: readonly [];
        readonly booleans: readonly [];
        readonly codeOnly: readonly [];
        readonly previews: {
            readonly content: {
                readonly options: readonly ["label", "icon"];
                readonly default: "label";
                readonly note: "Chooses the layout of a badge with text, or with only the leading content, such as an icon. Code derives it from the content.";
            };
        };
    };
    readonly summary: "Marks a status, a category or a count with a short label and any content before or after it.";
    readonly options: {
        readonly tone: {
            readonly options: readonly ["neutral", "brand", "info", "success", "warning", "error"];
            readonly default: "neutral";
        };
        readonly variant: {
            readonly options: readonly ["solid", "subtle"];
            readonly default: "solid";
        };
        readonly size: {
            readonly options: readonly ["small", "medium"];
            readonly default: "medium";
        };
        readonly shape: {
            readonly options: readonly ["rounded", "square"];
            readonly default: "rounded";
        };
    };
    readonly labels: readonly [];
    readonly parts: readonly ["base", "leading", "label", "trailing"];
    readonly slots: readonly ["leading", "trailing"];
    readonly events: readonly [];
    readonly stories: readonly ["Playground", "Variants", "Shapes", "WithIcon", "StatusDot", "OnSurfaces"];
    readonly exceptions: readonly [];
};
export type BadgeTone = OptionOf<typeof badge, 'tone'>;
export type BadgeVariant = OptionOf<typeof badge, 'variant'>;
export type BadgeSize = OptionOf<typeof badge, 'size'>;
export type BadgeShape = OptionOf<typeof badge, 'shape'>;
export interface BadgeProps {
    tone?: BadgeTone;
    variant?: BadgeVariant;
    size?: BadgeSize;
    shape?: BadgeShape;
    label?: string;
}
