import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { svgMap } from '@mszczygiel-projects/ui-core-icons';
import { getUiCoreConfig } from '@mszczygiel-projects/ui-core-foundations';
import { fileInputFieldStyles } from './file-input-field.styles.js';
import { controlFieldStyles } from '../styles/control-field.styles.js';
import { motionStyles } from '../styles/motion.styles.js';
import { resetStyles } from '../styles/reset.styles.js';

export type FileInputFieldVariant = 'outline' | 'filled';
export type FileInputFieldSize = 'small' | 'default' | 'large';
export type FileInputFieldState = 'default' | 'success' | 'error' | 'disabled';

/** Why a dropped or picked file did not make it into `files`. */
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

/**
 * Form-associated file input with a drag-and-drop zone, validation states, and
 * either an in-place preview or a list of the selected files.
 *
 * The presentation is derived, never set by hand: no files renders the prompt,
 * a single image in single-file mode renders a preview with Replace/Remove,
 * and anything else keeps the drop zone and stacks the files below it.
 *
 * @element ui-file-input-field
 *
 * @example
 * ```html
 * <ui-file-input-field
 *   label="Photo"
 *   description="PNG, SVG — max 2 MB"
 *   accept="image/png,image/svg+xml"
 *   max-size="2097152"
 * ></ui-file-input-field>
 * ```
 *
 * @slot actions - Extra controls appended next to Replace and Remove in the preview.
 *
 * @fires {CustomEvent} ui-change - `detail.files` carries the accepted files after any change.
 * @fires {CustomEvent} ui-reject - `detail.rejections` lists files refused by `accept`, `maxSize` or `maxFiles`.
 * @fires {CustomEvent} ui-remove - `detail.file` and `detail.index` identify the removed file.
 *
 * @cssprop --file-input-radius - Drop zone corner radius. Defaults to `--control-radius`.
 * @cssprop --file-input-preview-max-height - Cap on the in-place preview height.
 */
@customElement('ui-file-input-field')
export class UiFileInputField extends LitElement {
  static readonly formAssociated = true;
  static override styles = [resetStyles, motionStyles, controlFieldStyles, fileInputFieldStyles];

  /**
   * Drop zone style: dashed outline over the page background, or a filled block.
   * @default 'outline'
   */
  @property({ type: String, reflect: true }) variant: FileInputFieldVariant = 'outline';

  /**
   * Drop zone height and typography scale.
   * @default 'default'
   */
  @property({ type: String, reflect: true, attribute: 'data-size' })
  size: FileInputFieldSize = 'default';

  /** Label text rendered above the drop zone. */
  @property({ type: String, reflect: true }) label?: string;

  /**
   * Prompt inside the empty drop zone. Falls back to the configured
   * `labels.fileInput.browse`.
   */
  @property({ type: String, reflect: true }) prompt?: string;

  /** Secondary line under the prompt — accepted formats, size limits, etc. */
  @property({ type: String, reflect: true }) description?: string;

  /** Helper text rendered below the field, linked via `aria-describedby`. */
  @property({ type: String, reflect: true }) hint?: string;

  /**
   * Validation state; `error` also sets `aria-invalid`, `disabled` also disables
   * the input.
   * @default 'default'
   */
  @property({ type: String, reflect: true }) state: FileInputFieldState = 'default';

  /** Native `accept` filter, also enforced on dropped files. */
  @property({ type: String, reflect: true }) accept?: string;

  /** Allows selecting more than one file. */
  @property({ type: Boolean, reflect: true }) multiple = false;

  /** Largest accepted file size in bytes. */
  @property({ type: Number, attribute: 'max-size' }) maxSize?: number;

  /** Largest accepted number of files. */
  @property({ type: Number, attribute: 'max-files' }) maxFiles?: number;

  /** Currently selected files. Property only — a `File` cannot cross an attribute. */
  @property({ attribute: false }) files: File[] = [];

  /** Form field name used on submission. */
  @property({ type: String }) name?: string;

  /** Disables the whole field. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Marks the field as required for form submission. */
  @property({ type: Boolean, reflect: true }) required = false;

  /** Label of the Replace button. */
  @property({ type: String, attribute: 'replace-label' }) replaceLabel?: string;

  /** Accessible name of a file's remove button. */
  @property({ attribute: false }) removeLabel?: (fileName: string) => string;

  /** Formats the byte count shown next to a file name. */
  @property({ attribute: false }) formatSize?: (bytes: number) => string;

  @state() private _formDisabled = false;

  @query('.input') private _inputEl!: HTMLInputElement | null;

