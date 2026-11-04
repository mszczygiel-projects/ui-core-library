export interface BreadcrumbListItem {
    readonly label: string;
    readonly href?: string;
}
export interface BreadcrumbListOptions {
    readonly resolveUrl: (href: string) => string;
}
export declare function breadcrumbListJsonLd(items: readonly BreadcrumbListItem[], options: BreadcrumbListOptions): string;
