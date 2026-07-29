# `<Dialog>`

Modal overlay built on the native `<dialog>` element. Rendered in the browser **top layer** via `showModal()`, so no z-index and no portal are involved — the element stays where it is in the tree, exactly like `<Popover>`. Focus trapping, inerting the rest of the page, and Escape all come from the platform.

Fully **controlled**: the component never owns its open state. Escape, backdrop clicks and the close button only call `onOpenChange` — the consumer owns the state and passes `open` back down.

## Basic usage

```tsx
const [open, setOpen] = useState(false);

<Dialog
  open={open}
  onOpenChange={(detail) => setOpen(detail.open)}
  title="Delete account?"
  description="This action cannot be undone."
  footer={
    <>
      <Button variant="outline" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button variant="danger" onClick={confirm}>
        Delete
      </Button>
    </>
  }
>
  Everything associated with the account is removed immediately.
</Dialog>;
```

## Props

| Prop             | Type                                              | Default   |
| ---------------- | ------------------------------------------------- | --------- |
| `open`           | boolean (controlled)                              | `false`   |
| `size`           | `small` / `medium` / `large` / `fullscreen`       | `medium`  |
| `variant`        | `default` / `alert`                               | `default` |
| `dismissOn`      | `outside-click` / `escape` / `both` / `none`      | `both`    |
| `hasCloseButton` | boolean                                           | `true`    |
| `label`          | string — accessible name when no `title` is given | —         |
| `dragToDismiss`  | boolean — flick the sheet away (sheet mode only)  | `false`   |
| `title`          | `ReactNode` — heading and accessible name         | —         |
| `description`    | `ReactNode` — supporting text                     | —         |
| `footer`         | `ReactNode` — action buttons                      | —         |
| `children`       | `ReactNode` — body content                        | —         |
| `onOpenChange`   | `(detail: { open, reason }) => void`              | —         |
| `className`      | string — appended to the root                     | —         |
| `style`          | `CSSProperties` — forwarded to the root           | —         |

`reason` is `'close-button' | 'outside-click' | 'escape' | 'drag'`. The Lit twin takes the same content through slots (`title`, `description`, `footer`, default) instead of props.

## Drag to dismiss

`dragToDismiss` lets the sheet be flicked away downwards. It is **opt-in and sheet-only** — above 48rem both the gesture and its grabber are absent, because a drag affordance that does nothing is worse than none at all.

The gesture starts from the grabber or the header, never from the body: a drag beginning in scrollable content has to scroll, or the content becomes unreachable. Release dismisses if the sheet travelled past 25% of its height, or if the flick exceeded 0.5 px/ms measured over the last 100 ms; anything else springs back. Velocity is averaged over that trailing window rather than taken from the final pointer sample, so a jitter just before release cannot close the sheet by accident.

It is **never the only way out.** A pointer gesture is unreachable by keyboard and screen reader, so Escape, the backdrop and the close button all remain live. Treat it as polish, not as a dismissal path you can rely on.

The gesture lives in [`useDragDismiss`](../hooks/useDragDismiss.ts), which is direction-aware (`down` / `up` / `left` / `right`) and exported from the package — a future Drawer can reuse it by dragging `left` or `right` instead.

## The alert variant

`variant="alert"` switches the role to `alertdialog` and **refuses to close on a backdrop click**, so a destructive choice cannot be dismissed by accident. Escape still works — WAI-ARIA expects it, and it is one of the few dismissal paths reachable from a keyboard. Pair it with `hasCloseButton={false}` so the only ways out are the explicit actions.

## Sizes

`small` 400px · `medium` 560px · `large` 800px, each from `--dialog-{size}-max-width`. `fullscreen` fills the viewport and is the only size with **no max-width token**, because it is viewport-driven rather than token-driven.

## Responsive behaviour

Below **48rem** the dialog becomes a bottom sheet: full width, only the top corners rounded, anchored to the bottom edge, sliding up on open, with footer actions stacked full-width.

The breakpoint is hardcoded as `48rem` with a comment, mirroring [`Pagination.css`](../Pagination/Pagination.css) — media queries cannot read CSS custom properties. It deliberately does **not** come from the Sizes collection, whose Desktop mode only starts at 80rem.

There is no drag-to-dismiss. Escape, backdrop tap and the close button are the complete set of dismissal paths, and unlike a drag gesture all three are reachable by keyboard and screen reader.

## Scrolling and separators

The body scrolls while the header and footer stay put. Separators appear **only on the edges the content actually runs past** — a short dialog shows none.

## Page scroll

`showModal()` does not portably stop the page behind from scrolling, so the component sets `overflow: hidden` on `<html>` while open. The lock is **reference-counted at module level**, so nested dialogs do not release it early, and it is released on unmount even if the dialog was still open.

## Testing note

jsdom ships `HTMLDialogElement` as an empty subclass — no `showModal`, no `close`, no `cancel` event. `src/test-setup.ts` installs a minimal stand-in that models only the `open` attribute and the `close` event. Genuine modal behaviour (top layer, focus trap, inerting, Escape) is untestable in jsdom by design and is covered by the web-components suite, which runs on real Chromium.

## Accessibility

- `role="dialog"` (or `alertdialog`), with `aria-modal` supplied by `showModal()`
- `aria-labelledby` points at the title; without a `title`, pass `label` for an `aria-label`
- `aria-describedby` points at the description when present
- Initial focus is native — mark an element `autoFocus` to choose it, otherwise the first focusable element wins

## Tokens

Surface `--color-dialog-background` / `--color-dialog-border` / `--color-dialog-divider`, scrim `--color-background-overlay` on `::backdrop`, geometry `--dialog-*`, typography `--dialog-title-*` / `--dialog-description-*` / `--typography-body-*`.

All colours are bound from the Surfaces layer, so a dialog inside a `data-surface` wrapper adapts automatically.
