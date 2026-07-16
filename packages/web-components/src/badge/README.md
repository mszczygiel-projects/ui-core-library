# `<ui-badge>`

A non-interactive status/label chip. Single default appearance per variant — no hover, focus, or active states.

## Basic usage

```html
<ui-badge variant="success">Active</ui-badge>
<ui-badge variant="error" appearance="subtle">Failed</ui-badge>
```

## With icon

```html
<ui-badge variant="info">
  <svg slot="icon">…</svg>
  Info
</ui-badge>
```

## Icon-only

```html
<ui-badge variant="warning" icon-only label="Warning">
  <svg slot="icon">…</svg>
</ui-badge>
```

`label` is required in icon-only mode — it renders `role="img"` + `aria-label` on the host.

## API

| Attribute    | Values                                                          | Default   |
| ------------ | --------------------------------------------------------------- | --------- |
| `variant`    | `neutral` / `brand` / `success` / `warning` / `error` / `info` | `neutral` |
| `appearance` | `solid` / `subtle`                                              | `solid`   |
| `data-size`  | `small` / `medium`                                              | `small`   |
| `shape`      | `rounded` / `square`                                            | `rounded` |
| `icon-only`  | boolean                                                          | `false`   |
| `label`      | string — accessible name (icon-only mode)                        | —         |

`appearance` maps to the Figma `Style` property (`style` is reserved in HTML).

## Slots

- default — label text
- `icon` — leading icon (sized automatically per `data-size`)
