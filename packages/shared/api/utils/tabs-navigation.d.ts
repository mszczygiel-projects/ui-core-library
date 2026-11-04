import type { TextDirection } from './radio-navigation.ts';
export type TabsAxis = 'horizontal' | 'vertical';
export declare function nextTab(key: string, current: number, enabled: readonly boolean[], axis: TabsAxis, direction: TextDirection): number | undefined;
export interface TabsEntry {
    readonly value: string;
    readonly disabled: boolean;
}
export declare function selectedTabValue(value: string | undefined, tabs: readonly TabsEntry[]): string | undefined;
