# `<ui-popover>`

Generic overlay primitive: positions floating content relative to a trigger. Not DatePicker-specific — Select, Dropdown Menu, and Tooltip reuse it. Renders in the browser **top layer** via the native Popover API; browsers without it fall back to `position: fixed` with the single documented `--z-overlay` hook (default `100`) — no z-index token scale exists or is needed.

Fully **controlled**: the component never mutates its own `open` state. Interactions (trigger click/hover, `Escape`, outside click) only dispatch `open-change` requests — the consumer owns the state and writes `open` back.

## Basic usage

```html
<ui-popover placement="bottom-start">
  <button slot="trigger">Open</button>
  <p>Floating content</p>
</ui-popover>
<script>
  const popover = document.querySelector('ui-popover');
  popover.addEventListener('open-change', (e) => (popover.open = e.detail.open));
</script>
```

## Manual trigger (composed widgets — e.g. DateField)

```html
<ui-popover trigger="manual" trap-focus>
  <div slot="trigger"><!-- field --></div>
  <!-- calendar -->
</ui-popover>
```

With `trigger="manual"` the component makes no open/close requests from the trigger (dismiss requests — `Escape`/outside click — still fire per `dismiss-on`) and leaves the trigger's ARIA to the consumer.

## Props

| Property    | Attribute    | Type                                                             | Default  |
| ----------- | ------------ | ---------------------------------------------------------------- | -------- |
| `open`      | `open`       | boolean (controlled)                                             | `false`  |
| `placement` | `placement`  | `top`/`bottom`/`left`/`right` (+ `-start`/`-end`; bare = center) | `bottom` |
| `trigger`   | `trigger`    | `click` / `hover` / `manual`                                     | `click`  |
| `offset`    | `offset`     | number (px); defaults to the `--popover-offset` token            | token    |
| `flip`      | — (property) | boolean — flip to opposite side on collision                     | `true`   |
| `shift`     | — (property) | boolean — nudge along alignment axis to stay in viewport         | `true`   |
| `dismissOn` | `dismiss-on` | `outside-click` / `escape` / `both`                              | `both`   |
| `trapFocus` | `trap-focus` | boolean — initial focus, Tab cycle, focus return                 | `false`  |
| `arrow`     | `arrow`      | boolean — caret pointing at the trigger                          | `false`  |

Positioning (offset/flip/shift/arrow) is computed by [Floating UI](https://floating-ui.com); the resolved placement (after collisions) is reflected as `data-actual-placement` on the host.

## Events

- `open-change` — `detail: { open: boolean, reason: 'trigger' | 'hover' | 'outside-click' | 'escape' }`. The only way the component asks for a state change; it never applies it itself.

## Focus ownership

- The popover owns the outer boundary: with `trap-focus` it moves focus into the panel on open, cycles `Tab`, and returns focus to the trigger on close. Without `trap-focus` it never steals focus (inline-typing flows like DateField).
- Slotted content owns its internal keyboard navigation (e.g. arrow keys in a day grid).

## Slots

- `trigger` — anchor element the panel is positioned against; gets `aria-expanded` synced (except `trigger="manual"`)
- default — panel content

## CSS parts & hooks

- `::part(panel)`, `::part(arrow)`, `::part(content)`
- `--z-overlay` — fallback stacking only (top layer needs none)
- Panel surface tokens: `--color-popover-background`, `--color-popover-border`, `--popover-radius`, `--popover-padding`, `--popover-border-width`, `--popover-arrow-size`, `--popover-offset`, `--shadow-md`

## Top layer & theming

The panel stays a DOM descendant of the host (top layer is a rendering concept, not a DOM move), so CSS custom properties keep inheriting through `:root` / `[data-surface]` wrappers — surface-aware theming works unchanged.
