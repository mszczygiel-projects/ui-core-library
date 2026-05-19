# `RadioField`

A React radio component that wraps a native `<input type="radio">`.

## Basic usage

```tsx
<RadioField label="Option A" name="choice" value="a" defaultChecked />
```

## Form integration

Because `RadioField` renders a native radio input directly, submit and reset behavior are provided by the browser.

### Submit

The radio contributes its `value` only when checked.

### Reset

Use `defaultChecked` in uncontrolled mode to restore the initial checked state on `form.reset()`.

## Notes

- Radios should share the same `name` to form a native group.
- `onChange` receives the new checked state.

## Props

| Prop             | Type                                 | Default     | Description                        |
| ---------------- | ------------------------------------ | ----------- | ---------------------------------- |
| `label`          | `string`                             | —           | Visible label text                 |
| `hint`           | `string`                             | —           | Helper text                        |
| `checked`        | `boolean`                            | —           | Controlled checked state           |
| `defaultChecked` | `boolean`                            | —           | Initial uncontrolled checked state |
| `state`          | `'default' \| 'error' \| 'disabled'` | `'default'` | Visual and disabled state          |
| `disabled`       | `boolean`                            | —           | Disables the input                 |
| `name`           | `string`                             | —           | Native input name                  |
| `value`          | `string`                             | `'on'`      | Submitted value when checked       |
| `required`       | `boolean`                            | —           | Marks the input as required        |
| `onChange`       | `(checked: boolean) => void`         | —           | Called with the new checked state  |
| `className`      | `string`                             | —           | Extra class on root element        |
| `style`          | `CSSProperties`                      | —           | Inline style on root element       |
| `id`             | `string`                             | —           | Custom input id                    |

## Accessibility notes

- Uses a native `<input type="radio">`, so keyboard and screen reader semantics are native.
- Radios should share the same `name` to form an accessible group.
- Error state applies `aria-invalid`, and `hint` is linked through `aria-describedby`.
