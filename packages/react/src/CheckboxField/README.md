# `CheckboxField`

A React checkbox component that wraps a native `<input type="checkbox">`.

## Basic usage

```tsx
<CheckboxField label="Accept terms" name="terms" defaultChecked />
```

## Form integration

Because `CheckboxField` renders a native checkbox directly, browser form behavior works without extra adapters.

### Submit

The checkbox contributes its `value` only when checked.

### Reset

Use `defaultChecked` in uncontrolled mode to restore the initial checked state on `form.reset()`.

## Notes

- `indeterminate` is applied through the DOM property on the native input.
- `onChange` receives the next checked state.

## Props

| Prop             | Type                                 | Default     | Description                        |
| ---------------- | ------------------------------------ | ----------- | ---------------------------------- |
| `label`          | `string`                             | —           | Visible label text                 |
| `hint`           | `string`                             | —           | Helper text                        |
| `checked`        | `boolean`                            | —           | Controlled checked state           |
| `defaultChecked` | `boolean`                            | —           | Initial uncontrolled checked state |
| `indeterminate`  | `boolean`                            | `false`     | Applies indeterminate visual state |
| `state`          | `'default' \| 'error' \| 'disabled'` | `'default'` | Visual and disabled state          |
| `disabled`       | `boolean`                            | —           | Disables the input                 |
| `name`           | `string`                             | —           | Native input name                  |
| `value`          | `string`                             | `'on'`      | Submitted value when checked       |
| `required`       | `boolean`                            | —           | Marks the input as required        |
| `onChange`       | `(checked: boolean) => void`         | —           | Called with the new checked state  |
| `className`      | `string`                             | —           | Extra class on root element        |
| `style`          | `CSSProperties`                      | —           | Inline style on root element       |
| `id`             | `string`                             | —           | Custom input id                    |
