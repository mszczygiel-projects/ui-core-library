export type ComponentCategory = 'Actions' | 'Inputs' | 'Selection' | 'Feedback' | 'Navigation' | 'Overlays';
export type ComponentStatus = 'planned' | 'in-progress' | 'done';
export interface OptionsSpec<Option extends string = string> {
    readonly options: readonly Option[];
    readonly default: Option;
}
export interface ExceptionSpec {
    readonly items: readonly string[];
    readonly reason: string;
}
export interface ComponentSpec {
    readonly name: string;
    readonly tag: `ui-${string}`;
    readonly category: ComponentCategory;
    readonly status: ComponentStatus;
    readonly figma: string | null;
    readonly summary: string;
    readonly options: Readonly<Record<string, OptionsSpec>>;
    readonly labels: readonly string[];
    readonly parts: readonly string[];
    readonly slots: readonly string[];
    readonly events: readonly string[];
    readonly stories: readonly string[];
    readonly exceptions: readonly ExceptionSpec[];
}
export declare function defineComponent<const Spec extends ComponentSpec>(spec: Spec): Spec;
export type OptionOf<Spec extends ComponentSpec, Prop extends keyof Spec['options']> = Spec['options'][Prop]['options'][number];
