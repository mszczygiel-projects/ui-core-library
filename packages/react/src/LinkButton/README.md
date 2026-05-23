# `LinkButton`

A React link-styled button component with visual variants, optional icons, and built-in loading/inactive state.

## Basic usage

```tsx
<LinkButton href="https://example.com">More information</LinkButton>
```

## Behavior

- Renders a native `<a>`.
- `loading` and `disabled` make the control inactive (`aria-disabled`, `tabIndex=-1`) and block navigation on click.
- `loading` replaces the left icon with a loader.
- When `target="_blank"` and `rel` is not provided, `rel` defaults to `noopener noreferrer`.

## Props

| Prop         | Type                                                           | Default     | Description                                 |
| ------------ | -------------------------------------------------------------- | ----------- | ------------------------------------------- |
| `href`       | `string`                                                       | —           | Destination URL                             |
| `target`     | `'_self' \| '_blank' \| '_parent' \| '_top'`                 | —           | Native anchor target                        |
| `rel`        | `string`                                                       | auto        | Native anchor rel (`noopener noreferrer` for `_blank`) |
| `variant`    | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger'` | `'primary'` | Visual style                                |
| `size`       | `'small' \| 'default' \| 'large'`                              | `'default'` | Link button size                            |
| `loading`    | `boolean`                                                      | `false`     | Shows loader and disables interaction       |
| `disabled`   | `boolean`                                                      | `false`     | Disables interaction and navigation         |
| `iconLeft`   | `ReactNode`                                                    | —           | Icon before the label                       |
| `iconRight`  | `ReactNode`                                                    | —           | Icon after the label                        |
| `children`   | `ReactNode`                                                    | —           | Label content                               |
| `onClick`    | `MouseEventHandler<HTMLAnchorElement>`                         | —           | Click handler                               |
| `className`  | `string`                                                       | —           | Extra class on root element                 |
| `style`      | `CSSProperties`                                                | —           | Inline style on root element                |
| `aria-label` | `string`                                                       | —           | Accessible label when needed                |

## Accessibility notes

- Uses a native `<a>` element, so link semantics and keyboard focus behavior are native.
- Inactive state is exposed with `aria-disabled="true"`, removed from tab order, and click navigation is prevented.
- Provide `aria-label` when visible content is not descriptive enough.
