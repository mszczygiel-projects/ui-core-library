# `Button`

A React button component with visual variants, optional icons, and built-in loading state.

## Basic usage

```tsx
<Button variant="primary">Save</Button>
```

## Behavior

- Renders a native `<button>`.
- `loading` disables the button and replaces the left icon with a loader.
- `type` defaults to `button`.

## Props

| Prop         | Type                                                           | Default     | Description                           |
| ------------ | -------------------------------------------------------------- | ----------- | ------------------------------------- |
| `variant`    | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger'` | `'primary'` | Visual style                          |
| `size`       | `'small' \| 'default' \| 'large'`                              | `'default'` | Button size                           |
| `loading`    | `boolean`                                                      | `false`     | Shows loader and disables interaction |
| `disabled`   | `boolean`                                                      | `false`     | Disables the button                   |
| `type`       | `'button' \| 'submit' \| 'reset'`                              | `'button'`  | Native button type                    |
| `iconLeft`   | `ReactNode`                                                    | —           | Icon before the label                 |
| `iconRight`  | `ReactNode`                                                    | —           | Icon after the label                  |
| `children`   | `ReactNode`                                                    | —           | Button label content                  |
| `onClick`    | `MouseEventHandler<HTMLButtonElement>`                         | —           | Click handler                         |
| `className`  | `string`                                                       | —           | Extra class on root element           |
| `style`      | `CSSProperties`                                                | —           | Inline style on root element          |
| `aria-label` | `string`                                                       | —           | Accessible label when needed          |
| `aria-*`     | `AriaAttributes`                                               | —           | Forwarded to the root `<button>`      |

## Accessibility notes

- Uses a native `<button>` element, so keyboard activation (`Enter`, `Space`) and semantics are provided by the browser.
- `loading` sets `aria-busy="true"` and disables interaction to prevent duplicate actions.
- Any `aria-*` attribute (e.g. `aria-expanded`, `aria-haspopup`, `aria-controls`) is forwarded to the root `<button>` — this is how Popover's injected `aria-expanded` reaches the DOM when Button is its anchor. Component-managed attributes (`aria-busy` while loading) win over forwarded values. Non-ARIA unknown props are still dropped (closed interface).
