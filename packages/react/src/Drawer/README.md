# `<Drawer>`

Edge-anchored modal panel built on the native `<dialog>` element. Rendered in the browser **top layer** via `showModal()`, so no z-index is involved. Focus trapping, inerting the rest of the page, and Escape all come from the platform.

Fully **controlled**: the component never owns its open state. Escape, backdrop clicks, the close button and the drag gesture only call `onOpenChange` — the consumer owns the state and passes `open` back down.

## Basic usage

```tsx
const [open, setOpen] = useState(false);

<Button onClick={() => setOpen(true)}>Filters</Button>
<Drawer
  open={open}
  onOpenChange={(detail) => setOpen(detail.open)}
  placement="right"
  label="Filters"
>
  <h2>Filters</h2>
  <p>Anything at all — the drawer imposes no structure.</p>
</Drawer>
```

## Props

| Prop              | Type                                              | Default |
| ----------------- | ------------------------------------------------- | ------- |
| `open`            | `boolean` (controlled)                            | `false` |
| `placement`       | `'right' \| 'left' \| 'bottom'`                   | `right` |
| `dismissOn`       | `'outside-click' \| 'escape' \| 'both' \| 'none'` | `both`  |
| `hasCloseButton`  | `boolean`                                         | `true`  |
| `label`           | `string` — accessible name of the drawer          | —       |
| `closeLabel`      | `string` — accessible name of the close button    | config  |
| `dragToDismiss`   | `boolean` — flick the sheet away (bottom only)    | `false` |
| `aria-labelledby` | `string` — id of your own heading                 | —       |
| `children`        | `ReactNode` — drawer content                      | —       |
| `onOpenChange`    | `(detail) => void`                                | —       |
| `className`       | `string`                                          | —       |
| `style`           | `CSSProperties` — positioning only                | —       |

`onOpenChange` receives `{ open: boolean, reason: 'close-button' | 'outside-click' | 'escape' | 'drag' }`. It is the only way the component asks for a state change; it never applies it itself.

## A deliberately plain container

Unlike [`<Dialog>`](../Dialog/README.md), the drawer has **no title, description or footer props**. It owns the surface, the scroll and the close affordance, and nothing else — headings, toolbars and action rows are yours to compose as children.

That has one consequence worth stating plainly: **there is nothing for `role="dialog"` to be named by unless you name it.** Pass `label`, or `aria-labelledby` pointing at your own heading. A drawer with neither is an unnamed dialog, which screen readers announce as just "dialog".

## Placements

| Placement | Geometry                                            | Bordered edge |
| --------- | --------------------------------------------------- | ------------- |
| `right`   | full viewport height, `--drawer-width` wide         | left          |
| `left`    | full viewport height, `--drawer-width` wide         | right         |
| `bottom`  | full width, **hugs its content**, capped at `90dvh` | top           |

There is **no size prop**. Side drawers have one standard width; override `--drawer-width` (globally or per instance) when a particular drawer needs another. The bottom sheet is content-driven by design, so a height preset would only fight the content.

Only the sheet's top corners are rounded (`--drawer-radius`). Side drawers sit flush against their viewport edge and carry no radius.

## Responsive behaviour

Below **48rem** a side drawer keeps its edge and its slide-in animation, and only widens to the full viewport. It deliberately does **not** turn into a bottom sheet.

The breakpoint is hardcoded as `48rem` with a comment — media queries cannot read CSS custom properties.

## Drag to dismiss

`dragToDismiss` lets a **bottom sheet** be flicked away downwards. It is opt-in and bottom-only: `right` and `left` render no grabber and the gesture stays inert there.

The gesture starts from the grabber or the dismiss row, never from the body: a drag beginning in scrollable content has to scroll, or the content becomes unreachable. Release dismisses if the sheet travelled past 25% of its height, or if the flick exceeded 0.5 px/ms measured over the last 100 ms.

It is **never the only way out** — Escape, the backdrop and the close button all remain live. The gesture lives in [`useDragDismiss`](../hooks/useDragDismiss.ts), shared with `<Dialog>`.

## Animation

The entry offset rides on `transform`, while the drag gesture writes to `translate` — kept on separate properties deliberately, since sharing one would make the gesture and the entry animation overwrite each other.

## Page scroll

`showModal()` does not portably stop the page behind from scrolling, so the component sets `overflow: hidden` on `<html>` while open. The lock is **reference-counted at module level** and shared with `<Dialog>`.

## Accessibility

- `role="dialog"`, with `aria-modal` supplied by `showModal()`
- Name it with `label` or `aria-labelledby` — see above
- Initial focus is native — mark an element `autoFocus` to choose it
- Focus trapping and returning focus on close are handled by the platform
- The grabber is `aria-hidden` and decorative

## Tokens

- Surface: `--color-drawer-background`, `--color-drawer-border`, `--color-drawer-grabber`
- Scrim: `--color-background-overlay` on `::backdrop`
- Geometry: `--drawer-width`, `--drawer-radius`, `--drawer-border-width`, `--drawer-padding-inline`, `--drawer-padding-stack`, `--drawer-gap`, `--drawer-grabber-*`

All colours are bound from the Surfaces layer, so a drawer inside a `data-surface` wrapper adapts automatically.

> **Known contrast gap.** `--color-drawer-grabber` resolves to `text/muted` — 2.45–3.85:1 against the drawer background on light surfaces, below the 3:1 that WCAG 1.4.11 asks of a control affordance. Accepted because the grabber is decorative and `aria-hidden`, and the gesture is never the only way out. The real fix is a neutral token in the 3–4.5:1 band, which Foundations currently lacks.
