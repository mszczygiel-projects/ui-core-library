# `TextareaField`

A React multi-line text input that integrates natively with HTML forms.

## Basic usage

```tsx
<TextareaField label="Message" name="message" hint="Max 500 characters" />
```

## Resize behaviour

`resize` controls how the field's height may change. It is behaviour, not a design token — all three modes share the same `--textarea-*-min-height` floor.

| Value      | Behaviour                                                                      |
| ---------- | ------------------------------------------------------------------------------ |
| `none`     | Fixed height. No drag handle.                                                  |
| `vertical` | Native vertical drag handle. **Default.**                                      |
| `auto`     | Grows to fit its content as the user types. No drag handle, no maximum height. |

```tsx
<TextareaField label="Message" resize="auto" />
```

In `auto` mode the component measures the content and publishes the result to the stylesheet as a `--_auto-height` custom property; the stylesheet applies it. There is deliberately no maximum — a long entry keeps growing rather than starting to scroll internally. If you need a cap, constrain the surrounding layout instead.

Auto-grow works for both controlled and uncontrolled usage: the measurement re-runs on every `value` change and on every user edit.

## Form integration

`TextareaField` renders a native `<textarea>` element and participates in HTML form submission and reset out of the box — no wrappers or special setup required.

### Submit

The current value is included in `FormData` under the `name` prop. Disabled fields are excluded automatically by the browser.

```tsx
function MyForm() {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    console.log(data.get('message'));
  }

  return (
    <form onSubmit={handleSubmit}>
      <TextareaField name="message" defaultValue="Hello" label="Message" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Reset

Use `defaultValue` (uncontrolled) to get automatic reset-to-initial-value behaviour when `<button type="reset">` is clicked or `form.reset()` is called.

## Props

`TextareaField` extends all standard `<textarea>` HTML attributes (except `onChange`) with the additions below.

| Prop             | Type                                              | Default      | Description                          |
| ---------------- | ------------------------------------------------- | ------------ | ------------------------------------ |
| `variant`        | `'outline' \| 'filled' \| 'underlined'`           | `'outline'`  | Visual style                         |
| `size`           | `'small' \| 'default' \| 'large'`                 | `'default'`  | Minimum height and typography scale  |
| `label`          | `string`                                          | —            | Label text                           |
| `labelPlacement` | `'top' \| 'floating' \| 'inner'`                  | `'top'`      | Where to render the label            |
| `placeholder`    | `string`                                          | `''`         | Placeholder text                     |
| `hint`           | `string`                                          | —            | Helper text rendered below the field |
| `state`          | `'default' \| 'success' \| 'error' \| 'disabled'` | `'default'`  | Visual and a11y state                |
| `resize`         | `'none' \| 'vertical' \| 'auto'`                  | `'vertical'` | How the field may grow               |
| `onChange`       | `(value: string) => void`                         | —            | Called with the new string value     |
| `className`      | `string`                                          | —            | Extra class on root element          |
| `style`          | `CSSProperties`                                   | —            | Inline style on root element         |

All other `TextareaHTMLAttributes` (`name`, `defaultValue`, `value`, `disabled`, `required`, `readOnly`, `rows`, `maxLength`, `autoComplete`, …) are forwarded directly to the native `<textarea>`. The `ref` is forwarded to that element too.

`rows` still works, but it sets an intrinsic height that competes with the token-driven minimum — prefer `size` unless you specifically need a row count.

## Accessibility notes

- Label uses native `<label htmlFor>` linkage to the textarea.
- Error state sets `aria-invalid`, and helper text is linked via `aria-describedby`.
- Required state is exposed through native textarea semantics.
- `labelPlacement="floating"` and `"inner"` still render a real `<label>` element, so the accessible name is present regardless of where the label sits visually.
