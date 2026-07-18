# `<Popover>`

Generic overlay primitive: positions floating content relative to an anchor. Not DatePicker-specific — Select, Dropdown Menu, and Tooltip reuse it. Renders in the browser **top layer** via the native Popover API; browsers without it fall back to `position: fixed` with the single documented `--z-overlay` hook (default `100`).

Fully **controlled**: the component never owns its open state. Interactions (anchor click/hover, `Escape`, outside click) only call `onOpenChange` — the consumer owns the state and passes `open` back down.

## Basic usage

```tsx
const [open, setOpen] = useState(false);

<Popover
  open={open}
  onOpenChange={(detail) => setOpen(detail.open)}
  placement="bottom-start"
  anchor={<Button variant="secondary">Open</Button>}
>
  Floating content
</Popover>;
```

## Props

| Prop           | Type                                                             | Default  |
| -------------- | ---------------------------------------------------------------- | -------- |
| `open`         | boolean (controlled)                                             | `false`  |
| `placement`    | `top`/`bottom`/`left`/`right` (+ `-start`/`-end`; bare = center) | `bottom` |
| `trigger`      | `click` / `hover` / `manual`                                     | `click`  |
| `offset`       | number (px); defaults to the `--popover-offset` token            | token    |
| `flip`         | boolean — flip to opposite side on collision                     | `true`   |
| `shift`        | boolean — nudge along alignment axis to stay in viewport         | `true`   |
| `dismissOn`    | `outside-click` / `escape` / `both`                              | `both`   |
| `trapFocus`    | boolean — initial focus, Tab cycle, focus return                 | `false`  |
| `arrow`        | boolean — caret pointing at the anchor                           | `false`  |
| `anchor`       | ReactNode — the WC `trigger` slot equivalent                     | —        |
| `children`     | ReactNode — panel content                                        | —        |
| `onOpenChange` | `(detail: { open, reason }) => void`                             | —        |

Positioning (offset/flip/shift/arrow) is computed by [Floating UI](https://floating-ui.com); the resolved placement (after collisions) is exposed as `data-placement` on the panel element. When `anchor` is a single element and `trigger` is not `manual`, `aria-expanded` is injected onto it; with `trigger="manual"` the consumer owns the anchor's ARIA. Note: the injection reaches the DOM only if the anchor component forwards unknown/ARIA props (a native `<button>` does; the DS `Button` currently whitelists its props and drops it).

## Focus ownership

- With `trapFocus` the popover moves focus into the panel on open, cycles `Tab`, and returns focus to the anchor on close. Without it the popover never steals focus (inline-typing flows like DateField).
- Panel content owns its internal keyboard navigation (e.g. arrow keys in a day grid).

## CSS hooks

- Classes: `ui-popover`, `ui-popover__anchor`, `ui-popover__panel`, `ui-popover__arrow`, `ui-popover__content`
- `--z-overlay` — fallback stacking only (top layer needs none)
- Panel surface tokens: `--color-popover-background`, `--color-popover-border`, `--popover-radius`, `--popover-padding`, `--popover-border-width`, `--popover-arrow-size`, `--popover-offset`, `--shadow-md`

## Top layer & theming

The panel stays a DOM descendant of the host (top layer is a rendering concept, not a DOM move), so CSS custom properties keep inheriting through `:root` / `[data-surface]` wrappers — surface-aware theming works unchanged. SSR note: the native-Popover feature detection runs client-side; a popover SSR-rendered with `open` may log a one-off hydration class warning in browsers without the Popover API — SSR closed popovers (the normal case) are unaffected.
