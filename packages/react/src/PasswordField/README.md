# `PasswordField`

A React password input built on top of `TextField`, with a built-in visibility toggle.

## Basic usage

```tsx
<PasswordField label="Password" name="password" />
```

## Form integration

`PasswordField` uses the native `<input>` rendered by `TextField`, so it participates in form submission and reset natively.

### Submit

If `name` is provided, the current value is included in `FormData`.

### Reset

Use `defaultValue` in uncontrolled mode to restore the initial value on `form.reset()`.

## Events

- `onChange(value)` is called on input updates.
- `onToggleVisibility()` is called when the show/hide button is clicked.

## Props

| Prop                 | Type                                              | Default     | Description                                    |
| -------------------- | ------------------------------------------------- | ----------- | ---------------------------------------------- |
| `variant`            | `'outline' \| 'filled' \| 'underlined'`           | `'outline'` | Visual style                                   |
| `size`               | `'small' \| 'default' \| 'large'`                 | `'default'` | Field size                                     |
| `label`              | `string`                                          | —           | Label text                                     |
| `labelPlacement`     | `'top' \| 'floating' \| 'inner'`                  | `'top'`     | Label placement                                |
| `placeholder`        | `string`                                          | —           | Placeholder text                               |
| `value`              | `string`                                          | —           | Controlled value                               |
| `defaultValue`       | `string`                                          | —           | Initial uncontrolled value                     |
| `hint`               | `string`                                          | —           | Helper text                                    |
| `state`              | `'default' \| 'success' \| 'error' \| 'disabled'` | `'default'` | Visual and disabled state                      |
| `name`               | `string`                                          | —           | Native input name                              |
| `disabled`           | `boolean`                                         | —           | Disables the field                             |
| `required`           | `boolean`                                         | —           | Marks the field as required                    |
| `readOnly`           | `boolean`                                         | —           | Makes the field read-only                      |
| `showPassword`       | `boolean`                                         | —           | Controlled visibility state                    |
| `onToggleVisibility` | `() => void`                                      | —           | Called when the visibility toggle is activated |
| `onChange`           | `(value: string) => void`                         | —           | Called with the new value                      |
| `className`          | `string`                                          | —           | Extra class on root element                    |
| `style`              | `CSSProperties`                                   | —           | Inline style on root element                   |

## Accessibility notes

- Inherits labeling and hint semantics from `TextField` (`label` linkage and `aria-describedby` for `hint`).
- Visibility toggle is a native button with dynamic `aria-label` (`Show password`/`Hide password`) and `aria-pressed` state.
