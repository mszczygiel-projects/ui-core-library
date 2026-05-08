# `Loader`

A React loading indicator component used by buttons and standalone loading states.

## Basic usage

```tsx
<Loader label="Loading results" />
```

## Behavior

- Renders a status element with `role="status"` and `aria-live="polite"`.
- The visual variant comes from `@ui-core/foundations` configuration.

## Props

| Prop        | Type                              | Default     | Description                  |
| ----------- | --------------------------------- | ----------- | ---------------------------- |
| `size`      | `'small' \| 'default' \| 'large'` | `'default'` | Loader size                  |
| `label`     | `string`                          | `'Loading'` | Accessible status label      |
| `className` | `string`                          | —           | Extra class on root element  |
| `style`     | `CSSProperties`                   | —           | Inline style on root element |
