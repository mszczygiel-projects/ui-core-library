# `<ui-loader>`

A web component loading indicator for buttons and standalone loading states.

## Basic usage

```html
<ui-loader label="Loading results"></ui-loader>
```

## Behavior

- Renders a status element with `role="status"` and `aria-live="polite"`.
- The visual variant comes from `@ui-core/foundations` configuration.

## Props

| Property | Attribute   | Type                              | Default     |
| -------- | ----------- | --------------------------------- | ----------- |
| `size`   | `data-size` | `'small' \| 'default' \| 'large'` | `'default'` |
| `label`  | `label`     | `string`                          | `'Loading'` |
