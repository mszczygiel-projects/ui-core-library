'use client';

import { iconDelete, iconFile, iconUpload } from '@mszczygiel-projects/ui-core-icons';
import {
  fileInputField,
  type FileInputFieldChangeReason,
  type FileInputFieldProps as SharedFileInputFieldProps,
  type FileInputFieldRejectDetails as SharedRejectDetails,
  type FileInputFieldRejection as SharedRejection,
  type FileInputFieldValueChangeDetails as SharedValueChangeDetails,
  type FileInputFieldVariant,
} from '@mszczygiel-projects/ui-core-shared/file-input-field';
import {
  admitFiles,
  fileMeta,
  removeAt,
  valueStateOf,
} from '@mszczygiel-projects/ui-core-shared/file-selection';
import { resolveLocale } from '@mszczygiel-projects/ui-core-shared/locale';
import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import type { TextFieldSize, TextFieldState } from '@mszczygiel-projects/ui-core-shared/text-field';
import {
  type ComponentPropsWithRef,
  type DragEvent,
  type MouseEvent,
  type RefObject,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import { Button } from '../button/Button.tsx';
import { IconButton } from '../icon-button/IconButton.tsx';
import { classNames } from '../internal/class-names.ts';
import { fieldDescription, splitFieldAttributes } from '../internal/field.tsx';
import { setRef } from '../internal/set-ref.ts';
import { useFormState } from '../internal/use-form-state.ts';
import { useUiCoreConfig } from '../internal/use-ui-core-config.ts';

export type {
  FileInputFieldChangeReason,
  TextFieldSize as FileInputFieldSize,
  TextFieldState as FileInputFieldState,
  FileInputFieldVariant,
};

/** What changed the value, the files it affected and the native event, before React wraps it. */
export type FileInputFieldValueChangeDetails = SharedValueChangeDetails<Event, File>;

/** The native event of rejected files, before React wraps it. */
export type FileInputFieldRejectDetails = SharedRejectDetails<Event>;

/** A file that did not enter the value, with the reason. */
export type FileInputFieldRejection = SharedRejection<File>;

const { options } = fileInputField;
const block = 'ui-file-input-field';

function part(element: string): string {
  return `${block}__${element}`;
}

const subscribeLanguage = () => () => undefined;
const browserLanguage = () => navigator.language;
const serverLanguage = () => undefined;

/**
 * The props of FileInputField. `className`, `style` and `data-*` reach the root; `id`, `aria-*`,
 * native attributes and `ref` reach the native file input.
 */
export interface FileInputFieldProps
  extends
    SharedFileInputFieldProps<File>,
    Omit<
      ComponentPropsWithRef<'input'>,
      keyof SharedFileInputFieldProps<File> | 'type' | 'defaultValue' | 'children'
    > {
  /** The controlled files. Pair it with onValueChange to accept a choice. */
  value?: readonly File[];
  /** The initial uncontrolled files, restored by a native form reset. @default [] */
  defaultValue?: readonly File[];
  /** Called when a user adds, replaces or removes files, with the new value and what changed it. */
  onValueChange?: (value: readonly File[], details: FileInputFieldValueChangeDetails) => void;
  /** Called with the files that did not enter the value, each with the reason. */
  onReject?: (
    rejections: readonly FileInputFieldRejection[],
    details: FileInputFieldRejectDetails,
  ) => void;
}

const NO_FILES: readonly File[] = [];

/**
 * A field that takes files from a dialog or a drop, and lists or previews them.
 *
 * A visually hidden native file input is the only control in the tab order and the form control:
 * the label names it, the hint describes it, and after every change it holds the files of the
 * value, so that the browser submits and validates what the field shows. A press on the zone opens
 * the dialog of the system, and the zone takes dropped files. Without `multiple` a new file replaces
 * the value, and one image shows as a preview with Replace and Remove buttons; with `multiple` new
 * files join the value, a file already in it is skipped, and the files are a list below the zone.
 * `accept`, `maxSize` and `maxFiles` reject files through `onReject`, which never changes validity.
 */
export function FileInputField({
  variant = 'outline',
  size = 'medium',
  state = 'default',
  label,
  hint,
  disabled = false,
  required = false,
  name,
  accept,
  multiple = false,
  maxSize,
  maxFiles,
  value,
  defaultValue = NO_FILES,
  locale,
  promptLabel,
  replaceLabel,
  getRemoveLabel,
  onValueChange,
  onReject,
  onChange,
  id,
  className,
  style,
  dir,
  ref,
  'aria-describedby': describedBy,
  ...rest
}: FileInputFieldProps) {
  const attributes = splitFieldAttributes(rest);
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${generatedId}-hint`;
  const { labels: allLabels, locale: configuredLocale } = useUiCoreConfig();
  const labels = allLabels.fileInputField;
  const browserLocale = useSyncExternalStore(subscribeLanguage, browserLanguage, serverLanguage);
  const sizeLocale = resolveLocale(locale, configuredLocale, browserLocale);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const current = value ?? uncontrolled;
  const [dragging, setDragging] = useState(false);
  const dragDepthRef = useRef(0);
  const focusAfterRenderRef = useRef<number | 'input' | undefined>(undefined);
  const fieldsetDisabled = useFormState(inputRef, () => {
    setUncontrolled(defaultValue);
    // The reset emptied the input; the files of the value go back into it.
    syncInputFiles(inputRef.current, value ?? defaultValue);
  });
  const inactive = disabled || fieldsetDisabled;

  const appearance = {
    variant: oneOf(variant, options.variant.options, options.variant.default),
    size: oneOf(size, options.size.options, options.size.default),
    state: oneOf(state, options.state.options, options.state.default),
  };
  const valueState = valueStateOf(current, multiple);
  const [first] = current;
  const previewed = valueState === 'preview' ? first : undefined;
  const previewRef = usePreviewImage(previewed);
  const prompt = promptLabel ?? labels.prompt;
  const removeLabel = getRemoveLabel ?? labels.remove;

  useEffect(() => {
    syncInputFiles(inputRef.current, current);
  });

  useEffect(() => {
    const target = focusAfterRenderRef.current;
    focusAfterRenderRef.current = undefined;
    if (target === 'input') {
      inputRef.current?.focus();
    } else if (target !== undefined) {
      listRef.current?.querySelectorAll<HTMLElement>(`.${block}__remove`)[target]?.focus();
    }
  });

  const commit = (
    next: readonly File[],
    reason: FileInputFieldChangeReason,
    files: readonly File[],
    event: Event,
  ) => {
    if (value === undefined) {
      setUncontrolled(next);
    }
    onValueChange?.(next, { reason, files, originalEvent: event });
  };

  const add = (incoming: readonly File[], event: Event) => {
    const replacing = !multiple && current.length > 0;
    const result = admitFiles(current, incoming, { accept, maxSize, maxFiles, multiple });
    if (result.added.length > 0) {
      commit(result.value, replacing ? 'replace' : 'add', result.added, event);
    }
    // The dialog wrote its own choice into the input. It shows the value, which a controlled
    // field keeps until its parent passes a new one.
    syncInputFiles(inputRef.current, value === undefined ? result.value : current);
    if (result.rejections.length > 0) {
      onReject?.(result.rejections, { originalEvent: event });
    }
  };

  const remove = (index: number, event: Event) => {
    const file = current[index];
    if (inactive || file === undefined) {
      return;
    }
    const next = removeAt(current, index);
    const rows = valueStateOf(next, multiple) === 'list' ? next.length : 0;
    focusAfterRenderRef.current =
      index < rows ? index : index > 0 && rows > 0 ? index - 1 : 'input';
    commit(next, 'remove', [file], event);
    syncInputFiles(inputRef.current, value === undefined ? next : current);
  };

  const onZoneClick = (event: MouseEvent<HTMLDivElement>) => {
    // A press on the buttons of a preview does what the button does, never what the zone does.
    const onActions =
      event.target instanceof Element && event.target.closest(`.${part('actions')}`) !== null;
    if (!inactive && !onActions) {
      inputRef.current?.click();
    }
  };

  const onDrag = (event: DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer.types.includes('Files')) {
      return;
    }
    switch (event.type) {
      case 'dragenter':
        event.preventDefault();
        dragDepthRef.current += 1;
        setDragging(!inactive);
        break;
      case 'dragover':
        // Without this the browser would open a dropped file in place of the page.
        event.preventDefault();
        event.dataTransfer.dropEffect = inactive ? 'none' : 'copy';
        break;
      case 'dragleave':
        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
        if (dragDepthRef.current === 0) {
          setDragging(false);
        }
        break;
      case 'drop':
        event.preventDefault();
        dragDepthRef.current = 0;
        setDragging(false);
        if (!inactive) {
          add([...event.dataTransfer.files], event.nativeEvent);
        }
        break;
    }
  };

  return (
    <div
      {...attributes.root}
      dir={dir}
      style={style}
      className={classNames(
        block,
        part('base'),
        className,
        `${block}--${appearance.variant}`,
        `${block}--${appearance.size}`,
        `${block}--${appearance.state}`,
        `${block}--${valueState}`,
        inactive && `${block}--disabled`,
        dragging && !inactive && `${block}--dragover`,
      )}
    >
      {label ? (
        <label className={part('label')} htmlFor={inputId}>
          <span className={part('label-text')}>{label}</span>
        </label>
      ) : null}
      <input
        type="file"
        id={inputId}
        className={part('input')}
        // A named file input without files still submits an empty entry, so the name waits for a file.
        name={current.length > 0 ? name : undefined}
        accept={accept}
        multiple={multiple}
        required={required}
        disabled={disabled}
        aria-label={label ? undefined : prompt}
        aria-invalid={appearance.state === 'error' || undefined}
        {...attributes.control}
        aria-describedby={fieldDescription(describedBy, hint, hintId)}
        ref={(element) => {
          inputRef.current = element;
          const release = setRef(ref, element);
          return () => {
            inputRef.current = null;
            release();
          };
        }}
        onChange={(event) => {
          onChange?.(event);
          add([...(event.currentTarget.files ?? [])], event.nativeEvent);
        }}
      />
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- the zone is a pointer shortcut to the input, which keyboard users reach instead */}
      <div
        className={part('dropzone')}
        onClick={onZoneClick}
        onDragEnter={onDrag}
        onDragOver={onDrag}
        onDragLeave={onDrag}
        onDrop={onDrag}
      >
        {previewed ? (
          <>
            <div className={part('preview')}>
              <img ref={previewRef} className={part('preview-image')} alt={previewed.name} />
            </div>
            <div className={part('actions')}>
              <Button
                className={part('replace')}
                variant="outline"
                size="small"
                disabled={inactive}
                onClick={() => {
                  inputRef.current?.click();
                }}
              >
                {replaceLabel ?? labels.replace}
              </Button>
              <IconButton
                className={part('remove')}
                variant="ghost"
                size="small"
                disabled={inactive}
                label={removeLabel(previewed.name)}
                icon={<span dangerouslySetInnerHTML={{ __html: iconDelete }} />}
                onClick={(event) => {
                  remove(0, event.nativeEvent);
                }}
              />
            </div>
          </>
        ) : (
          <>
            <span
              className={part('icon')}
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: iconUpload }}
            />
            <span className={part('prompt')}>{prompt}</span>
          </>
        )}
      </div>
      {valueState === 'list' ? (
        <ul ref={listRef} className={part('list')}>
          {current.map((file, index) => (
            <li
              key={`${file.name}-${String(file.size)}-${String(file.lastModified)}`}
              className={part('item')}
            >
              <span className={part('thumb')}>
                <span
                  className={part('item-icon')}
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{ __html: iconFile }}
                />
              </span>
              <span className={part('info')}>
                <span className={part('name')}>{file.name}</span>
                <span className={part('meta')}>{fileMeta(file, sizeLocale)}</span>
              </span>
              <IconButton
                className={part('remove')}
                variant="ghost"
                size="small"
                disabled={inactive}
                label={removeLabel(file.name)}
                icon={<span dangerouslySetInnerHTML={{ __html: iconDelete }} />}
                onClick={(event) => {
                  remove(index, event.nativeEvent);
                }}
              />
            </li>
          ))}
        </ul>
      ) : null}
      {hint ? (
        <span id={hintId} className={part('hint')}>
          <span className={part('hint-text')}>{hint}</span>
        </span>
      ) : null}
    </div>
  );
}

/**
 * Shows a previewed image from an object URL, revoked when the image leaves or the field unmounts.
 * The URL goes straight to the image, which a server render leaves without a source.
 */
function usePreviewImage(file: File | undefined): RefObject<HTMLImageElement | null> {
  const imageRef = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    const image = imageRef.current;
    if (file === undefined || image === null) {
      return;
    }
    const url = URL.createObjectURL(file);
    image.src = url;
    return () => {
      image.removeAttribute('src');
      URL.revokeObjectURL(url);
    };
  }, [file]);
  return imageRef;
}

/** Puts the files of the value into the native input, which the form submits and validates. */
function syncInputFiles(input: HTMLInputElement | null, files: readonly File[]): void {
  if (input === null) {
    return;
  }
  const listed = [...(input.files ?? [])];
  const same =
    listed.length === files.length &&
    // The same object, not the same metadata: a new File with the old name has new bytes.
    listed.every((file, index) => file === files[index]);
  if (!same) {
    const transfer = new DataTransfer();
    for (const file of files) {
      transfer.items.add(file);
    }
    input.files = transfer.files;
  }
}
