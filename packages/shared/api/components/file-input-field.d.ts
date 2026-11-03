import type { FileLike, FileRejection } from '../utils/file-selection.ts';
import { type OptionOf } from './component.ts';
import { type FieldBaseProps } from './text-field.ts';
export declare const fileInputField: {
    readonly name: "FileInputField";
    readonly tag: "ui-file-input-field";
    readonly category: "Inputs";
    readonly status: "in-progress";
    readonly figma: "2409:3222";
    readonly design: {
        readonly flags: readonly ["disabled"];
        readonly booleans: readonly [];
        readonly codeOnly: readonly ["name", "required", "accept", "multiple", "maxSize", "maxFiles", "locale", "replaceLabel", "getRemoveLabel"];
        readonly previews: {
            readonly interaction: {
                readonly options: readonly ["rest", "active", "focus", "dragover"];
                readonly default: "rest";
                readonly note: "Previews hover and press (active), keyboard focus and files dragged over the zone (dragover). Leave it at rest in a design.";
            };
            readonly valueState: {
                readonly options: readonly ["empty", "preview", "list"];
                readonly default: "empty";
                readonly note: "Chooses the layout of the value: no file, the preview of one image without multiple, or a list of files below the zone.";
            };
        };
    };
    readonly summary: "A field that takes files from a dialog or a drop, and lists or previews them.";
    readonly options: {
        readonly variant: {
            readonly options: readonly ["outline", "filled"];
            readonly default: "outline";
        };
        readonly size: {
            readonly options: readonly ["small", "medium", "large"];
            readonly default: "medium";
        };
        readonly state: {
            readonly options: readonly ["default", "error", "success"];
            readonly default: "default";
        };
    };
    readonly labels: readonly ["prompt", "replace", "remove"];
    readonly parts: readonly ["base", "label", "label-text", "dropzone", "icon", "prompt", "preview", "preview-image", "actions", "replace", "remove", "list", "item", "thumb", "item-icon", "info", "name", "meta", "hint", "hint-text"];
    readonly slots: readonly [];
    readonly events: readonly ["ui-value-change", "ui-reject"];
    readonly stories: readonly ["Playground", "Variants", "Multiple", "ImagePreview", "WithForm", "OnSurfaces"];
    readonly exceptions: readonly [{
        readonly items: readonly ["form", "validity", "validationMessage", "willValidate"];
        readonly reason: "The web component exposes its form-associated state. React exposes the native state through the ref of its file input, which holds the files of the value.";
    }, {
        readonly items: readonly ["value"];
        readonly reason: "The value is a list of File objects, not a string, so the web component has it as a property only. The form receives one entry for each file under one name.";
    }, {
        readonly items: readonly ["defaultValue"];
        readonly reason: "React uses defaultValue for an uncontrolled initial and reset value. The web component has a defaultValue property for that, since an attribute cannot hold files.";
    }, {
        readonly items: readonly ["variant"];
        readonly reason: "Only outline and filled: an underlined field has no surface around it that could take a drop.";
    }, {
        readonly items: readonly ["readOnly", "labelPlacement", "placeholder"];
        readonly reason: "A native file input has no read-only state. The label stays above the zone, whose prompt replaces a placeholder.";
    }];
};
export type FileInputFieldVariant = OptionOf<typeof fileInputField, 'variant'>;
export type FileInputFieldChangeReason = 'add' | 'replace' | 'remove';
export type FileInputFieldRejection<File = FileLike> = FileRejection<File>;
export interface FileInputFieldValueChangeDetails<OriginalEvent, File = FileLike> {
    readonly reason: FileInputFieldChangeReason;
    readonly files: readonly File[];
    readonly originalEvent: OriginalEvent;
}
export interface FileInputFieldValueChangeDetail<OriginalEvent, File = FileLike> extends FileInputFieldValueChangeDetails<OriginalEvent, File> {
    readonly value: readonly File[];
}
export interface FileInputFieldRejectDetails<OriginalEvent> {
    readonly originalEvent: OriginalEvent;
}
export interface FileInputFieldRejectDetail<OriginalEvent, File = FileLike> extends FileInputFieldRejectDetails<OriginalEvent> {
    readonly rejections: readonly FileInputFieldRejection<File>[];
}
export interface FileInputFieldProps<File = FileLike> extends Omit<FieldBaseProps, 'variant'> {
    variant?: FileInputFieldVariant;
    required?: boolean;
    name?: string;
    accept?: string;
    multiple?: boolean;
    maxSize?: number;
    maxFiles?: number;
    value?: readonly File[];
    locale?: string;
    promptLabel?: string;
    replaceLabel?: string;
    getRemoveLabel?: (fileName: string) => string;
}
