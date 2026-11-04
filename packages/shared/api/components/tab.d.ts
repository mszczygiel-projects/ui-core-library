export declare const tab: {
    readonly name: "Tab";
    readonly tag: "ui-tab";
    readonly category: "Content";
    readonly status: "in-progress";
    readonly figma: "3225:158";
    readonly design: {
        readonly flags: readonly ["disabled"];
        readonly booleans: readonly [];
        readonly codeOnly: readonly ["value"];
        readonly previews: {
            readonly variant: {
                readonly note: "Follows the variant of the Tabs that holds the tab.";
                readonly options: readonly ["underline", "segmented"];
                readonly default: "underline";
            };
            readonly orientation: {
                readonly note: "Follows the orientation of the Tabs that holds the tab.";
                readonly options: readonly ["horizontal", "vertical"];
                readonly default: "horizontal";
            };
            readonly selected: {
                readonly options: readonly ["false", "true"];
                readonly default: "false";
                readonly note: "Previews the selected tab, which the value of Tabs chooses in code.";
            };
            readonly hasIcon: {
                readonly options: readonly ["false", "true"];
                readonly default: "false";
                readonly note: "Shows the icon, which code shows when icon is set. Choose it with the icon property.";
            };
            readonly interaction: {
                readonly options: readonly ["rest", "active", "focus"];
                readonly default: "rest";
                readonly note: "Previews hover and press (active) and keyboard focus of the tab. Leave it at rest in a design.";
            };
        };
    };
    readonly summary: "One tab of Tabs: its label, an optional icon, and the content of its panel.";
    readonly options: {};
    readonly labels: readonly [];
    readonly parts: readonly [];
    readonly slots: readonly [];
    readonly events: readonly [];
    readonly stories: readonly ["Playground", "OnSurfaces"];
    readonly exceptions: readonly [{
        readonly items: readonly ["parts"];
        readonly reason: "Tab only holds the content of its panel. Tabs renders its tab and its panel, so the parts belong to Tabs.";
    }, {
        readonly items: readonly ["icon"];
        readonly reason: "The icon is an SVG string of the icon package in the web component and a React node in React, since Tabs renders it in its own list and a slot of a Tab cannot reach there.";
    }];
};
export interface TabProps<Icon = unknown> {
    value: string;
    label: string;
    icon?: Icon;
    disabled?: boolean;
}
