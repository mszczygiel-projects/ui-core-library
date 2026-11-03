import { type OptionOf } from './component.ts';
export declare const popupPlacements: readonly ["bottom", "top", "start", "end"];
export declare const popover: {
    readonly name: "Popover";
    readonly tag: "ui-popover";
    readonly category: "Overlays";
    readonly status: "in-progress";
    readonly figma: "2090:2086";
    readonly design: {
        readonly flags: readonly ["open", "showArrow"];
        readonly booleans: readonly [];
        readonly codeOnly: readonly ["placement", "label"];
        readonly previews: {};
    };
    readonly summary: "A panel that a button opens beside it, over the page, with content that the page around it can still be used with.";
    readonly options: {
        readonly placement: {
            readonly options: readonly ["bottom", "top", "start", "end"];
            readonly default: "bottom";
        };
    };
    readonly labels: readonly [];
    readonly parts: readonly ["base", "panel", "arrow"];
    readonly slots: readonly ["trigger"];
    readonly events: readonly ["ui-open-change"];
    readonly stories: readonly ["Playground", "Placements", "WithForm", "OnSurfaces"];
    readonly exceptions: readonly [{
        readonly items: readonly ["placement"];
        readonly reason: "A popup beside its trigger also opens above it, so placement adds top to the edges of the vocabulary. start and end follow the direction of the text.";
    }, {
        readonly items: readonly ["defaultOpen"];
        readonly reason: "React uses defaultOpen for an uncontrolled initial state. The web component uses its open attribute for that, and its property for the current state.";
    }, {
        readonly items: readonly ["ui-open-change"];
        readonly reason: "The web component dispatches the event before it opens or closes, and an author may cancel it, for example to keep a form with unsaved changes open. React keeps a controlled popover as it is instead.";
    }, {
        readonly items: readonly ["trigger"];
        readonly reason: "The popover writes aria-expanded and aria-haspopup on the element of its trigger slot, which the page gives it, so that the button announces the panel it opens.";
    }];
};
export type PopupPlacement = (typeof popupPlacements)[number];
export type PopoverPlacement = OptionOf<typeof popover, 'placement'>;
export type PopoverOpenChangeReason = 'trigger' | 'escape' | 'outside' | 'focus-out';
export interface PopoverOpenChangeDetails<OriginalEvent> {
    readonly reason: PopoverOpenChangeReason;
    readonly originalEvent: OriginalEvent;
}
export interface PopoverOpenChangeDetail<OriginalEvent> extends PopoverOpenChangeDetails<OriginalEvent> {
    readonly value: boolean;
}
export interface PopoverProps {
    open?: boolean;
    placement?: PopoverPlacement;
    showArrow?: boolean;
    label?: string;
}
