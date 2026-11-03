/**
 * The choice of files of a file field: which files a filter admits, how a new choice joins the
 * value, and how a row describes a file. The package knows no browser types, so a file is any
 * object with the fields of a `File` that these functions read.
 */

/** The fields of a `File` that a choice of files reads. */
export interface FileLike {
  readonly name: string;
  /** The MIME type, which may be empty when the system does not know it. */
  readonly type: string;
  /** The size in bytes. */
  readonly size: number;
  readonly lastModified: number;
}

/** Why a file did not enter the value: its type, its size, or the number of files. */
export type FileRejectionReason = 'type' | 'size' | 'count';

/** A file that did not enter the value, with the reason. */
export interface FileRejection<File = FileLike> {
  readonly file: File;
  readonly reason: FileRejectionReason;
}

/** The constraints of a choice of files. */
export interface FileConstraints {
  /** A native `accept` list: extensions such as `.png`, MIME types and `type/*` wildcards. */
  readonly accept?: string;
  /** The largest size of a file, in bytes. */
  readonly maxSize?: number;
  /** The largest number of files, with `multiple`. */
  readonly maxFiles?: number;
  /** Whether new files join the value instead of replacing it. */
  readonly multiple?: boolean;
}

/** The result of a new choice of files. */
export interface FileAdmission<File extends FileLike> {
  /** The new value. */
  readonly value: readonly File[];
  /** The files that entered the value, in their order. */
  readonly added: readonly File[];
  /** The files that did not, with the reason. */
  readonly rejections: readonly FileRejection<File>[];
}

/**
 * Whether a file matches a native `accept` list. As in a browser, an empty list, or one without a
 * valid entry, accepts every file, and extensions and types compare without case.
 */
export function matchesAccept(file: FileLike, accept: string | undefined): boolean {
  const entries = (accept ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.startsWith('.') || /^[^/\s]+\/[^/\s]+$/.test(entry));
  if (entries.length === 0) {
    return true;
  }
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return entries.some((entry) => {
    if (entry.startsWith('.')) {
      return name.endsWith(entry);
    }
    if (entry.endsWith('/*')) {
      return type.startsWith(entry.slice(0, -1));
    }
    return type === entry;
  });
}

/** Whether two files are the same choice: the same name, size and modification time. */
export function isSameFile(a: FileLike, b: FileLike): boolean {
  return a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
}

/**
 * Adds a new choice of files to the value. A file of another type or above `maxSize` is rejected.
 * Without `multiple`, the first admitted file replaces the value and the rest are rejected for
 * their count. With `multiple`, the files join the value, a file already in it is skipped without
 * a rejection, and files beyond `maxFiles` are rejected for their count.
 */
export function admitFiles<File extends FileLike>(
  current: readonly File[],
  incoming: readonly File[],
  constraints: FileConstraints = {},
): FileAdmission<File> {
  const { accept, maxSize, multiple = false } = constraints;
  const limit = multiple ? (constraints.maxFiles ?? Number.POSITIVE_INFINITY) : 1;
  const value: File[] = multiple ? [...current] : [];
  const added: File[] = [];
  const rejections: FileRejection<File>[] = [];
  for (const file of incoming) {
    if (!matchesAccept(file, accept)) {
      rejections.push({ file, reason: 'type' });
    } else if (maxSize !== undefined && file.size > maxSize) {
      rejections.push({ file, reason: 'size' });
    } else if (value.some((chosen) => isSameFile(chosen, file))) {
      continue;
    } else if (value.length >= limit) {
      rejections.push({ file, reason: 'count' });
    } else {
      value.push(file);
      added.push(file);
    }
  }
  return { value: added.length === 0 ? current : value, added, rejections };
}

/** The value without the file at `index`. */
export function removeAt<File>(files: readonly File[], index: number): readonly File[] {
  return files.filter((_, position) => position !== index);
}

/** How a field shows its value: an empty zone, the preview of one image, or a list of files. */
export type FileValueState = 'empty' | 'preview' | 'list';

/** Whether a file is an image that a browser can show. */
export function isImage(file: FileLike): boolean {
  return file.type.toLowerCase().startsWith('image/');
}

/**
 * How a field shows its value. One image of a field without `multiple` gets a preview; any other
 * value is a list below the zone.
 */
export function valueStateOf(files: readonly FileLike[], multiple: boolean): FileValueState {
  if (files.length === 0) {
    return 'empty';
  }
  const [first] = files;
  return !multiple && files.length === 1 && first !== undefined && isImage(first)
    ? 'preview'
    : 'list';
}

/** The extension of a file name in capitals, such as `PNG`, or an empty string without one. */
export function fileExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 && dot < name.length - 1 ? name.slice(dot + 1).toUpperCase() : '';
}

const UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte'] as const;

/**
 * A size in the units of the locale, such as `1.2 MB` or `84 kB`, with powers of 1000 as the
 * units name them, and at most one decimal above bytes.
 */
export function formatFileSize(bytes: number, locale: string): string {
  const size = Number.isFinite(bytes) && bytes > 0 ? bytes : 0;
  let exponent = 0;
  // A size that rounds up to 1000 of a unit, such as 999,960 bytes, takes the next unit.
  while (
    exponent < UNITS.length - 1 &&
    Math.round(size / 1000 ** exponent / (exponent === 0 ? 1 : 0.1)) >=
      1000 * (exponent === 0 ? 1 : 10)
  ) {
    exponent += 1;
  }
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: UNITS[exponent],
    unitDisplay: 'short',
    maximumFractionDigits: exponent === 0 ? 0 : 1,
  }).format(size / 1000 ** exponent);
}

/** The second line of the row of a file: its extension and its size, such as `PNG · 1.2 MB`. */
export function fileMeta(file: FileLike, locale: string): string {
  const extension = fileExtension(file.name);
  const size = formatFileSize(file.size, locale);
  return extension === '' ? size : `${extension} · ${size}`;
}
