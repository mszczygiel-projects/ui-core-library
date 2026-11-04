import { type OptionOf } from './component.ts';
import { type ListboxOption } from './listbox.ts';
export declare const menuAlignments: readonly ["start", "end"];
export declare const menu: {
    readonly name: "Menu";
    readonly tag: "ui-menu";
    readonly category: "Overlays";
    readonly status: "in-progress";
    readonly figma: "3202:130";
    readonly design: {
        readonly flags: readonly [];
        readonly booleans: readonly [];
        readonly codeOnly: readonly ["open", "placement", "align", "label", "options"];
        readonly previews: {};
    };
    readonly summary: "A list of actions that a button opens beside it, in groups separated by a rule, for a user to pick one.";
    readonly options: {
        readonly size: {
            readonly options: readonly ["small", "medium", "large"];
            readonly default: "medium";
        };
        readonly placement: {
            readonly options: readonly ["bottom", "top", "start", "end"];
            readonly default: "bottom";
        };
        readonly align: {
            readonly options: readonly ["start", "end"];
            readonly default: "start";
        };
    };
    readonly labels: readonly [];
    readonly parts: readonly ["base", "menu", "group", "separator", "item", "item-icon", "item-label"];
    readonly slots: readonly ["trigger"];
    readonly events: readonly ["ui-action", "ui-open-change"];
    readonly stories: readonly ["Playground", "Groups", "Placements", "OnSurfaces"];
    readonly exceptions: readonly [{
        readonly items: readonly ["placement"];
        readonly reason: "A popup beside its trigger also opens above it, so placement adds top to the edges of the vocabulary. start and end follow the direction of the text.";
    }, {
        readonly items: readonly ["align"];
        readonly reason: "A menu lines up with an edge of its trigger instead of centring on it, so that a menu at the end of a row stays under the button that opened it.";
    }, {
        readonly items: readonly ["defaultOpen"];
        readonly reason: "React uses defaultOpen for an uncontrolled initial state. The web component uses its open attribute for that, and its property for the current state.";
    }, {
        readonly items: readonly ["ui-open-change"];
        readonly reason: "The web component dispatches the event before it opens or closes, and an author may cancel it. React keeps a controlled menu as it is instead.";
    }, {
        readonly items: readonly ["trigger"];
        readonly reason: "The menu writes aria-expanded and aria-haspopup on the element of its trigger slot, which the page gives it, so that the button announces the menu it opens.";
    }, {
        readonly items: readonly ["icon"];
        readonly reason: "The icon of an item is an SVG string of the icon package in the web component and a React node in React, since data cannot carry a slot.";
    }];
};
export type MenuSize = OptionOf<typeof menu, 'size'>;
export type MenuPlacement = OptionOf<typeof menu, 'placement'>;
export type MenuAlign = OptionOf<typeof menu, 'align'>;
export type MenuItem<Icon = never> = ListboxOption<Icon>;
export interface MenuGroup<Icon = never> {
    readonly options: readonly MenuItem<Icon>[];
}
export type MenuItems<Icon = never> = readonly MenuItem<Icon>[] | readonly MenuGroup<Icon>[];
export type MenuOpenChangeReason = 'trigger' | 'escape' | 'outside' | 'focus-out' | 'action';
export interface MenuOpenChangeDetails<OriginalEvent> {
    readonly reason: MenuOpenChangeReason;
    readonly originalEvent: OriginalEvent;
}
export interface MenuOpenChangeDetail<OriginalEvent> extends MenuOpenChangeDetails<OriginalEvent> {
    readonly value: boolean;
}
export interface MenuActionDetails<OriginalEvent> {
    readonly originalEvent: OriginalEvent;
}
export interface MenuActionDetail<OriginalEvent> extends MenuActionDetails<OriginalEvent> {
    readonly value: string;
}
export interface MenuProps<Icon = unknown> {
    open?: boolean;
    options?: MenuItems<Icon>;
    size?: MenuSize;
    placement?: MenuPlacement;
    align?: MenuAlign;
    label?: string;
}
