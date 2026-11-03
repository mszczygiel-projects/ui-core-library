import type { UiCoreConfig } from '@mszczygiel-projects/ui-core-foundations/config';
import { getUiCoreConfig } from '@mszczygiel-projects/ui-core-foundations/config';
import { iconDelete, iconFile, iconUpload } from '@mszczygiel-projects/ui-core-icons';
import {
  fileInputField,
  type FileInputFieldProps,
  type FileInputFieldVariant,
} from '@mszczygiel-projects/ui-core-shared/file-input-field';
import {
  admitFiles,
  fileMeta,
  isSameFile,
  removeAt,
  valueStateOf,
} from '@mszczygiel-projects/ui-core-shared/file-selection';
import { resolveLocale } from '@mszczygiel-projects/ui-core-shared/locale';
import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import type { TextFieldSize, TextFieldState } from '@mszczygiel-projects/ui-core-shared/text-field';
import {
  AttachInternals,
  Component,
  Element,
  Event,
  type EventEmitter,
  h,
  Prop,
  State,
  type VNode,
  Watch,
} from '@stencil/core';

import { setState } from '../internal/action.ts';
import { followConfig } from '../internal/config.ts';
import { followAttribute } from '../internal/follow-attribute.ts';
import type { FormAssociated } from '../internal/form-associated.ts';
import { copyValidity } from '../internal/form-value.ts';
import type { FileInputFieldReject, FileInputFieldValueChange } from './events.ts';

// HTMLElement is repeated because the first build runs before Stencil declares the element.
declare global {
  interface HTMLUiFileInputFieldElement extends HTMLElement, FormAssociated {
    /** The files of the field, in their order. */
    value: readonly File[];
    /** The initial and reset value, since an attribute cannot hold files. */
    defaultValue: readonly File[];
  }
}

const { options } = fileInputField;

/** The field of saved form state that holds the files, whatever the name of the field. */
const STATE_ENTRY = 'file';

/**
 * A field that takes files from a dialog or a drop, and lists or previews them.
 *
 * A visually hidden native file input is the only control in the tab order: the label names it,
 * the hint describes it, and Enter or Space opens the dialog of the system. A press on the zone
 * opens the same dialog, and the zone takes files dropped on it. Without `multiple` a new file
 * replaces the value, and one image shows as a preview with Replace and Remove buttons; with
 * `multiple` new files join the value, a file already in it is skipped, and the files are a list
 * below the zone, each with a remove button. `accept`, `maxSize` and `maxFiles` reject files with
 * `ui-reject`, which never changes validity. The host is form-associated and submits one entry for
 * each file under its name. An author's `aria-label` names the input when it has no visible label.
 *
 * Custom states: `disabled`, `dragover` while files are dragged over the zone, and `invalid` while
 * `state` is `error`.
 *
 * @part base - The field, its label, zone, list and hint.
 * @part label - The visible label.
 * @part label-text - The visible label text.
 * @part dropzone - The zone that opens the dialog and takes dropped files.
 * @part icon - The decorative icon of the zone.
 * @part prompt - The text of the zone.
 * @part preview - The frame of a previewed image.
 * @part preview-image - The previewed image.
 * @part actions - The Replace and Remove buttons of a preview.
 * @part replace - The button that replaces a previewed image, a Button component.
 * @part remove - A button that removes a file, an IconButton component.
 * @part list - The list of files.
 * @part item - The row of a file.
 * @part thumb - The square around the icon of a row.
 * @part item-icon - The decorative icon of a row.
 * @part info - The name and description of a file.
 * @part name - The name of a file.
 * @part meta - The extension and size of a file.
 * @part hint - The help or feedback container.
 * @part hint-text - The help or feedback text.
 */
@Component({
  tag: 'ui-file-input-field',
  styleUrl: 'file-input-field.css',
  shadow: { delegatesFocus: true },
  formAssociated: true,
})
export class UiFileInputField implements FileInputFieldProps<File>, FormAssociated {
  @Element() host!: HTMLUiFileInputFieldElement;

  @AttachInternals() internals!: ElementInternals;

  /** The surface and border treatment of the zone. */
  @Prop() variant: FileInputFieldVariant = 'outline';

  /** The size, which follows the density. */
  @Prop() size: TextFieldSize = 'medium';

  /** A persistent visible name. Include any required marker in this text. */
  @Prop() label?: string;

