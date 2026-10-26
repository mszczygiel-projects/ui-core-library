export type PageItem = number | 'ellipsis';
export interface PaginateOptions {
    readonly siblings?: number;
}
export declare function paginate(page: number, pageCount: number, options?: PaginateOptions): PageItem[];
