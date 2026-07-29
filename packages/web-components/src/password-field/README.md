# `<ui-password-field>`

A form-associated password input web component with a built-in show/hide toggle.

## Basic usage

```html
<ui-password-field label="Password" name="password"></ui-password-field>
```

## Form integration

`ui-password-field` is a form-associated custom element using `ElementInternals`.

### Submit

The current `value` is included in `FormData` under `name`.

### Reset

`form.reset()` restores the initial value captured on first connect.

## Events

| Event       | When                                    | Detail                      |
| ----------- | --------------------------------------- | --------------------------- |
| `input`     | On input updates                        | —                           |
| `change`    | On committed value change               | —                           |
| `ui-input`  | Same as `input`                         | `{ value: string }`         |
| `ui-change` | Same as `change`                        | `{ value: string }`         |
| `ui-toggle` | When the visibility toggle is activated | `{ showPassword: boolean }` |

## Props

| Property         | Attribute         | Type                                              | Default     |
| ---------------- | ----------------- | ------------------------------------------------- | ----------- |
| `variant`        | `variant`         | `'outline' \| 'filled' \| 'underlined'`           | `'outline'` |
| `size`           | `data-size`       | `'small' \| 'default' \| 'large'`                 | `'default'` |
| `label`          | `label`           | `string`                                          | —           |
| `labelPlacement` | `label-placement` | `'top' \| 'floating' \| 'inner'`                  | `'top'`     |
| `placeholder`    | `placeholder`     | `string`                                          | `''`        |
| `value`          | `value`           | `string`                                          | `''`        |
| `hint`           | `hint`            | `string`                                          | —           |
| `state`          | `state`           | `'default' \| 'success' \| 'error' \| 'disabled'` | `'default'` |
| `name`           | `name`            | `string`                                          | —           |
| `disabled`       | `disabled`        | `boolean`                                         | `false`     |
| `required`       | `required`        | `boolean`                                         | `false`     |
| `readonly`       | `readonly`        | `boolean`                                         | `false`     |
| `showPassword`   | `show-password`   | `boolean`                                         | `false`     |

## Accessibility notes

- Input error and hint states map to `aria-invalid` and `aria-describedby`.
- Visibility toggle is a native button with dynamic `aria-label` and `aria-pressed`.
- Native `input` and `change` events are emitted from the host for integration with external listeners.
