# `<FileInputField>`

File input with a drag-and-drop zone. Wraps a real, visually hidden `<input type="file">` — the picker, the keyboard behaviour and the accessible name all come from the platform, not from ARIA emulation.

## Basic usage

```tsx
const [files, setFiles] = useState<File[]>([]);

<FileInputField
  label="Photo"
  description="PNG, SVG — max 2 MB"
  accept="image/png,image/svg+xml"
  maxSize={2 * 1024 * 1024}
  files={files}
  onChange={setFiles}
/>;
```

Omit `files` to let the component own the selection; pass `defaultFiles` for a starting value.

## Props

| Prop           | Type                                              | Default   |
| -------------- | ------------------------------------------------- | --------- |
| `variant`      | `outline` / `filled`                              | `outline` |
| `size`         | `small` / `default` / `large`                     | `default` |
| `label`        | string                                            | —         |
| `prompt`       | string — text inside the empty zone               | config    |
| `description`  | string — second line under the prompt             | —         |
| `hint`         | string — helper text below the field              | —         |
| `state`        | `default` / `success` / `error` / `disabled`      | `default` |
| `accept`       | string — native filter, also applied to drops     | —         |
| `multiple`     | boolean                                           | `false`   |
| `maxSize`      | number — bytes                                    | —         |
| `maxFiles`     | number                                            | —         |
| `files`        | `File[]` — makes the component controlled         | —         |
| `defaultFiles` | `File[]` — uncontrolled starting value            | `[]`      |
| `onChange`     | `(files: File[]) => void`                         | —         |
| `onReject`     | `(rejections: FileInputFieldRejection[]) => void` | —         |
| `onRemove`     | `(file: File, index: number) => void`             | —         |
| `replaceLabel` | string                                            | config    |
| `removeLabel`  | `(fileName: string) => string`                    | config    |
| `formatSize`   | `(bytes: number) => string`                       | built-in  |
| `actions`      | `ReactNode` — extra controls in the preview       | —         |

## The presentation is derived, never set

There is no `mode` prop. The field picks one of three presentations from the selection itself, and reflects the result as `data-value` so CSS and tests can see it:

| `data-value` | When                                           | What renders                              |
| ------------ | ---------------------------------------------- | ----------------------------------------- |
| `empty`      | no files                                       | icon, prompt, description                 |
| `filled`     | single-file mode, one file, and it is an image | in-place preview + Replace / Remove       |
| `list`       | anything else — multiple, or a non-image file  | the drop zone stays, files stack below it |

This mirrors the `Value` axis of the Figma Component Set. A non-image single file falls to `list` on purpose: there is nothing to preview, and a file name with its size is more useful than a generic glyph blown up to preview size.

## Validation is reported, not displayed

`accept`, `maxSize` and `maxFiles` decide what enters the selection, and everything refused is reported through `onReject`. The component never renders an error message of its own — the wording of "file too large" depends on the app's tone and language, so `state="error"` plus `hint` stay the consumer's call.

## Object URLs are owned by the component

Image previews need `URL.createObjectURL`. The component creates one per image in the current selection and revokes it when the selection changes or the component unmounts, so a consumer swapping files repeatedly does not leak blobs. Do not pass URLs in yourself — pass `File` objects and let the field manage the lifetime.

## Tokens

Field chrome rides on the shared `control/*` family, exactly like `<TextField>` — the root carries `ui-control-field*` classes so `styles/control-field.css` supplies the colour aliases. Only what a drop zone adds is component-specific:

| Visual property        | Token                                    |
| ---------------------- | ---------------------------------------- |
| Zone geometry          | `--file-input-{small-\|\|large-}*`       |
| Drag-over highlight    | `--color-file-input-dropzone-*-dragover` |
| File row               | `--color-file-input-item-*`              |
| Preview / thumb canvas | `--color-file-input-preview-background`  |

Two of those are **translucent tints**, not opaque colours: `--color-file-input-dropzone-background-dragover` and `--color-file-input-item-background-hover`. They are composited on top of the existing background with a one-colour `linear-gradient`, never assigned to `background-color` — substituting them directly would replace the opaque background and make a `filled` zone get _lighter_ on hover.