  /** Help or validation feedback, connected to the description of the input. */
  @Prop() hint?: string;

  /** Visual feedback; `error` also sets `aria-invalid` without changing native validity. */
  @Prop() state: TextFieldState = 'default';

  /** Prevents interaction and submission. */
  @Prop({ reflect: true }) disabled = false;

  /** Requires at least one file for native validation. */
  @Prop() required = false;

  /** The name of the form entries, one for each file. */
  @Prop({ reflect: true }) name?: string;

  /**
   * The file types a user may choose: extensions such as `.png`, MIME types and `type/*`
   * wildcards. A dropped file of another type is rejected.
   */
  @Prop() accept?: string;

  /** Lets a user choose several files, which join the value. Without it a new file replaces it. */
  @Prop() multiple = false;

  /** The largest size of a file, in bytes. A larger file is rejected. */
  @Prop() maxSize?: number;

  /** The largest number of files, with `multiple`. Further files are rejected. */
  @Prop() maxFiles?: number;

  /** BCP 47 locale of the file sizes, before the configured locale and browser language. */
  @Prop() locale?: string;

  /** The text of the zone, falling back to `labels.fileInputField.prompt`. */
  @Prop() promptLabel?: string;

  /** The text of the button that replaces a previewed image, falling back to `labels.fileInputField.replace`. */
  @Prop() replaceLabel?: string;

  /** The name of the button that removes a file, falling back to `labels.fileInputField.remove`. */
  @Prop() getRemoveLabel?: (fileName: string) => string;

  /** Files a user added or removed, with the new value, the reason and the original event. */
  @Event({ eventName: 'ui-value-change' }) valueChange!: EventEmitter<FileInputFieldValueChange>;

  /** Files that did not enter the value, each with the reason, and the original event. */
  @Event({ eventName: 'ui-reject' }) rejected!: EventEmitter<FileInputFieldReject>;

  @State() private current: readonly File[] = [];

  /** Whether the browser disables the form-associated host, by its attribute or its fieldset. */
  @State() private formDisabled = false;

  /** Whether files are dragged over the zone. */
  @State() private dragging = false;

  /** The object URL of the previewed image. */
  @State() private previewSource?: string;

  @State() private ariaLabel: string | null = null;

  @State() private config: UiCoreConfig = getUiCoreConfig();

  private defaults: readonly File[] = [];

  /** Whether a user or a script set the value, after which the defaults only supply a reset. */
  private dirty = false;

  /** The file whose object URL the preview shows, revoked when it leaves the preview. */
  private previewFile?: File;

  /** Entered minus left elements of the zone, since leaving a child of the zone enters another. */
  private dragDepth = 0;

  /** Where the focus goes after a removal: the remove button at an index, or the input. */
  private focusAfterRender?: number | 'input';

  private stopFollowing: (() => void)[] = [];

  /** The files of the field, in their order. */
  get value(): readonly File[] {
    return this.current;
  }

  set value(files: readonly File[]) {
    this.restore(filesOf(files));
    this.dirty = true;
  }

  /** The initial and reset value, since an attribute cannot hold files. */
  get defaultValue(): readonly File[] {
    return this.defaults;
  }

  set defaultValue(files: readonly File[]) {
    this.defaults = filesOf(files);
    if (!this.dirty) {
      this.restore(this.defaults);
    }
  }

  /** The associated form, including an explicit `form` attribute. */
  get form(): HTMLFormElement | null {
    return this.internals.form;
  }

  /** Native validity, from a native file input with the same constraints and files. */
  get validity(): ValidityState {
    this.syncForm();
    return this.internals.validity;
  }

  /** The native validation message. */
  get validationMessage(): string {
    this.syncForm();
    return this.internals.validationMessage;
  }

  /** Whether the host takes part in native constraint validation. */
  get willValidate(): boolean {
    return this.internals.willValidate;
  }

  /** Checks the form-associated host and dispatches `invalid` when needed. */
  // eslint-disable-next-line stencil/own-methods-must-be-private -- the synchronous API of a native control
  checkValidity(): boolean {
    this.syncForm();
    return this.internals.checkValidity();
  }

  /** Reports invalidity, with the input as the anchor of the message. */
  // eslint-disable-next-line stencil/own-methods-must-be-private -- the synchronous API of a native control
  reportValidity(): boolean {
    this.syncForm();
    return this.internals.reportValidity();
  }

