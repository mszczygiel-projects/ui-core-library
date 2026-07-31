# `<ui-file-input-field>`

Form-associated file input with a drag-and-drop zone. Wraps a real, visually hidden `<input type="file">` — the picker, the keyboard behaviour and the accessible name all come from the platform, not from ARIA emulation.

## Basic usage

```html
<ui-file-input-field
  label="Photo"
  description="PNG, SVG — max 2 MB"
  accept="image/png,image/svg+xml"
  max-size="2097152"
></ui-file-input-field>
<script>
  const field = document.querySelector('ui-file-input-field');
  field.addEventListener('ui-change', (e) => console.log(e.detail.files));
</script>
```

## Props

| Property       | Attribute       | Type                                           | Default   |
| -------------- | --------------- | ---------------------------------------------- | --------- |
| `variant`      | `variant`       | `outline` / `filled`                           | `outline` |
| `size`         | `data-size`     | `small` / `default` / `large`                  | `default` |
| `label`        | `label`         | string                                         | —         |
| `prompt`       | `prompt`        | string — text inside the empty zone            | config    |
| `description`  | `description`   | string — second line under the prompt          | —         |
| `hint`         | `hint`          | string — helper text below the field           | —         |
| `state`        | `state`         | `default` / `success` / `error` / `disabled`   | `default` |
| `accept`       | `accept`        | string — native filter, also applied to drops  | —         |
| `multiple`     | `multiple`      | boolean                                        | `false`   |
| `maxSize`      | `max-size`      | number — bytes                                 | —         |
| `maxFiles`     | `max-files`     | number                                         | —         |
| `files`        | —               | `File[]` — property only                       | `[]`      |
| `replaceLabel` | `replace-label` | string — label of the Replace button           | config    |
| `removeLabel`  | —               | `(fileName: string) => string` — property only | config    |
| `formatSize`   | —               | `(bytes: number) => string` — property only    | built-in  |

## Events

- `ui-change` — `detail: { files: File[] }`. The full selection after any change, including removals.
- `ui-reject` — `detail: { rejections: { file: File, reason: 'type' | 'size' | 'count' }[] }`. Files refused by `accept`, `maxSize` or `maxFiles`.
- `ui-remove` — `detail: { file: File, index: number }`. Fired before the file leaves the selection.

## Slots

- `actions` — extra controls appended next to Replace and Remove in the preview

## The presentation is derived, never set

There is no `mode` prop. The field picks one of three presentations from the selection itself, and reflects the result as `data-value` so CSS and tests can see it:

| `data-value` | When                                           | What renders                              |
| ------------ | ---------------------------------------------- | ----------------------------------------- |
| `empty`      | no files                                       | icon, prompt, description                 |
| `filled`     | single-file mode, one file, and it is an image | in-place preview + Replace / Remove       |
| `list`       | anything else — multiple, or a non-image file  | the drop zone stays, files stack below it |

This mirrors the `Value` axis of the Figma Component Set. A non-image single file falls to `list` on purpose: there is nothing to preview, and a file name with its size is more useful than a generic glyph blown up to preview size.

## Validation is reported, not displayed

`accept`, `maxSize` and `maxFiles` decide what enters the selection, and everything refused is reported through `ui-reject`. The component never renders an error message of its own — the wording of "file too large" depends on the app's tone and language, so `state="error"` plus `hint` stay the consumer's call.

## Variants

`outline` draws a **dashed** border over the page background; `filled` is a solid block with no visible edge. The dash is the drop affordance, which is why it is tied to the variant rather than exposed separately — CSS `border-style` cannot control dash length anyway, so a token would promise more than it delivers.

## Tokens

Field chrome rides on the shared `control/*` family, exactly like `<ui-text-field>`. Only what a drop zone adds is component-specific:

| Visual property        | Token                                    |
| ---------------------- | ---------------------------------------- |
| Zone geometry          | `--file-input-{small-\|\|large-}*`       |
| Drag-over highlight    | `--color-file-input-dropzone-*-dragover` |
| File row               | `--color-file-input-item-*`              |
| Preview / thumb canvas | `--color-file-input-preview-background`  |

Two of those are **translucent tints**, not opaque colours: `--color-file-input-dropzone-background-dragover` and `--color-file-input-item-background-hover`. They are composited on top of the existing background with a one-colour `linear-gradient`, never assigned to `background-color` — substituting them directly would replace the opaque background and make a `filled` zone get _lighter_ on hover.
