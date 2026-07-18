# `Chip`

Interactive chip for filters, selections, and dismissible tags. The chip itself is a
button (`aria-pressed` reflects `selected`); the trailing dismiss button is a separate,
independently interactive control with its own hover/focus states.

## Basic usage

```tsx
import { Chip } from '@mszczygiel-projects/ui-core-react';

<Chip variant="brand">Brand</Chip>
<Chip variant="success" appearance="subtle">Active</Chip>
<Chip variant="error" appearance="outline">Failed</Chip>
```

## With icon

```tsx
import { IconInfo } from '@mszczygiel-projects/ui-core-icons/react';

<Chip variant="info" icon={<IconInfo />}>Info</Chip>
```

## Dismissible

```tsx
<Chip dismissible onDismiss={() => remove(id)}>
  Brand
</Chip>
```

`onDismiss` fires on dismiss-button click and on Delete/Backspace while the chip's
action button has focus. It never fires from a bubbling `onClick` on the dismiss
button — `stopPropagation()` keeps the two interactive zones independent.

## Selected + dismissible (filter chip)

The most common combination for filter bars — an active, removable filter:

```tsx
<Chip
  variant="brand"
  appearance="subtle"
  selected={isActive}
  dismissible
  onClick={() => toggle(id)}
  onDismiss={() => remove(id)}
>
  Brand
</Chip>
```

## Disabled

While `disabled`, the dismiss button is not rendered — even if `dismissible` is set —
and the action button gets the native `disabled` attribute:

```tsx
<Chip disabled dismissible>
  Locked
</Chip>
```

## Props

| Prop           | Type                                                            | Default    | Description                                |
| -------------- | ---------------------------------------------------------------- | ---------- | ------------------------------------------- |
| `variant`      | `neutral` / `brand` / `success` / `warning` / `error` / `info`   | `neutral`  | Colour scheme                               |
| `appearance`   | `solid` / `subtle` / `outline`                                   | `solid`    | Visual style (Figma `Style`)                |
| `size`         | `small` / `medium`                                               | `small`    | Size                                        |
| `selected`     | `boolean`                                                         | `false`    | Selected/pressed state (`aria-pressed`)     |
| `disabled`     | `boolean`                                                         | `false`    | Disables the chip; hides the dismiss button |
| `dismissible`  | `boolean`                                                         | `false`    | Shows the trailing dismiss button           |
| `dismissLabel` | `string` — accessible name of the dismiss button                 | `'Remove'` | —                                            |
| `icon`         | `ReactNode`                                                       | —          | Leading icon                                |
| `children`     | `ReactNode` — label text                                          | —          | Label content                               |
| `onClick`      | `(event) => void` — click handler for the main action             | —          | —                                            |
| `onDismiss`    | `() => void`                                                      | —          | Called on dismiss-button click or Delete/Backspace |
| `className`    | `string` — appended to the root element                          | —          | Extra class on root element                 |
| `style`        | `CSSProperties` — forwarded to the root element                   | —          | Inline style on root element (positioning only) |

`appearance` maps to the Figma `Style` property (`style` is the inline-style prop in React).