  @Watch('name')
  @Watch('required')
  protected constraintsChanged(): void {
    // The entries carry the name, so a new name submits the files under it at once.
    this.syncForm();
  }

  @Watch('multiple')
  protected multipleChanged(): void {
    this.syncPreview();
  }

  connectedCallback(): void {
    this.stopFollowing = [
      followConfig((config) => {
        this.config = config;
      }),
      followAttribute(this.host, 'aria-label', (value) => {
        this.ariaLabel = value;
      }),
    ];
    this.syncPreview();
    // A form reads the value and validity as soon as the field joins it, before the first render.
    this.syncForm();
  }

  disconnectedCallback(): void {
    for (const stop of this.stopFollowing) {
      stop();
    }
    this.stopFollowing = [];
    this.revokePreview();
    this.dragDepth = 0;
    this.dragging = false;
  }

  /**
   * Takes the disabled state the browser computes: the host's own `disabled` attribute or a
   * disabled fieldset. The browser calls it only when that state changes, so it is kept as given.
   */
  formDisabledCallback(disabled: boolean): void {
    this.formDisabled = disabled;
    this.syncForm();
  }

  /** Restores the default value without emitting an event. */
  formResetCallback(): void {
    this.restore(this.defaults);
    this.dirty = false;
  }

  /** Restores the files the browser saved, without emitting an event. */
  formStateRestoreCallback(state: string | File | FormData | null): void {
    if (state instanceof FormData) {
      this.restore(filesOf(state.getAll(STATE_ENTRY)));
      this.dirty = true;
    }
  }

  componentWillRender(): void {
    setState(this.internals, 'disabled', this.isDisabled());
    // A field disabled in the middle of a drag stops showing it at once.
    setState(this.internals, 'dragover', this.dragging && !this.isDisabled());
    setState(this.internals, 'invalid', this.appearance().state === 'error');
  }

  componentDidRender(): void {
    this.syncInputFiles();
    this.syncForm();
    const target = this.focusAfterRender;
    this.focusAfterRender = undefined;
    if (target === 'input') {
      this.input()?.focus();
    } else if (target !== undefined) {
      this.host.shadowRoot?.querySelectorAll<HTMLElement>('.item .remove')[target]?.focus();
    }
  }

  render(): VNode {
    const { variant, size, state } = this.appearance();
    const labels = this.config.labels.fileInputField;
    const disabled = this.isDisabled();
    const files = this.current;
    const valueState = valueStateOf(files, this.multiple);
    const hasLabel = this.label !== undefined && this.label !== '';
    const hasHint = this.hint !== undefined && this.hint !== '';
    const prompt = this.promptLabel ?? labels.prompt;
    const removeLabel = this.getRemoveLabel ?? labels.remove;
    const locale = resolveLocale(this.locale, this.config.locale, navigator.language);
    const [first] = files;
    return (
      <div
        part="base"
        class={{
          base: true,
          [variant]: true,
          [size]: true,
          [state]: true,
          [valueState]: true,
          disabled,
          dragover: this.dragging && !disabled,
        }}
      >
        {hasLabel ? (
          <label id="label" part="label" class="label" htmlFor="input">
            <span part="label-text">{this.label}</span>
          </label>
        ) : null}
        <input
          id="input"
          class="input"
          type="file"
          accept={this.accept}
          multiple={this.multiple}
          required={this.required}
          disabled={disabled}
          aria-label={this.ariaLabel ?? (hasLabel ? undefined : prompt)}
          aria-invalid={state === 'error' ? 'true' : undefined}
          aria-describedby={hasHint ? 'hint' : undefined}
          onChange={this.onInputChange}
        />
        <div
          part="dropzone"
          class="dropzone"
          onClick={this.onZoneClick}
          onDragEnter={this.onDragEnter}
          onDragOver={this.onDragOver}
          onDragLeave={this.onDragLeave}
          onDrop={this.onDrop}
        >
          {valueState === 'preview' && first !== undefined
            ? [
                <div part="preview" class="preview">
                  <img
                    part="preview-image"
                    class="preview-image"
                    src={this.previewSource}
                    alt={first.name}
                  />
                </div>,
                <div part="actions" class="actions">
                  <ui-button
                    part="replace"
                    class="replace"
                    variant="outline"
                    size="small"
                    disabled={disabled}
                    onClick={this.onReplace}
                  >
                    {this.replaceLabel ?? labels.replace}
                  </ui-button>
                  <ui-icon-button
                    part="remove"
                    class="remove"
                    variant="ghost"
                    size="small"
                    disabled={disabled}
                    label={removeLabel(first.name)}
                    onClick={(event: MouseEvent) => {
                      this.removeFile(0, event);
                    }}
                  >
                    <span slot="icon" innerHTML={iconDelete} />
                  </ui-icon-button>
                </div>,
              ]
            : [
                <span part="icon" class="icon" aria-hidden="true" innerHTML={iconUpload} />,
                <span part="prompt" class="prompt">
                  {prompt}
                </span>,
              ]}
        </div>
        {valueState === 'list' ? (
          <ul part="list" class="list">
            {files.map((file, index) => (
              <li part="item" class="item">
                <span part="thumb" class="thumb">
                  <span
                    part="item-icon"
                    class="item-icon"
                    aria-hidden="true"
                    innerHTML={iconFile}
                  />
                </span>
                <span part="info" class="info">
                  <span part="name" class="name">
                    {file.name}
                  </span>
                  <span part="meta" class="meta">
                    {fileMeta(file, locale)}
                  </span>
                </span>
                <ui-icon-button
                  part="remove"
                  class="remove"
                  variant="ghost"
                  size="small"
                  disabled={disabled}
                  label={removeLabel(file.name)}
                  onClick={(event: MouseEvent) => {
                    this.removeFile(index, event);
                  }}
                >
                  <span slot="icon" innerHTML={iconDelete} />
                </ui-icon-button>
              </li>
            ))}
          </ul>
        ) : null}
        {hasHint ? (
          <span id="hint" part="hint" class="hint">
            <span part="hint-text">{this.hint}</span>
          </span>
        ) : null}
      </div>
    );
  }

