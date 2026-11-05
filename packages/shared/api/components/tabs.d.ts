import { type OptionOf } from './component.ts';
export declare const tabs: {
    readonly name: "Tabs";
    readonly tag: "ui-tabs";
    readonly category: "Content";
    readonly status: "done";
    readonly figma: "3226:82";
    readonly design: {
        readonly flags: readonly [];
        readonly booleans: readonly [];
        readonly codeOnly: readonly ["value", "label"];
        readonly previews: {};
    };
    readonly summary: "A list of tabs, each of which shows its own panel of content in place of the others.";
    readonly options: {
        readonly variant: {
            readonly options: readonly ["underline", "segmented"];
            readonly default: "underline";
        };
        readonly orientation: {
            readonly options: readonly ["horizontal", "vertical"];
            readonly default: "horizontal";
        };
    };
    readonly labels: readonly [];
    readonly parts: readonly ["base", "list", "tab", "tab-icon", "tab-label", "panel"];
    readonly slots: readonly [];
    readonly events: readonly ["ui-value-change"];
    readonly stories: readonly ["Playground", "Segmented", "Vertical", "WithIcons", "WithDisabledTab", "Overflow", "OnSurfaces"];
    readonly exceptions: readonly [{
        readonly items: readonly ["orientation"];
        readonly reason: "Tabs are a row above their content in most pages, so the default orientation is horizontal, unlike the groups of options, which stack.";
    }, {
        readonly items: readonly ["defaultValue"];
        readonly reason: "React uses defaultValue for an uncontrolled initial tab. The web component uses its value attribute for that, and its property for the current tab.";
    }, {
        readonly items: readonly ["ui-value-change"];
        readonly reason: "The arrow keys select the tab they move to, as the pattern of WAI-ARIA recommends when the panels are already in the page. Find in page and a link to a text fragment select the tab of a match with the reason find, since the browser has already revealed it. The event cannot be canceled: a controlled React parent keeps the tab by not changing value.";
    }, {
        readonly items: readonly ["tab", "tab-icon", "tab-label", "panel"];
        readonly reason: "Tabs renders the tab of each Tab and the panel around its content, so that the tabs, the list and the panels that name one another are in one tree. Their parts belong to Tabs.";
    }];
};
export type TabsVariant = OptionOf<typeof tabs, 'variant'>;
export type TabsOrientation = OptionOf<typeof tabs, 'orientation'>;
export type TabsValueChangeReason = 'trigger' | 'find';
export interface TabsValueChangeDetails<OriginalEvent> {
    readonly reason: TabsValueChangeReason;
    readonly originalEvent: OriginalEvent;
}
export interface TabsValueChangeDetail<OriginalEvent> extends TabsValueChangeDetails<OriginalEvent> {
    readonly value: string;
}
export interface TabsProps {
    value?: string;
    variant?: TabsVariant;
    orientation?: TabsOrientation;
    label?: string;
}
