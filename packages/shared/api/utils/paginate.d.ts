export type PageItem = number | 'ellipsis';
export interface PaginateOptions {
    readonly siblings?: number;
    readonly boundaries?: number;
}
export declare function pageBounds(page: number, pageCount: number): {
    page: number;
    pageCount: number;
};
export declare function paginate(page: number, pageCount: number, options?: PaginateOptions): PageItem[];
