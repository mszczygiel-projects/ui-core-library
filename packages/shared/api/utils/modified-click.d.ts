export interface ClickModifiers {
    readonly metaKey: boolean;
    readonly ctrlKey: boolean;
    readonly shiftKey: boolean;
    readonly altKey: boolean;
}
export declare function isModifiedClick({ metaKey, ctrlKey, shiftKey, altKey }: ClickModifiers): boolean;
