# `TextField`

A React text input component that integrates natively with HTML forms.

## Basic usage

```tsx
<TextField label="Email" name="email" />
```

## Form integration

`TextField` renders a native `<input>` element and participates in HTML form submission and reset out of the box — no wrappers or special setup required.

### Submit

The current value is included in `FormData` under the `name` prop. Disabled fields are excluded automatically by the browser.

```tsx
function MyForm() {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    console.log(data.get('username'));
  }

  return (
    <form onSubmit={handleSubmit}>
      <TextField name="username" defaultValue="alice" label="Username" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Reset

Use `defaultValue` (uncontrolled) to get automatic reset-to-initial-value behaviour when `<button type="reset">` is clicked or `form.reset()` is called.

```tsx
<form>
  <TextField name="username" defaultValue="alice" label="Username" />
  <button type="reset">Reset</button>
</form>
```

## Props

`TextField` extends all standard `<input>` HTML attributes (except `size` and `onChange`) with the additions below.

| Prop             | Type                                              | Default     | Description                              |
| ---------------- | ------------------------------------------------- | ----------- | ---------------------------------------- |
| `variant`        | `'outline' \| 'filled' \| 'underlined'`           | `'outline'` | Visual style                             |
| `size`           | `'small' \| 'default' \| 'large'`                 | `'default'` | Field size                               |
| `label`          | `string`                                          | —           | Label text                               |
| `labelPlacement` | `'top' \| 'floating'`                             | `'top'`     | Where to render the label                |
| `placeholder`    | `string`                                          | `''`        | Placeholder text                         |
| `hint`           | `string`                                          | —           | Helper text rendered below the field     |
| `state`          | `'default' \| 'success' \| 'error' \| 'disabled'` | `'default'` | Visual and a11y state                    |
| `leadingIcon`    | `ReactNode`                                       | —           | Icon before the input                    |
| `trailingIcon`   | `ReactNode`                                       | —           | Icon after the input (overrides default) |
| `onChange`       | `(value: string) => void`                         | —           | Called with the new string value         |
| `className`      | `string`                                          | —           | Extra class on root element              |
| `style`          | `CSSProperties`                                   | —           | Inline style on root element             |

All other `InputHTMLAttributes` (`name`, `defaultValue`, `value`, `disabled`, `required`, `readOnly`, `type`, `autoComplete`, …) are forwarded directly to the native `<input>`.

## Accessibility notes

- Label uses native `<label htmlFor>` linkage to the input.
- Error state sets `aria-invalid`, and helper text is linked via `aria-describedby`.
- Required state is exposed through native input semantics.
