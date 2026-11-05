import { type OptionOf } from './component.ts';
export declare const tooltip: {
    readonly name: "Tooltip";
    readonly tag: "ui-tooltip";
    readonly category: "Overlays";
    readonly status: "done";
    readonly figma: "3168:47";
    readonly design: {
        readonly flags: readonly ["showArrow"];
        readonly booleans: readonly [];
        readonly codeOnly: readonly ["placement"];
        readonly previews: {};
    };
    readonly summary: "A short text that names or describes an element while the pointer rests on it or the keyboard focuses it.";
    readonly options: {
        readonly placement: {
            readonly options: readonly ["bottom", "top", "start", "end"];
            readonly default: "top";
        };
    };
    readonly labels: readonly [];
    readonly parts: readonly ["base", "bubble", "arrow"];
    readonly slots: readonly [];
    readonly events: readonly [];
    readonly stories: readonly ["Playground", "Placements", "OnSurfaces"];
    readonly exceptions: readonly [{
        readonly items: readonly ["placement"];
        readonly reason: "A tooltip opens above its trigger by default, and placement adds top to the edges of the vocabulary. start and end follow the direction of the text.";
    }, {
        readonly items: readonly ["content"];
        readonly reason: "The text of a tooltip is plain text, so it is a prop. Content with links or buttons belongs in a Popover, which a user can reach.";
    }, {
        readonly items: readonly ["ariaDescribedByElements"];
        readonly reason: "The web component writes its text into an element of its own light DOM, slotted into the bubble, and gives it to ariaDescribedByElements of its trigger, since an element reference cannot reach into its shadow root. It writes nothing else on the trigger or the host.";
    }];
};
export type TooltipPlacement = OptionOf<typeof tooltip, 'placement'>;
export interface TooltipProps {
    content?: string;
    placement?: TooltipPlacement;
    showArrow?: boolean;
}
