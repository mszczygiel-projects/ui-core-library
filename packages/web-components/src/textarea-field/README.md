# `<ui-textarea-field>`

A form-associated web component for multi-line text input built with Lit.

## Basic usage

```html
<ui-textarea-field label="Message" name="message" hint="Max 500 characters"></ui-textarea-field>
```

## Resize behaviour

`resize` controls how the field's height may change. It is behaviour, not a design token — all three modes share the same `--textarea-*-min-height` floor.

| Value      | Behaviour                                                                      |
| ---------- | ------------------------------------------------------------------------------ |
| `none`     | Fixed height. No drag handle.                                                  |
| `vertical` | Native vertical drag handle. **Default.**                                      |
| `auto`     | Grows to fit its content as the user types. No drag handle, no maximum height. |

```html
<ui-textarea-field label="Message" resize="auto"></ui-textarea-field>
```

In `auto` mode the component measures the content and publishes the result to the stylesheet as a `--_auto-height` custom property; the stylesheet applies it. There is deliberately no maximum — a long entry keeps growing rather than starting to scroll internally. If you need a cap, constrain the surrounding layout instead.

## Form integration

`ui-textarea-field` implements the [ElementInternals](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals) API (`static formAssociated = true`). It participates in native `<form>` submission and reset without any wrapper elements.

### Submit

The current `value` is included in `FormData` under the `name` attribute. Disabled fields (via `disabled`, `state="disabled"`, or a disabled `<fieldset>`) are excluded.

```html
<form id="my-form">
  <ui-textarea-field name="message" value="Hello"></ui-textarea-field>
  <button type="submit">Submit</button>
</form>
```

```js
document.getElementById('my-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(e.target);
  console.log(data.get('message')); // 'Hello'
});
```

### Reset

Calling `form.reset()` restores `value` to the value the element had when it was first connected to the DOM (the "default value").

## Events

| Event       | When                      | Detail              |
| ----------- | ------------------------- | ------------------- |
| `input`     | On every keystroke        | —                   |
| `change`    | On committed value change | —                   |
| `ui-input`  | Same as `input`           | `{ value: string }` |
| `ui-change` | Same as `change`          | `{ value: string }` |

Both the native events and the `ui-*` custom events bubble and are composed (cross shadow DOM boundaries).

## Props

| Property         | Attribute         | Type                                              | Default      |
| ---------------- | ----------------- | ------------------------------------------------- | ------------ |
| `variant`        | `variant`         | `'outline' \| 'filled' \| 'underlined'`           | `'outline'`  |
| `size`           | `data-size`       | `'small' \| 'default' \| 'large'`                 | `'default'`  |
| `label`          | `label`           | `string`                                          | —            |
| `labelPlacement` | `label-placement` | `'top' \| 'floating' \| 'inner'`                  | `'top'`      |
| `placeholder`    | `placeholder`     | `string`                                          | `''`         |
| `value`          | `value`           | `string`                                          | `''`         |
| `hint`           | `hint`            | `string`                                          | —            |
| `state`          | `state`           | `'default' \| 'success' \| 'error' \| 'disabled'` | `'default'`  |
| `resize`         | `resize`          | `'none' \| 'vertical' \| 'auto'`                  | `'vertical'` |
| `name`           | `name`            | `string`                                          | —            |
| `disabled`       | `disabled`        | `boolean`                                         | `false`      |
| `required`       | `required`        | `boolean`                                         | `false`      |
| `readonly`       | `readonly`        | `boolean`                                         | `false`      |

## Slots

None. Unlike `<ui-text-field>`, this component has no icon slots — the Figma Component Set omits them.

## Accessibility notes

- Label is linked to the internal textarea through `for`/`id`.
- Error state uses `aria-invalid`, and helper text is connected with `aria-describedby`.
- Native `input` and `change` events are emitted from the host for integration with external listeners.
- `labelPlacement="floating"` and `"inner"` still render a real `<label>` element, so the accessible name is present regardless of where the label sits visually.
