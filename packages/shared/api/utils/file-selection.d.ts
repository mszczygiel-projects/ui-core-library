export interface FileLike {
    readonly name: string;
    readonly type: string;
    readonly size: number;
    readonly lastModified: number;
}
export type FileRejectionReason = 'type' | 'size' | 'count';
export interface FileRejection<File = FileLike> {
    readonly file: File;
    readonly reason: FileRejectionReason;
}
export interface FileConstraints {
    readonly accept?: string;
    readonly maxSize?: number;
    readonly maxFiles?: number;
    readonly multiple?: boolean;
}
export interface FileAdmission<File extends FileLike> {
    readonly value: readonly File[];
    readonly added: readonly File[];
    readonly rejections: readonly FileRejection<File>[];
}
export declare function matchesAccept(file: FileLike, accept: string | undefined): boolean;
export declare function isSameFile(a: FileLike, b: FileLike): boolean;
export declare function admitFiles<File extends FileLike>(current: readonly File[], incoming: readonly File[], constraints?: FileConstraints): FileAdmission<File>;
export declare function removeAt<File>(files: readonly File[], index: number): readonly File[];
export type FileValueState = 'empty' | 'preview' | 'list';
export declare function isImage(file: FileLike): boolean;
export declare function valueStateOf(files: readonly FileLike[], multiple: boolean): FileValueState;
export declare function fileExtension(name: string): string;
export declare function formatFileSize(bytes: number, locale: string): string;
export declare function fileMeta(file: FileLike, locale: string): string;
