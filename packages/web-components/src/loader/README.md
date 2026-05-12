# `<ui-loader>`

A web component loading indicator for buttons and standalone loading states.

## Basic usage

```html
<ui-loader label="Loading results"></ui-loader>
```

## Behavior

- Renders a status element with `role="status"` and `aria-live="polite"`.
- The visual variant comes from `@mszczygiel-projects/ui-core-foundations` configuration.

## Props

| Property | Attribute   | Type                              | Default     |
| -------- | ----------- | --------------------------------- | ----------- |
| `size`   | `data-size` | `'small' \| 'default' \| 'large'` | `'default'` |
| `label`  | `label`     | `string`                          | `'Loading'` |

## Accessibility notes

- Exposes `role="status"` with `aria-live="polite"` so assistive tech can announce loading state.
- Set a meaningful `label` when loading context is not clear.
