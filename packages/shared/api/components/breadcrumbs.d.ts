import { type OptionOf } from './component.ts';
export declare const breadcrumbs: {
    readonly name: "Breadcrumbs";
    readonly tag: "ui-breadcrumbs";
    readonly category: "Navigation";
    readonly status: "done";
    readonly figma: "2334:2878";
    readonly design: {
        readonly flags: readonly [];
        readonly booleans: readonly [];
        readonly codeOnly: readonly ["items", "label"];
        readonly previews: {
            readonly collapsed: {
                readonly options: readonly ["false", "true"];
                readonly default: "false";
                readonly note: "Previews a container narrower than breakpoint/sm, where the items before the last two hide behind an ellipsis. Code collapses from the width of the container.";
            };
        };
    };
    readonly summary: "A trail of links from the top of a site down to the current page.";
    readonly options: {
        readonly size: {
            readonly options: readonly ["small", "medium"];
            readonly default: "medium";
        };
        readonly separator: {
            readonly options: readonly ["chevron", "slash"];
            readonly default: "chevron";
        };
    };
    readonly labels: readonly ["label"];
    readonly parts: readonly ["base", "list", "item", "link", "text", "current", "item-icon", "item-label", "separator", "ellipsis"];
    readonly slots: readonly [];
    readonly events: readonly ["ui-navigate"];
    readonly stories: readonly ["Playground", "Collapsed", "OnSurfaces"];
    readonly exceptions: readonly [{
        readonly items: readonly ["size"];
        readonly reason: "A trail sits in running text or a page header, so it has the small and medium sizes of body text and no large one.";
    }, {
        readonly items: readonly ["items"];
        readonly reason: "The trail is data, like the options of a list, so that its last item is always the current page. The icon of an item is an SVG string of the icon package in the web component and a React node in React, since data cannot carry a slot.";
    }];
};
export type BreadcrumbsSize = OptionOf<typeof breadcrumbs, 'size'>;
export type BreadcrumbsSeparator = OptionOf<typeof breadcrumbs, 'separator'>;
export interface BreadcrumbsItem<Icon = never> {
    readonly label: string;
    readonly href?: string;
    readonly icon?: Icon;
    readonly iconOnly?: boolean;
}
export interface BreadcrumbsNavigateDetails<OriginalEvent, Icon = never> {
    readonly item: BreadcrumbsItem<Icon>;
    readonly index: number;
    readonly originalEvent: OriginalEvent;
}
export type BreadcrumbsNavigateDetail<OriginalEvent, Icon = never> = BreadcrumbsNavigateDetails<OriginalEvent, Icon>;
export interface BreadcrumbsProps<Icon = unknown> {
    items?: readonly BreadcrumbsItem<Icon>[];
    label?: string;
    size?: BreadcrumbsSize;
    separator?: BreadcrumbsSeparator;
}
