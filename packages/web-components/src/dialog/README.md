# `<ui-dialog>`

Modal overlay built on the native `<dialog>` element. Rendered in the browser **top layer** via `showModal()`, so no z-index is involved — unlike `<ui-popover>`, which needs a `--z-overlay` fallback. Focus trapping, inerting the rest of the page, and Escape all come from the platform.

Fully **controlled**: the component never mutates its own `open` state. Escape, backdrop clicks and the close button only dispatch `open-change` requests — the consumer owns the state and writes `open` back.

## Basic usage

```html
<ui-dialog open>
  <span slot="title">Delete account?</span>
  <span slot="description">This action cannot be undone.</span>
  <p>Everything associated with the account is removed immediately.</p>
  <div slot="footer">
    <ui-button variant="outline">Cancel</ui-button>
    <ui-button variant="danger">Delete</ui-button>
  </div>
</ui-dialog>
<script>
  const dialog = document.querySelector('ui-dialog');
  dialog.addEventListener('open-change', (e) => (dialog.open = e.detail.open));
</script>
```

## Props

| Property         | Attribute          | Type                                             | Default   |
| ---------------- | ------------------ | ------------------------------------------------ | --------- |
| `open`           | `open`             | boolean (controlled)                             | `false`   |
| `size`           | `data-size`        | `small` / `medium` / `large` / `fullscreen`      | `medium`  |
| `variant`        | `variant`          | `default` / `alert`                              | `default` |
| `dismissOn`      | `dismiss-on`       | `outside-click` / `escape` / `both` / `none`     | `both`    |
| `hasCloseButton` | `has-close-button` | boolean                                          | `true`    |
| `label`          | `label`            | string — accessible name when no `title` slot    | —         |
| `dragToDismiss`  | `drag-to-dismiss`  | boolean — flick the sheet away (sheet mode only) | `false`   |

## Events

- `open-change` — `detail: { open: boolean, reason: 'close-button' | 'outside-click' | 'escape' | 'drag' }`. The only way the component asks for a state change; it never applies it itself.

## Slots

- `title` — accessible name and visible heading
- `description` — optional supporting text
- default — body content; scrolls on its own when it outgrows the panel
- `footer` — action buttons; stack full-width below 48rem

## The alert variant

`variant="alert"` switches the role to `alertdialog` and **refuses to close on a backdrop click**, so a destructive choice cannot be dismissed by accident. Escape still works — WAI-ARIA expects it, and it is one of the few dismissal paths reachable from a keyboard. Pair it with `has-close-button="false"` so the only ways out are the explicit actions.

## Sizes

`small` 400px · `medium` 560px · `large` 800px, each from `--dialog-{size}-max-width`. `fullscreen` fills the viewport and is the only size with **no max-width token**, because it is viewport-driven (`100dvh` / `100%`) rather than token-driven.

## Responsive behaviour

Below **48rem** the dialog becomes a bottom sheet: full width, only the top corners rounded, anchored to the bottom edge, sliding up on open, with footer actions stacked full-width. At or above 48rem it is centred at the max-width for its size.

The breakpoint is hardcoded as `48rem` with a comment, mirroring [`pagination.styles.ts`](../pagination/pagination.styles.ts) — media queries cannot read CSS custom properties. It deliberately does **not** come from the Sizes collection, whose Desktop mode only starts at 80rem.

## Drag to dismiss

`drag-to-dismiss` lets the sheet be flicked away downwards. It is **opt-in and sheet-only** — above 48rem both the gesture and its grabber are absent, because a drag affordance that does nothing is worse than none at all.

The gesture starts from the grabber or the header, never from the body: a drag beginning in scrollable content has to scroll, or the content becomes unreachable. Release dismisses if the sheet travelled past 25% of its height, or if the flick exceeded 0.5 px/ms measured over the last 100 ms; anything else springs back. Velocity is averaged over that trailing window rather than taken from the final pointer sample, so a jitter just before release cannot close the sheet by accident.

It is **never the only way out.** A pointer gesture is unreachable by keyboard and screen reader, so Escape, the backdrop and the close button all remain live. Treat it as polish, not as a dismissal path you can rely on.

The gesture lives in [`DragDismissController`](../controllers/drag-dismiss.ts), which is direction-aware (`down` / `up` / `left` / `right`) and exported from the package — a future Drawer can reuse it by dragging `left` or `right` instead.

## Scrolling and separators

The body scrolls while the header and footer stay put. Separators appear **only on the edges the content actually runs past** — a short dialog shows none. This is driven from JS (`data-scroll-start` / `data-scroll-end` on the host), since CSS cannot observe scroll offset.

## Page scroll

`showModal()` does not portably stop the page behind from scrolling, so the component sets `overflow: hidden` on `<html>` while open. The lock is **reference-counted at module level**, so nested dialogs do not release it early.

## Accessibility

- `role="dialog"` (or `alertdialog`), with `aria-modal` supplied by `showModal()`
- `aria-labelledby` points at the title; without a `title` slot, set `label` for an `aria-label`
- `aria-describedby` points at the description when present
- Initial focus is native — mark an element `autofocus` to choose it, otherwise the first focusable element wins
- Focus trapping and returning focus on close are handled by the platform

## CSS parts & tokens

- `::part(panel)`, `::part(header)`, `::part(body)`, `::part(footer)`
- Surface: `--color-dialog-background`, `--color-dialog-border`, `--color-dialog-divider`
- Scrim: `--color-background-overlay` on `::backdrop`
- Geometry: `--dialog-radius`, `--dialog-sheet-radius`, `--dialog-border-width`, `--dialog-margin`, `--dialog-padding-inline`, `--dialog-padding-stack`, `--dialog-gap`, `--dialog-header-gap`, `--dialog-footer-gap`
- Typography: `--dialog-title-*`, `--dialog-description-*`, `--typography-body-*`

All colours are bound from the Surfaces layer, so a dialog inside a `data-surface` wrapper adapts automatically.