  private _internals: ElementInternals;
  private _previewUrls = new Map<File, string>();
  /** Nested dragenter/dragleave pairs fire per child; counting keeps the state stable. */
  private _dragDepth = 0;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  override connectedCallback() {
    super.connectedCallback();
    this._syncFormValue();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._revokeAllPreviews();
  }

  private get _isDisabled(): boolean {
    return this.disabled || this.state === 'disabled' || this._formDisabled;
  }

  /** Which presentation to render — the code twin of Figma's `Value` axis. */
  get mode(): FileInputFieldMode {
    if (this.files.length === 0) return 'empty';
    if (!this.multiple && this.files.length === 1 && this.files[0].type.startsWith('image/')) {
      return 'filled';
    }
    return 'list';
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has('files') || changed.has('disabled') || changed.has('state')) {
      this._syncFormValue();
    }
    if (changed.has('files')) this._revokeStalePreviews();
    this.setAttribute('data-value', this.mode);
  }

  formDisabledCallback(disabled: boolean) {
    this._formDisabled = disabled;
    this._syncFormValue();
  }

  formResetCallback() {
    this._setFiles([]);
  }

  private _syncFormValue() {
    if (this._isDisabled || this.files.length === 0 || !this.name) {
      this._internals.setFormValue(null);
      return;
    }
    const data = new FormData();
    for (const file of this.files) data.append(this.name, file);
    this._internals.setFormValue(data);
  }

  private _previewUrl(file: File): string {
    let url = this._previewUrls.get(file);
    if (!url) {
      url = URL.createObjectURL(file);
      this._previewUrls.set(file, url);
    }
    return url;
  }

  private _revokeStalePreviews() {
    const live = new Set(this.files);
    for (const [file, url] of this._previewUrls) {
      if (live.has(file)) continue;
      URL.revokeObjectURL(url);
      this._previewUrls.delete(file);
    }
  }

  private _revokeAllPreviews() {
    for (const url of this._previewUrls.values()) URL.revokeObjectURL(url);
    this._previewUrls.clear();
  }

  private _validate(incoming: File[]): {
    accepted: File[];
    rejections: FileInputFieldRejection[];
  } {
    const accepted: File[] = [];
    const rejections: FileInputFieldRejection[] = [];
    const rules = this.accept?.split(',').filter((entry) => entry.trim()) ?? [];
    const kept = this.multiple ? [...this.files] : [];

    for (const file of incoming) {
      if (rules.length && !rules.some((rule) => matchesAcceptEntry(file, rule))) {
        rejections.push({ file, reason: 'type' });
        continue;
      }
      if (this.maxSize !== undefined && file.size > this.maxSize) {
        rejections.push({ file, reason: 'size' });
        continue;
      }
      if (this.maxFiles !== undefined && kept.length + accepted.length >= this.maxFiles) {
        rejections.push({ file, reason: 'count' });
        continue;
      }
      accepted.push(file);
      if (!this.multiple) break;
    }
    return { accepted, rejections };
  }

  private _setFiles(files: File[]) {
    this.files = files;
    this._syncFormValue();
    this.dispatchEvent(
      new CustomEvent('ui-change', {
        detail: { files: this.files },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _ingest(incoming: File[]) {
    if (this._isDisabled || incoming.length === 0) return;
    const { accepted, rejections } = this._validate(incoming);
    if (rejections.length) {
      this.dispatchEvent(
        new CustomEvent('ui-reject', { detail: { rejections }, bubbles: true, composed: true }),
      );
    }
    if (!accepted.length) return;
    this._setFiles(this.multiple ? [...this.files, ...accepted] : accepted);
  }

  private _openPicker() {
    if (this._isDisabled) return;
    this._inputEl?.click();
  }

  private _onInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this._ingest(Array.from(input.files ?? []));
    // Lets the same file be picked again right after it was removed.
    input.value = '';
  }

  private _onDragOver(event: DragEvent) {
    if (this._isDisabled) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  }

  private _onDragEnter(event: DragEvent) {
    if (this._isDisabled) return;
    event.preventDefault();
    this._dragDepth += 1;
    this.toggleAttribute('data-dragover', true);
  }

  private _onDragLeave() {
    if (this._isDisabled) return;
    this._dragDepth = Math.max(0, this._dragDepth - 1);
    if (this._dragDepth === 0) this.toggleAttribute('data-dragover', false);
  }

  private _onDrop(event: DragEvent) {
    if (this._isDisabled) return;
    event.preventDefault();
    this._dragDepth = 0;
    this.toggleAttribute('data-dragover', false);
    this._ingest(Array.from(event.dataTransfer?.files ?? []));
  }

  private _onRemove(file: File, index: number, event: Event) {
    event.stopPropagation();
    if (this._isDisabled) return;
    const next = this.files.filter((_, i) => i !== index);
    this.dispatchEvent(
      new CustomEvent('ui-remove', { detail: { file, index }, bubbles: true, composed: true }),
    );
    this._setFiles(next);
  }

  private _onReplace(event: Event) {
    event.stopPropagation();
    this._openPicker();
  }

  private _describedBy(): string | typeof nothing {
    // The description only exists in the prompt, which the preview replaces —
    // pointing aria-describedby at an id that is not in the tree says nothing.
    const ids = [
      this.description && this.mode !== 'filled' ? 'description' : '',
      this.hint ? 'hint' : '',
    ].filter(Boolean);
    return ids.length ? ids.join(' ') : nothing;
  }

  private _meta(file: File): string {
    const format = this.formatSize ?? defaultFormatSize;
    const dot = file.name.lastIndexOf('.');
    const extension = dot > 0 ? file.name.slice(dot + 1).toUpperCase() : '';
    const size = format(file.size);
    return extension ? `${extension} · ${size}` : size;
  }

  private _renderPrompt() {
    const labels = getUiCoreConfig().labels.fileInput;
    return html`
      <span class="icon">${unsafeSVG(svgMap['icon-upload'])}</span>
      <p class="prompt">${this.prompt ?? labels.browse}</p>
      ${this.description
        ? html`<p id="description" class="description">${this.description}</p>`
        : nothing}
    `;
  }

  private _renderPreview() {
    const labels = getUiCoreConfig().labels.fileInput;
    const file = this.files[0];
    const removeLabel = (this.removeLabel ?? labels.remove)(file.name);
    return html`
      <span class="preview">
        <img src=${this._previewUrl(file)} alt=${file.name} />
      </span>
      <span class="actions">
        <button
          type="button"
          class="action"
          ?disabled=${this._isDisabled}
          @click=${this._onReplace}
        >
          ${this.replaceLabel ?? labels.replace}
        </button>
        <button
          type="button"
          class="action action--icon"
          aria-label=${removeLabel}
          ?disabled=${this._isDisabled}
          @click=${(e: Event) => this._onRemove(file, 0, e)}
        >
          ${unsafeSVG(svgMap['icon-delete'])}
        </button>
        <slot name="actions"></slot>
      </span>
    `;
  }

  private _renderList() {
    const labels = getUiCoreConfig().labels.fileInput;
    const resolveRemove = this.removeLabel ?? labels.remove;
    return html`
      <ul class="list">
        ${this.files.map(
          (file, index) => html`
            <li class="item">
              <span class="thumb">
                ${file.type.startsWith('image/')
                  ? html`<img src=${this._previewUrl(file)} alt="" />`
                  : unsafeSVG(svgMap['icon-file'])}
              </span>
              <span class="info">
                <span class="name">${file.name}</span>
                <span class="meta">${this._meta(file)}</span>
              </span>
              <button
                type="button"
                class="action action--icon"
                aria-label=${resolveRemove(file.name)}
                ?disabled=${this._isDisabled}
                @click=${(e: Event) => this._onRemove(file, index, e)}
              >
                ${unsafeSVG(svgMap['icon-delete'])}
              </button>
            </li>
          `,
        )}
      </ul>
    `;
  }

  override render() {
    const mode = this.mode;
    return html`
      ${this.label ? html`<label class="label" for="input">${this.label}</label>` : nothing}
      <input
        id="input"
        class="input"
        type="file"
        accept=${this.accept ?? nothing}
        name=${this.name ?? nothing}
        ?multiple=${this.multiple}
        ?disabled=${this._isDisabled}
        ?required=${this.required}
        aria-invalid=${this.state === 'error' ? 'true' : nothing}
        aria-describedby=${this._describedBy()}
        @change=${this._onInputChange}
      />
      <div
        class="dropzone"
        @click=${this._openPicker}
        @dragenter=${this._onDragEnter}
        @dragover=${this._onDragOver}
        @dragleave=${this._onDragLeave}
        @drop=${this._onDrop}
      >
        ${mode === 'filled' ? this._renderPreview() : this._renderPrompt()}
      </div>
      ${mode === 'list' ? this._renderList() : nothing}
      ${this.hint ? html`<p id="hint" class="hint">${this.hint}</p>` : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-file-input-field': UiFileInputField;
  }
}