  private appearance(): {
    readonly variant: FileInputFieldVariant;
    readonly size: TextFieldSize;
    readonly state: TextFieldState;
  } {
    return {
      variant: oneOf(this.variant, options.variant.options, options.variant.default),
      size: oneOf(this.size, options.size.options, options.size.default),
      state: oneOf(this.state, options.state.options, options.state.default),
    };
  }

  private input(): HTMLInputElement | null {
    return this.host.shadowRoot?.querySelector<HTMLInputElement>('.input') ?? null;
  }

  /** Disabled directly or by the owning fieldset. */
  private isDisabled(): boolean {
    return this.disabled || this.formDisabled;
  }

  /** Sets the value without an event, and gives the form, the input and the preview its files. */
  private restore(files: readonly File[]): void {
    this.current = files;
    this.syncForm();
    this.syncInputFiles();
    this.syncPreview();
  }

  /**
   * Gives the form one entry for each file under the name, and copies the validity of a native
   * file input with the same constraints. The entries carry the name, which Stencil writes on the
   * host only when it renders.
   */
  private syncForm(): void {
    const state = new FormData();
    for (const file of this.current) {
      state.append(STATE_ENTRY, file);
    }
    if (this.name === undefined || this.name === '' || this.current.length === 0) {
      this.internals.setFormValue(null, state);
    } else {
      const entries = new FormData();
      for (const file of this.current) {
        entries.append(this.name, file);
      }
      this.internals.setFormValue(entries, state);
    }
    const detached = document.createElement('input');
    detached.type = 'file';
    detached.multiple = true;
    detached.required = this.required;
    detached.disabled = this.isDisabled();
    detached.files = fileList(this.current);
    copyValidity(this.internals, detached, this.input() ?? undefined);
  }

  /** The rendered input holds the files of the value, which assistive technology reads. */
  private syncInputFiles(): void {
    const input = this.input();
    if (input !== null && !sameFiles(input.files, this.current)) {
      input.files = fileList(this.current);
    }
  }

  /** Keeps one object URL for the previewed image, and revokes it when the image leaves. */
  private syncPreview(): void {
    const [first] = this.current;
    const previewed = valueStateOf(this.current, this.multiple) === 'preview' ? first : undefined;
    if (
      previewed === this.previewFile &&
      (previewed === undefined || this.previewSource !== undefined)
    ) {
      return;
    }
    this.revokePreview();
    if (previewed !== undefined) {
      this.previewFile = previewed;
      this.previewSource = URL.createObjectURL(previewed);
    }
  }

  private revokePreview(): void {
    if (this.previewSource !== undefined) {
      URL.revokeObjectURL(this.previewSource);
    }
    this.previewFile = undefined;
    this.previewSource = undefined;
  }

