# `IconButton`

A React icon-only button with the same variants and loading behavior as `Button`.

## Basic usage

```tsx
<IconButton aria-label="Close" icon={<IconClose />} />
```

## Behavior

- Renders a native `<button>`.
- `aria-label` is required because the control has no visible text label.
- `loading` disables the button and replaces the icon with a loader.

## Props

| Prop         | Type                                                           | Default     | Description                           |
| ------------ | -------------------------------------------------------------- | ----------- | ------------------------------------- |
| `variant`    | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger'` | `'primary'` | Visual style                          |
| `size`       | `'small' \| 'default' \| 'large'`                              | `'default'` | Button size                           |
| `loading`    | `boolean`                                                      | `false`     | Shows loader and disables interaction |
| `disabled`   | `boolean`                                                      | `false`     | Disables the button                   |
| `type`       | `'button' \| 'submit' \| 'reset'`                              | `'button'`  | Native button type                    |
| `icon`       | `ReactNode`                                                    | —           | Icon content                          |
| `aria-label` | `string`                                                       | —           | Required accessible label             |
| `onClick`    | `MouseEventHandler<HTMLButtonElement>`                         | —           | Click handler                         |
| `className`  | `string`                                                       | —           | Extra class on root element           |
| `style`      | `CSSProperties`                                                | —           | Inline style on root element          |

## Accessibility notes

- Uses a native `<button>` element, so keyboard activation and focus behavior are native.
- `aria-label` is required and should describe the action because there is no visible text label.
