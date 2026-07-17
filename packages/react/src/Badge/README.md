# `Badge`

A non-interactive status/label chip. Single default appearance per variant — no hover, focus, or active states.

## Basic usage

```tsx
import { Badge } from '@mszczygiel-projects/ui-core-react';

<Badge variant="success">Active</Badge>
<Badge variant="error" appearance="subtle">Failed</Badge>
```

## With icon

```tsx
import { IconInfo } from '@mszczygiel-projects/ui-core-icons/react';

<Badge variant="info" icon={<IconInfo />}>Info</Badge>
```

## Icon-only

Icon-only mode is derived automatically when `icon` is set and no `children` are passed.
Provide `aria-label` — the root then renders `role="img"`.

```tsx
<Badge variant="warning" icon={<IconWarning />} aria-label="Warning" />
```

## Props

| Prop         | Type                                                             | Default   |
| ------------ | ---------------------------------------------------------------- | --------- |
| `variant`    | `neutral` / `brand` / `success` / `warning` / `error` / `info`  | `neutral` |
| `appearance` | `solid` / `subtle`                                               | `solid`   |
| `size`       | `small` / `medium`                                               | `small`   |
| `shape`      | `rounded` / `square`                                             | `rounded` |
| `icon`       | `ReactNode`                                                      | —         |
| `children`   | `ReactNode` — label text                                         | —         |
| `className`  | `string` — appended to the root element                          | —         |
| `style`      | `CSSProperties` — forwarded to the root element                  | —         |
| `aria-label` | `string` — accessible name (required for icon-only)              | —         |

`appearance` maps to the Figma `Style` property (`style` is the inline-style prop in React).
