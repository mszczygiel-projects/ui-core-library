# `SearchField`

A React search input built on top of `TextField`, with built-in leading search icon and clear action.

## Basic usage

```tsx
<SearchField name="query" defaultValue="buttons" />
```

## Form integration

`SearchField` uses the native `<input type="search">` rendered by `TextField`, so browser form submission works out of the box.

### Submit

If `name` is provided, the current value is included in `FormData`.

### Reset

Use `defaultValue` in uncontrolled mode to restore the initial value on `form.reset()`.

## Events

- `onChange(value)` is called on every input update.
- `onClear()` is called when the clear button is activated.
- Clearing also triggers `onChange('')`.

## Props

| Prop           | Type                                              | Default       | Description                                |
| -------------- | ------------------------------------------------- | ------------- | ------------------------------------------ |
| `variant`      | `'outline' \| 'filled' \| 'underlined'`           | `'outline'`   | Visual style                               |
| `size`         | `'small' \| 'default' \| 'large'`                 | `'default'`   | Field size                                 |
| `value`        | `string`                                          | —             | Controlled value                           |
| `defaultValue` | `string`                                          | —             | Initial uncontrolled value                 |
| `placeholder`  | `string`                                          | `'Search...'` | Placeholder text                           |
| `hint`         | `string`                                          | —             | Helper text                                |
| `state`        | `'default' \| 'success' \| 'error' \| 'disabled'` | `'default'`   | Visual and disabled state                  |
| `name`         | `string`                                          | —             | Native input name                          |
| `disabled`     | `boolean`                                         | —             | Disables the field                         |
| `required`     | `boolean`                                         | —             | Marks the field as required                |
| `readOnly`     | `boolean`                                         | —             | Makes the field read-only                  |
| `onChange`     | `(value: string) => void`                         | —             | Called with the new value                  |
| `onClear`      | `() => void`                                      | —             | Called when the clear control is activated |
| `className`    | `string`                                          | —             | Extra class on root element                |
| `style`        | `CSSProperties`                                   | —             | Inline style on root element               |

## Accessibility notes

- Inherits input semantics from `TextField` and renders a native `<input type="search">`.
- Clear control is removed from tab order when empty (`tabIndex=-1`) and marked `aria-hidden` until there is a value.
