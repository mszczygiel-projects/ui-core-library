import { type OptionOf } from './component.ts';
export declare const loader: {
    readonly name: "Loader";
    readonly tag: "ui-loader";
    readonly category: "Feedback";
    readonly status: "done";
    readonly figma: "103:773";
    readonly summary: "Shows that content is loading or that an action is in progress.";
    readonly options: {
        readonly size: {
            readonly options: readonly ["small", "medium", "large"];
            readonly default: "medium";
        };
    };
    readonly labels: readonly ["label"];
    readonly parts: readonly ["indicator"];
    readonly slots: readonly [];
    readonly events: readonly [];
    readonly stories: readonly ["Playground", "OnSurfaces"];
    readonly exceptions: readonly [];
};
export type LoaderSize = OptionOf<typeof loader, 'size'>;
export interface LoaderProps {
    size?: LoaderSize;
    label?: string;
}
