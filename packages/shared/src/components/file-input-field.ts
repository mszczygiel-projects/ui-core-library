import type { FileLike, FileRejection } from '../utils/file-selection.ts';
import { defineComponent, type OptionOf } from './component.ts';
import { type FieldBaseProps, textField } from './text-field.ts';

const { options } = textField;

/** The specification of FileInputField. */
export const fileInputField = defineComponent({
  name: 'FileInputField',
  tag: 'ui-file-input-field',
  category: 'Inputs',
  status: 'in-progress',
  figma: '2409:3222',
  design: {
    flags: ['disabled'],
    booleans: [],
    codeOnly: [
      'name',
      'required',
      'accept',
      'multiple',
      'maxSize',
      'maxFiles',
      'locale',
      'replaceLabel',
      'getRemoveLabel',
    ],
    previews: {
      interaction: {
        options: ['rest', 'active', 'focus', 'dragover'],
        default: 'rest',
        note: 'Previews hover and press (active), keyboard focus and files dragged over the zone (dragover). Leave it at rest in a design.',
      },
      valueState: {
        options: ['empty', 'preview', 'list'],
        default: 'empty',
        note: 'Chooses the layout of the value: no file, the preview of one image without multiple, or a list of files below the zone.',
      },
    },
  },
  summary: 'A field that takes files from a dialog or a drop, and lists or previews them.',
  options: {
    variant: { options: ['outline', 'filled'], default: 'outline' },
    size: options.size,
    state: options.state,
  },
  labels: ['prompt', 'replace', 'remove'],
  parts: [
    'base',
    'label',
    'label-text',
    'dropzone',
    'icon',
    'prompt',
    'preview',
    'preview-image',
    'actions',
    'replace',
    'remove',
    'list',
    'item',
    'thumb',
    'item-icon',
    'info',
    'name',
    'meta',
    'hint',
    'hint-text',
  ],
  slots: [],
  events: ['ui-value-change', 'ui-reject'],
  stories: ['Playground', 'Variants', 'Multiple', 'ImagePreview', 'WithForm', 'OnSurfaces'],
  exceptions: [
    {
      items: ['form', 'validity', 'validationMessage', 'willValidate'],
      reason:
        'The web component exposes its form-associated state. React exposes the native state through the ref of its file input, which holds the files of the value.',
    },
    {
      items: ['value'],
      reason:
        'The value is a list of File objects, not a string, so the web component has it as a property only. The form receives one entry for each file under one name.',
    },
    {
      items: ['defaultValue'],
      reason:
        'React uses defaultValue for an uncontrolled initial and reset value. The web component has a defaultValue property for that, since an attribute cannot hold files.',
    },
    {
      items: ['variant'],
      reason:
        'Only outline and filled: an underlined field has no surface around it that could take a drop.',
    },
    {
      items: ['readOnly', 'labelPlacement', 'placeholder'],
      reason:
        'A native file input has no read-only state. The label stays above the zone, whose prompt replaces a placeholder.',
    },
  ],
});

/** The surface and border treatment of the zone. */
export type FileInputFieldVariant = OptionOf<typeof fileInputField, 'variant'>;

/** What changed the value: new files, a file that replaced the one before, or a removal. */
export type FileInputFieldChangeReason = 'add' | 'replace' | 'remove';

/** A file that did not enter the value, with the reason. */
export type FileInputFieldRejection<File = FileLike> = FileRejection<File>;

/**
 * What accompanies a new value. The package knows no browser types, so each implementation names
 * the type of the event and of a file.
 */
export interface FileInputFieldValueChangeDetails<OriginalEvent, File = FileLike> {
  /** What changed the value. */
  readonly reason: FileInputFieldChangeReason;
  /** The files that entered or left the value. */
  readonly files: readonly File[];
  /** The event of the dialog, the drop or the remove button. */
  readonly originalEvent: OriginalEvent;
}

/** The detail of `ui-value-change`: the new value, what changed it and the native event. */
export interface FileInputFieldValueChangeDetail<
  OriginalEvent,
  File = FileLike,
> extends FileInputFieldValueChangeDetails<OriginalEvent, File> {
  /** The files of the field, in their order. */
  readonly value: readonly File[];
}

/** What accompanies rejected files: the native event of the dialog or the drop. */
export interface FileInputFieldRejectDetails<OriginalEvent> {
  readonly originalEvent: OriginalEvent;
}

/** The detail of `ui-reject`: the files that did not enter the value, and the native event. */
export interface FileInputFieldRejectDetail<
  OriginalEvent,
  File = FileLike,
> extends FileInputFieldRejectDetails<OriginalEvent> {
  readonly rejections: readonly FileInputFieldRejection<File>[];
}

/**
 * The props both implementations of FileInputField share. `File` is the type of a file, which
 * each implementation names.
 */
export interface FileInputFieldProps<File = FileLike> extends Omit<FieldBaseProps, 'variant'> {
  /**
   * The surface and border treatment of the zone.
   * @default 'outline'
   */
  variant?: FileInputFieldVariant;
  /**
   * Requires at least one file for native validation.
   * @default false
   */
  required?: boolean;
  /** The name of the form entries, one for each file. */
  name?: string;
  /**
   * The file types a user may choose: extensions such as `.png`, MIME types and `type/*`
   * wildcards, as on a native input. A dropped file of another type is rejected.
   */
  accept?: string;
  /**
   * Lets a user choose several files, which join the value. Without it a new file replaces it.
   * @default false
   */
  multiple?: boolean;
  /** The largest size of a file, in bytes. A larger file is rejected. */
  maxSize?: number;
  /** The largest number of files, with `multiple`. Further files are rejected. */
  maxFiles?: number;
  /** The files of the field, in their order. */
  value?: readonly File[];
  /** BCP 47 locale of the file sizes, before the configured locale and browser language. */
  locale?: string;
  /** The text of the zone, falling back to `labels.fileInputField.prompt`. */
  promptLabel?: string;
  /** The text of the button that replaces a previewed image, falling back to `labels.fileInputField.replace`. */
  replaceLabel?: string;
  /** The name of the button that removes a file, falling back to `labels.fileInputField.remove`. */
  getRemoveLabel?: (fileName: string) => string;
}
