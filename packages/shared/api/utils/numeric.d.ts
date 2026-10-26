export declare function roundTo(value: number, decimals: number): number;
export declare function clamp(value: number, min: number, max: number): number;
export interface StepOptions {
    readonly step: number;
    readonly min?: number;
    readonly max?: number;
    readonly decimals?: number;
}
export declare function stepValue(value: number | null, direction: 1 | -1, options: StepOptions): number;