  /** Adds files from the dialog or a drop, and reports those the constraints reject. */
  private add(incoming: readonly File[], event: globalThis.Event): void {
    const multiple = this.multiple;
    const replacing = !multiple && this.current.length > 0;
    const { value, added, rejections } = admitFiles(this.current, incoming, {
      accept: this.accept,
      maxSize: this.maxSize,
      maxFiles: this.maxFiles,
      multiple,
    });
    if (added.length > 0) {
      this.dirty = true;
      this.restore(value);
      this.valueChange.emit({
        value,
        reason: replacing ? 'replace' : 'add',
        files: added,
        originalEvent: event,
      });
    } else {
      // The dialog wrote its own choice into the input; it gives way to the value.
      this.syncInputFiles();
    }
    if (rejections.length > 0) {
      this.rejected.emit({ rejections, originalEvent: event });
    }
  }

  // Not `remove`: a method of that name would replace Element.remove on the host.
  private removeFile(index: number, event: globalThis.Event): void {
    const file = this.current[index];
    if (this.isDisabled() || file === undefined) {
      return;
    }
    const value = removeAt(this.current, index);
    this.dirty = true;
    this.restore(value);
    const rows = valueStateOf(value, this.multiple) === 'list' ? value.length : 0;
    this.focusAfterRender = index < rows ? index : index > 0 && rows > 0 ? index - 1 : 'input';
    this.valueChange.emit({ value, reason: 'remove', files: [file], originalEvent: event });
  }

  private readonly onInputChange = (event: globalThis.Event): void => {
    const input = event.currentTarget;
    if (input instanceof HTMLInputElement) {
      this.add([...(input.files ?? [])], event);
    }
  };

  private readonly onZoneClick = (event: MouseEvent): void => {
    // A press on the buttons of a preview does what the button does, never what the zone does.
    const onActions =
      event.target instanceof globalThis.Element && event.target.closest('.actions') !== null;
    if (!this.isDisabled() && !onActions) {
      this.input()?.click();
    }
  };

  private readonly onReplace = (): void => {
    if (!this.isDisabled()) {
      this.input()?.click();
    }
  };

  private readonly onDragEnter = (event: DragEvent): void => {
    if (!carriesFiles(event)) {
      return;
    }
    event.preventDefault();
    this.dragDepth += 1;
    this.dragging = !this.isDisabled();
  };

  private readonly onDragOver = (event: DragEvent): void => {
    if (!carriesFiles(event)) {
      return;
    }
    // Without this the browser would open a dropped file in place of the page.
    event.preventDefault();
    if (event.dataTransfer !== null) {
      event.dataTransfer.dropEffect = this.isDisabled() ? 'none' : 'copy';
    }
  };

  private readonly onDragLeave = (event: DragEvent): void => {
    if (!carriesFiles(event)) {
      return;
    }
    this.dragDepth = Math.max(0, this.dragDepth - 1);
    if (this.dragDepth === 0) {
      this.dragging = false;
    }
  };

  private readonly onDrop = (event: DragEvent): void => {
    if (!carriesFiles(event)) {
      return;
    }
    event.preventDefault();
    this.dragDepth = 0;
    this.dragging = false;
    if (!this.isDisabled()) {
      this.add([...(event.dataTransfer?.files ?? [])], event);
    }
  };
}

/** The files of a list a script gave, without anything else it held. */
function filesOf(files: unknown): readonly File[] {
  return Array.isArray(files) ? files.filter((file) => file instanceof File) : [];
}

function fileList(files: readonly File[]): FileList {
  const transfer = new DataTransfer();
  for (const file of files) {
    transfer.items.add(file);
  }
  return transfer.files;
}

function sameFiles(list: FileList | null, files: readonly File[]): boolean {
  const listed = [...(list ?? [])];
  return (
    listed.length === files.length &&
    listed.every((file, index) => {
      const chosen = files[index];
      return chosen !== undefined && isSameFile(file, chosen);
    })
  );
}

function carriesFiles(event: DragEvent): boolean {
  return event.dataTransfer?.types.includes('Files') ?? false;
}

/**
 * Every prop of the specification is a prop of the component. `implements` alone accepts a class
 * that leaves out an optional prop, so a prop added to the specification would go unnoticed.
 */
type _DeclaresEveryProp = Pick<UiFileInputField, keyof FileInputFieldProps<File>>;
