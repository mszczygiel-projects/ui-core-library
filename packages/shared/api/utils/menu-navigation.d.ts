import type { MenuItem } from '../components/menu.ts';
export type MenuKeyAction = {
    readonly kind: 'highlight';
    readonly index: number;
} | {
    readonly kind: 'activate';
} | {
    readonly kind: 'close';
};
export declare function openingIndex(items: readonly MenuItem<unknown>[], key: string): number | undefined;
export declare function menuKeyAction(items: readonly MenuItem<unknown>[], current: number, key: string): MenuKeyAction | undefined;
