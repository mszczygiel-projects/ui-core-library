# `Loader`

A React loading indicator component used by buttons and standalone loading states.

## Basic usage

```tsx
<Loader label="Loading results" />
```

## Behavior

- Renders a status element with `role="status"` and `aria-live="polite"`.
- The visual variant comes from `@mszczygiel-projects/foundations` configuration.

## Props

| Prop        | Type                              | Default     | Description                  |
| ----------- | --------------------------------- | ----------- | ---------------------------- |
| `size`      | `'small' \| 'default' \| 'large'` | `'default'` | Loader size                  |
| `label`     | `string`                          | `'Loading'` | Accessible status label      |
| `className` | `string`                          | —           | Extra class on root element  |
| `style`     | `CSSProperties`                   | —           | Inline style on root element |

## Accessibility notes

- Exposes `role="status"` with `aria-live="polite"` so assistive tech can announce loading state changes.
- Set a meaningful `label` when loading context is not obvious from surrounding UI.
