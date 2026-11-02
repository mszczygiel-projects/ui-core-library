import type { ListboxGroup, ListboxItems, ListboxOption, ListboxValue } from '../components/listbox.ts';
export declare function isGrouped<Icon>(items: ListboxItems<Icon> | undefined): items is readonly ListboxGroup<Icon>[];
export declare function flattenOptions<Icon>(items: ListboxItems<Icon> | undefined): readonly ListboxOption<Icon>[];
export declare function filterItems<Icon>(items: ListboxItems<Icon> | undefined, query: string): ListboxItems<Icon>;
export declare function hasExactLabel(items: ListboxItems<unknown> | undefined, query: string): boolean;
export declare function valuesOf(value: ListboxValue | undefined): readonly string[];
export declare function normalizeValue(value: ListboxValue | undefined, multiple: boolean): ListboxValue;
export declare function isChosen(value: ListboxValue | undefined, optionValue: string): boolean;
export declare function toggleValue(values: readonly string[], optionValue: string): readonly string[];
export declare function indexOfValue(options: readonly ListboxOption<unknown>[], value: string): number;
export declare function firstEnabled(options: readonly ListboxOption<unknown>[]): number | undefined;
export declare function lastEnabled(options: readonly ListboxOption<unknown>[]): number | undefined;
export declare function moveHighlight(options: readonly ListboxOption<unknown>[], current: number, key: string, pageSize?: number): number | undefined;
export declare const TYPEAHEAD_TIMEOUT = 500;
export interface TypeaheadState {
    readonly query: string;
    readonly time: number;
}
export declare const EMPTY_TYPEAHEAD: TypeaheadState;
export declare function typeahead(state: TypeaheadState, key: string, now: number, options: readonly ListboxOption<unknown>[], current: number): {
    readonly state: TypeaheadState;
    readonly index: number;
} | undefined;
