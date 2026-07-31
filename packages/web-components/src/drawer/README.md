# `<ui-drawer>`

Edge-anchored modal panel built on the native `<dialog>` element. Rendered in the browser **top layer** via `showModal()`, so no z-index is involved — unlike `<ui-popover>`, which needs a `--z-overlay` fallback. Focus trapping, inerting the rest of the page, and Escape all come from the platform.

Fully **controlled**: the component never mutates its own `open` state. Escape, backdrop clicks, the close button and the drag gesture only dispatch `open-change` requests — the consumer owns the state and writes `open` back.

## Basic usage

```html
<ui-drawer open placement="right" label="Filters">
  <h2>Filters</h2>
  <p>Anything at all — the drawer imposes no structure.</p>
</ui-drawer>
<script>
  const drawer = document.querySelector('ui-drawer');
  drawer.addEventListener('open-change', (e) => (drawer.open = e.detail.open));
</script>
```

## Props

| Property         | Attribute          | Type                                            | Default   |
| ---------------- | ------------------ | ----------------------------------------------- | --------- |
| `open`           | `open`             | boolean (controlled)                            | `false`   |
| `placement`      | `placement`        | `right` / `left` / `bottom`                     | `right`   |
| `dismissOn`      | `dismiss-on`       | `outside-click` / `escape` / `both` / `none`    | `both`    |
| `hasCloseButton` | `has-close-button` | boolean                                         | `true`    |
| `label`          | `label`            | string — accessible name of the drawer          | —         |
| `closeLabel`     | `close-label`      | string — accessible name of the close button    | config    |
| `dragToDismiss`  | `drag-to-dismiss`  | boolean — flick the sheet away (bottom only)    | `false`   |

## Events

- `open-change` — `detail: { open: boolean, reason: 'close-button' | 'outside-click' | 'escape' | 'drag' }`. The only way the component asks for a state change; it never applies it itself.

## Slots

- default — drawer content; scrolls on its own when it outgrows the panel

## A deliberately plain container

Unlike [`<ui-dialog>`](../dialog/README.md), the drawer has **no title, description or footer regions**. It owns the surface, the scroll and the close affordance, and nothing else — headings, toolbars and action rows are the consumer's to compose in the default slot.

That has one consequence worth stating plainly: **there is nothing for `role="dialog"` to be named by unless you name it.** Set `label`, or point `aria-labelledby` at your own heading from the outside. A drawer with neither is an unnamed dialog, which screen readers announce as just "dialog".

## Placements

| Placement | Geometry                                            | Bordered edge |
| --------- | --------------------------------------------------- | ------------- |
| `right`   | full viewport height, `--drawer-width` wide          | left          |
| `left`    | full viewport height, `--drawer-width` wide          | right         |
| `bottom`  | full width, **hugs its content**, capped at `90dvh` | top           |

There is **no size axis**. Side drawers have one standard width; override `--drawer-width` (globally or per instance) when a particular drawer needs another. The bottom sheet is content-driven by design, so a height preset would only fight the content.

Only the sheet's top corners are rounded (`--drawer-radius`). Side drawers sit flush against their viewport edge and carry no radius, because a rounded corner against the screen edge reads as a rendering bug.

## Responsive behaviour

Below **48rem** a side drawer keeps its edge and its slide-in animation, and only widens to the full viewport. It deliberately does **not** turn into a bottom sheet — a component that silently changes behaviour by viewport is harder to test and to document than one that stays itself.

The breakpoint is hardcoded as `48rem` with a comment, mirroring [`dialog.styles.ts`](../dialog/dialog.styles.ts) — media queries cannot read CSS custom properties. It deliberately does not come from the Sizes collection, whose Desktop mode only starts at 80rem.

## Drag to dismiss

`drag-to-dismiss` lets a **bottom sheet** be flicked away downwards. It is opt-in and bottom-only: `right` and `left` render no grabber and the gesture stays inert there, because a horizontal drag handle on a side panel is an affordance nobody recognises.

The gesture starts from the grabber or the dismiss row, never from the body: a drag beginning in scrollable content has to scroll, or the content becomes unreachable. Release dismisses if the sheet travelled past 25% of its height, or if the flick exceeded 0.5 px/ms measured over the last 100 ms; anything else springs back.

It is **never the only way out.** A pointer gesture is unreachable by keyboard and screen reader, so Escape, the backdrop and the close button all remain live. Treat it as polish, not as a dismissal path you can rely on.

The gesture lives in [`DragDismissController`](../controllers/drag-dismiss.ts), shared with `<ui-dialog>`.

## Animation

The entry offset rides on `transform`, while the drag gesture writes to `translate`. They are kept on separate properties deliberately — sharing one would make the gesture and the entry animation overwrite each other.

## Page scroll

`showModal()` does not portably stop the page behind from scrolling, so the component sets `overflow: hidden` on `<html>` while open. The lock is **reference-counted at module level** and shared with `<ui-dialog>`, so a drawer opened over a dialog does not release it early.

## Accessibility

- `role="dialog"`, with `aria-modal` supplied by `showModal()`
- Name it with `label` (→ `aria-label`) or your own `aria-labelledby` — see above
- Initial focus is native — mark an element `autofocus` to choose it, otherwise the first focusable element wins
- Focus trapping and returning focus on close are handled by the platform
- The grabber is `aria-hidden` and decorative; every dismissal path it offers is also reachable by keyboard

## CSS parts & tokens

- `::part(panel)`, `::part(dismiss)`, `::part(body)`, `::part(grabber)`
- Surface: `--color-drawer-background`, `--color-drawer-border`, `--color-drawer-grabber`
- Scrim: `--color-background-overlay` on `::backdrop`
- Geometry: `--drawer-width`, `--drawer-radius`, `--drawer-border-width`, `--drawer-padding-inline`, `--drawer-padding-stack`, `--drawer-gap`, `--drawer-grabber-width`, `--drawer-grabber-height`, `--drawer-grabber-gap`

All colours are bound from the Surfaces layer, so a drawer inside a `data-surface` wrapper adapts automatically.

> **Known contrast gap.** `--color-drawer-grabber` resolves to `text/muted` — 2.45–3.85:1 against the drawer background on light surfaces, below the 3:1 that WCAG 1.4.11 asks of a control affordance. It is accepted here because the grabber is decorative and `aria-hidden`, and the gesture is never the only way out. The real fix is a neutral token in the 3–4.5:1 band, which Foundations currently lacks: the ramp jumps from `border/default` (1.2:1) straight to `text/secondary` (8:1).
