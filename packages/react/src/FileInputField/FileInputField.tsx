import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type ReactNode,
} from 'react';
import { IconDelete, IconFile, IconUpload } from '@mszczygiel-projects/ui-core-icons/react';
import { getUiCoreConfig } from '@mszczygiel-projects/ui-core-foundations';
import './FileInputField.css';

export type FileInputFieldVariant = 'outline' | 'filled';
export type FileInputFieldSize = 'small' | 'default' | 'large';
export type FileInputFieldState = 'default' | 'success' | 'error' | 'disabled';

/** Why a dropped or picked file did not make it into the selection. */
export type FileInputFieldRejectReason = 'type' | 'size' | 'count';

export interface FileInputFieldRejection {
  file: File;
  reason: FileInputFieldRejectReason;
}

/** Which presentation the field is currently in — mirrors the `Value` axis in Figma. */
export type FileInputFieldMode = 'empty' | 'filled' | 'list';

const KILO = 1024;

/** Non-localized fallback. Consumers wanting localized output pass `formatSize`. */
function defaultFormatSize(bytes: number): string {
  if (bytes < KILO) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / KILO;
  let unit = 0;
  while (value >= KILO && unit < units.length - 1) {
    value /= KILO;
    unit += 1;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}

/** Matches one `accept` entry: `.png`, `image/*` or `image/png`. */
function matchesAcceptEntry(file: File, entry: string): boolean {
  const rule = entry.trim().toLowerCase();
  if (!rule) return true;
  if (rule.startsWith('.')) return file.name.toLowerCase().endsWith(rule);
  if (rule.endsWith('/*')) return file.type.toLowerCase().startsWith(rule.slice(0, -1));
  return file.type.toLowerCase() === rule;
}

function isImage(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * File input with a drag-and-drop zone, validation states, and either an
 * in-place preview or a list of the selected files.
 *
 * The presentation is derived, never set by hand: no files renders the prompt,
 * a single image in single-file mode renders a preview with Replace/Remove,
 * and anything else keeps the drop zone and stacks the files below it.
 *
 * @example
 * <FileInputField
 *   label="Photo"
 *   description="PNG, SVG — max 2 MB"
 *   accept="image/png,image/svg+xml"
 *   maxSize={2 * 1024 * 1024}
 *   onChange={setFiles}
 * />
 */
export interface FileInputFieldProps {
  /**
   * Drop zone style: dashed outline over the page background, or a filled block.
   * @default 'outline'
   */
  variant?: FileInputFieldVariant;
  /**
   * Drop zone height and typography scale.
   * @default 'default'
   */
  size?: FileInputFieldSize;
  /** Label text rendered above the drop zone. */
  label?: string;
  /** Prompt inside the empty drop zone. Falls back to `labels.fileInput.browse`. */
  prompt?: string;
  /** Secondary line under the prompt — accepted formats, size limits, etc. */
  description?: string;
  /** Helper text rendered below the field, linked via `aria-describedby`. */
  hint?: string;
  /**
   * Validation state; `error` sets `aria-invalid`, `disabled` disables the input.
   * @default 'default'
   */
  state?: FileInputFieldState;
  /** Disables the input and drop zone interactions. */
  disabled?: boolean;
  /** Native `accept` filter, also enforced on dropped files. */
  accept?: string;
  /** Allows selecting more than one file. */
  multiple?: boolean;
  /** Largest accepted file size in bytes. */
  maxSize?: number;
  /** Largest accepted number of files. */
  maxFiles?: number;
  /** Selected files. Passing it makes the component controlled. */
  files?: File[];
  /** Initial selection for the uncontrolled component. */
  defaultFiles?: File[];
  /** Called with the full selection whenever it changes. */
  onChange?: (files: File[]) => void;
  /** Called with the files refused by `accept`, `maxSize` or `maxFiles`. */
  onReject?: (rejections: FileInputFieldRejection[]) => void;
  /** Called just before a file leaves the selection. */
  onRemove?: (file: File, index: number) => void;
  /** Form field name used on submission. */
  name?: string;
  /** Marks the field as required for form submission. */
  required?: boolean;
  /** Label of the Replace button. */
  replaceLabel?: string;
  /** Accessible name of a file's remove button. */
  removeLabel?: (fileName: string) => string;
  /** Formats the byte count shown next to a file name. */
  formatSize?: (bytes: number) => string;
  /** Extra controls appended next to Replace and Remove in the preview. */
  actions?: ReactNode;
  /** Extra class names appended to the root element. */
  className?: string;
  /** Inline styles forwarded to the root element (positioning only — never visual styles). */
  style?: CSSProperties;
}

export const FileInputField = forwardRef<HTMLInputElement, FileInputFieldProps>(
  function FileInputField(
    {
      variant = 'outline',
      size = 'default',
      label,
      prompt,
      description,
      hint,
      state = 'default',
      accept,
      multiple = false,
      maxSize,
      maxFiles,
      files,
      defaultFiles,
      onChange,
      onReject,
      onRemove,
      name,
      required,
      replaceLabel,
      removeLabel,
      formatSize,
      actions,
      className,
      style,
    }: FileInputFieldProps,
    ref,
  ) {
    const generatedId = useId();
    const inputId = `${generatedId}-input`;
    const descriptionId = `${generatedId}-description`;
    const hintId = `${generatedId}-hint`;

    const inputRef = useRef<HTMLInputElement | null>(null);
    const [internalFiles, setInternalFiles] = useState<File[]>(defaultFiles ?? []);
    const [isDragover, setIsDragover] = useState(false);
    // Nested dragenter/dragleave pairs fire per child; counting keeps it stable.
    const dragDepth = useRef(0);

    const isControlled = files !== undefined;
    const selected = isControlled ? files : internalFiles;
    const isDisabled = state === 'disabled';

    const labels = getUiCoreConfig().labels.fileInput;
    const resolveRemoveLabel = removeLabel ?? labels.remove;
    const resolveSize = formatSize ?? defaultFormatSize;

    const mode: FileInputFieldMode =
      selected.length === 0
        ? 'empty'
        : !multiple && selected.length === 1 && isImage(selected[0])
          ? 'filled'
          : 'list';

    /*
     * Object URLs are owned by this component: created for the files currently
     * in the selection, revoked as soon as a file leaves it or the component
     * unmounts. Deriving them in render without this bookkeeping leaks.
     */
    const previewUrls = useMemo(() => {
      const map = new Map<File, string>();
      for (const file of selected) {
        if (isImage(file)) map.set(file, URL.createObjectURL(file));
      }
      return map;
    }, [selected]);

    useEffect(() => {
      return () => {
        for (const url of previewUrls.values()) URL.revokeObjectURL(url);
      };
    }, [previewUrls]);

    const commit = useCallback(
      (next: File[]) => {
        if (!isControlled) setInternalFiles(next);
        onChange?.(next);
      },
      [isControlled, onChange],
    );

    const ingest = useCallback(
      (incoming: File[]) => {
        if (isDisabled || incoming.length === 0) return;
        const rules = accept?.split(',').filter((entry) => entry.trim()) ?? [];
        const kept = multiple ? [...selected] : [];
        const accepted: File[] = [];
        const rejections: FileInputFieldRejection[] = [];

        for (const file of incoming) {
          if (rules.length && !rules.some((rule) => matchesAcceptEntry(file, rule))) {
            rejections.push({ file, reason: 'type' });
            continue;
          }
          if (maxSize !== undefined && file.size > maxSize) {
            rejections.push({ file, reason: 'size' });
            continue;
          }
          if (maxFiles !== undefined && kept.length + accepted.length >= maxFiles) {
            rejections.push({ file, reason: 'count' });
            continue;
          }
          accepted.push(file);
          if (!multiple) break;
        }

        if (rejections.length) onReject?.(rejections);
        if (!accepted.length) return;
        commit(multiple ? [...selected, ...accepted] : accepted);
      },
      [accept, commit, isDisabled, maxFiles, maxSize, multiple, onReject, selected],
    );

    const openPicker = () => {
      if (isDisabled) return;
      inputRef.current?.click();
    };

    const handleRemove = (file: File, index: number) => {
      if (isDisabled) return;
      onRemove?.(file, index);
      commit(selected.filter((_, i) => i !== index));
    };

    const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
      if (isDisabled) return;
      event.preventDefault();
      dragDepth.current += 1;
      setIsDragover(true);
    };

    const handleDragLeave = () => {
      if (isDisabled) return;
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setIsDragover(false);
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
      if (isDisabled) return;
      event.preventDefault();
      dragDepth.current = 0;
      setIsDragover(false);
      ingest(Array.from(event.dataTransfer?.files ?? []));
    };

    const meta = (file: File) => {
      const dot = file.name.lastIndexOf('.');
      const extension = dot > 0 ? file.name.slice(dot + 1).toUpperCase() : '';
      const formatted = resolveSize(file.size);
      return extension ? `${extension} · ${formatted}` : formatted;
    };

    const rootClass = [
      'ui-file-input-field',
      `ui-file-input-field--${variant}`,
      size !== 'default' && `ui-file-input-field--${size}`,
      state !== 'default' && `ui-file-input-field--state-${state}`,
      isDragover && 'ui-file-input-field--dragover',
      'ui-control-field',
      `ui-control-field--${variant}`,
      size !== 'default' && `ui-control-field--${size}`,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    // The description only exists in the prompt, which the preview replaces —
    // pointing aria-describedby at an id that is not in the tree says nothing.
    const describedBy =
      [description && mode !== 'filled' ? descriptionId : '', hint ? hintId : '']
        .filter(Boolean)
        .join(' ') || undefined;

    return (
      <div className={rootClass} style={style} data-value={mode}>
        {label && (
          <label className="ui-file-input-field__label" htmlFor={inputId}>
            {label}
          </label>
        )}
        <input
          id={inputId}
          className="ui-file-input-field__input"
          type="file"
          ref={(node) => {
            inputRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          accept={accept}
          name={name}
          multiple={multiple}
          disabled={isDisabled}
          required={required}
          aria-invalid={state === 'error' ? 'true' : undefined}
          aria-describedby={describedBy}
          onChange={(event) => {
            ingest(Array.from(event.target.files ?? []));
            // Lets the same file be picked again right after it was removed.
            event.target.value = '';
          }}
        />
        <div
          className="ui-file-input-field__dropzone"
          onClick={openPicker}
          onDragEnter={handleDragEnter}
          onDragOver={(event) => {
            if (isDisabled) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
          }}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {mode === 'filled' ? (
            <>
              <span className="ui-file-input-field__preview">
                <img src={previewUrls.get(selected[0])} alt={selected[0].name} />
              </span>
              <span className="ui-file-input-field__actions">
                <button
                  type="button"
                  className="ui-file-input-field__action"
                  disabled={isDisabled}
                  onClick={(event) => {
                    event.stopPropagation();
                    openPicker();
                  }}
                >
                  {replaceLabel ?? labels.replace}
                </button>
                <button
                  type="button"
                  className="ui-file-input-field__action ui-file-input-field__action--icon"
                  aria-label={resolveRemoveLabel(selected[0].name)}
                  disabled={isDisabled}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleRemove(selected[0], 0);
                  }}
                >
                  <IconDelete />
                </button>
                {actions}
              </span>
            </>
          ) : (
            <>
              <span className="ui-file-input-field__icon">
                <IconUpload />
              </span>
              <p className="ui-file-input-field__prompt">{prompt ?? labels.browse}</p>
              {description && (
                <p id={descriptionId} className="ui-file-input-field__description">
                  {description}
                </p>
              )}
            </>
          )}
        </div>
        {mode === 'list' && (
          <ul className="ui-file-input-field__list">
            {selected.map((file, index) => (
              <li className="ui-file-input-field__item" key={`${file.name}-${index}`}>
                <span className="ui-file-input-field__thumb">
                  {isImage(file) ? <img src={previewUrls.get(file)} alt="" /> : <IconFile />}
                </span>
                <span className="ui-file-input-field__info">
                  <span className="ui-file-input-field__name">{file.name}</span>
                  <span className="ui-file-input-field__meta">{meta(file)}</span>
                </span>
                <button
                  type="button"
                  className="ui-file-input-field__action ui-file-input-field__action--icon"
                  aria-label={resolveRemoveLabel(file.name)}
                  disabled={isDisabled}
                  onClick={() => handleRemove(file, index)}
                >
                  <IconDelete />
                </button>
              </li>
            ))}
          </ul>
        )}
        {hint && (
          <p id={hintId} className="ui-file-input-field__hint">
            {hint}
          </p>
        )}
      </div>
    );
  },
);
