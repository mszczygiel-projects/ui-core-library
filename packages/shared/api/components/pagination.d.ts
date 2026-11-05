export declare const pagination: {
    readonly name: "Pagination";
    readonly tag: "ui-pagination";
    readonly category: "Navigation";
    readonly status: "done";
    readonly figma: "2157:126";
    readonly design: {
        readonly flags: readonly ["disabled"];
        readonly booleans: readonly ["showStatus", "showJump"];
        readonly codeOnly: readonly ["page", "pageCount", "siblingCount", "boundaryCount", "getPageHref", "label", "previousLabel", "nextLabel", "jumpLabel", "getPageLabel", "getStatusLabel", "getTotalLabel"];
        readonly previews: {
            readonly layout: {
                readonly options: readonly ["wide", "narrow"];
                readonly default: "wide";
                readonly note: "Previews a container at least breakpoint/sm wide, or a narrower one. In a narrow one the pages give way to the status, or to the jump field when it is shown, between the previous and next buttons. Code follows the width of the container.";
            };
        };
    };
    readonly summary: "Buttons or links that move between the pages of a long list.";
    readonly options: {};
    readonly labels: readonly ["label", "previous", "next", "page", "status", "jump", "total"];
    readonly parts: readonly ["base", "list", "item", "page", "ellipsis", "previous", "next", "status", "jump", "jump-label", "jump-field", "jump-total"];
    readonly slots: readonly [];
    readonly events: readonly ["ui-page-change"];
    readonly stories: readonly ["Playground", "OnSurfaces"];
    readonly exceptions: readonly [{
        readonly items: readonly ["size"];
        readonly reason: "The page buttons have the one size of a hit area, so the control has no size prop.";
    }, {
        readonly items: readonly ["page", "defaultPage"];
        readonly reason: "The current page is a number from 1, not a string. React pairs page with defaultPage and onPageChange. The web component takes its first page from the page attribute and holds the current one in the page property.";
    }, {
        readonly items: readonly ["ui-page-change"];
        readonly reason: "The change is cancelable in the web component, and React passes the native event, so that a page with client-side routing can keep a link from loading a new page.";
    }];
};
export type PaginationChangeReason = 'page' | 'previous' | 'next' | 'jump';
export interface PaginationPageChangeDetails<OriginalEvent> {
    readonly reason: PaginationChangeReason;
    readonly href?: string;
    readonly originalEvent: OriginalEvent;
}
export interface PaginationPageChangeDetail<OriginalEvent> extends PaginationPageChangeDetails<OriginalEvent> {
    readonly page: number;
}
export interface PaginationProps {
    pageCount?: number;
    siblingCount?: number;
    boundaryCount?: number;
    disabled?: boolean;
    showStatus?: boolean;
    showJump?: boolean;
    getPageHref?: (page: number) => string;
    label?: string;
    previousLabel?: string;
    nextLabel?: string;
    jumpLabel?: string;
    getPageLabel?: (page: number) => string;
    getStatusLabel?: (page: number, pageCount: number) => string;
    getTotalLabel?: (pageCount: number) => string;
}
