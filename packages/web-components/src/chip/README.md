# `<ui-chip>`

Interactive chip for filters, selections, and dismissible tags. The chip itself is a
button (`aria-pressed` reflects `selected`); the trailing dismiss button is a separate,
independently interactive control with its own hover/focus states.

## Basic usage

```html
<ui-chip variant="brand">Brand</ui-chip>
<ui-chip variant="success" appearance="subtle">Active</ui-chip>
<ui-chip variant="error" appearance="outline">Failed</ui-chip>
```

## With icon

```html
<ui-chip variant="info">
  <svg slot="icon">…</svg>
  Info
</ui-chip>
```

## Dismissible

```html
<ui-chip dismissible dismiss-label="Remove Brand filter">Brand</ui-chip>
```

Listen for the `dismiss` event — it fires on dismiss-button click and on
Delete/Backspace while the chip has focus:

```js
chip.addEventListener('dismiss', () => {
  chip.remove();
});
```

## Selected + dismissible (filter chip)

The most common combination for filter bars — an active, removable filter:

```html
<ui-chip variant="brand" appearance="subtle" selected dismissible>Brand</ui-chip>
```

## Disabled

While `disabled`, the dismiss button is not rendered — even if `dismissible` is set —
and the action button gets the native `disabled` attribute:

```html
<ui-chip disabled dismissible>Locked</ui-chip>
```

## Props

| Property       | Attribute       | Type                                                           | Default    |
| -------------- | --------------- | -------------------------------------------------------------- | ---------- |
| `variant`      | `variant`       | `neutral` / `brand` / `success` / `warning` / `error` / `info` | `neutral`  |
| `appearance`   | `appearance`    | `solid` / `subtle` / `outline`                                 | `solid`    |
| `size`         | `data-size`     | `small` / `medium`                                             | `small`    |
| `selected`     | `selected`      | boolean                                                        | `false`    |
| `disabled`     | `disabled`      | boolean                                                        | `false`    |
| `dismissible`  | `dismissible`   | boolean                                                        | `false`    |
| `dismissLabel` | `dismiss-label` | string — accessible name of the dismiss button                 | `'Remove'` |

`appearance` maps to the Figma `Style` property (`style` is reserved in HTML).

## Slots

- default — label text
- `icon` — leading icon (sized automatically per `data-size`)

## Events

- `dismiss` — dispatched (bubbles, composed) when the dismiss button is clicked, or
  Delete/Backspace is pressed while `dismissible` and not `disabled`. Never fires
  a bubbling `click` from the dismiss button — `stopPropagation()` keeps the two
  interactive zones independent.
