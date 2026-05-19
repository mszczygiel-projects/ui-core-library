# `<ui-text-field>`

A form-associated web component for text input built with Lit.

## Basic usage

```html
<ui-text-field label="Email" name="email" value="user@example.com"></ui-text-field>
```

## Form integration

`ui-text-field` implements the [ElementInternals](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals) API (`static formAssociated = true`). It participates in native `<form>` submission and reset without any wrapper elements.

### Submit

The current `value` is included in `FormData` under the `name` attribute. Disabled fields (via `disabled`, `state="disabled"`, or a disabled `<fieldset>`) are excluded.

```html
<form id="my-form">
  <ui-text-field name="username" value="alice"></ui-text-field>
  <button type="submit">Submit</button>
</form>
```

```js
document.getElementById('my-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(e.target);
  console.log(data.get('username')); // 'alice'
});
```

### Reset

Calling `form.reset()` restores `value` to the value the element had when it was first connected to the DOM (the "default value").

```html
<form>
  <ui-text-field name="username" value="alice"></ui-text-field>
  <button type="reset">Reset</button>
</form>
```

## Events

| Event       | When                      | Detail              |
| ----------- | ------------------------- | ------------------- |
| `input`     | On every keystroke        | —                   |
| `change`    | On committed value change | —                   |
| `ui-input`  | Same as `input`           | `{ value: string }` |
| `ui-change` | Same as `change`          | `{ value: string }` |

Both the native events and the `ui-*` custom events bubble and are composed (cross shadow DOM boundaries).

## Props

| Property         | Attribute         | Type                                              | Default     |
| ---------------- | ----------------- | ------------------------------------------------- | ----------- |
| `variant`        | `variant`         | `'outline' \| 'filled' \| 'underlined'`           | `'outline'` |
| `size`           | `data-size`       | `'small' \| 'default' \| 'large'`                 | `'default'` |
| `label`          | `label`           | `string`                                          | —           |
| `labelPlacement` | `label-placement` | `'top' \| 'floating'`                             | `'top'`     |
| `placeholder`    | `placeholder`     | `string`                                          | `''`        |
| `value`          | `value`           | `string`                                          | `''`        |
| `hint`           | `hint`            | `string`                                          | —           |
| `state`          | `state`           | `'default' \| 'success' \| 'error' \| 'disabled'` | `'default'` |
| `name`           | `name`            | `string`                                          | —           |
| `type`           | `type`            | `'text' \| 'email' \| 'tel' \| 'url'`             | `'text'`    |
| `disabled`       | `disabled`        | `boolean`                                         | `false`     |
| `required`       | `required`        | `boolean`                                         | `false`     |
| `readonly`       | `readonly`        | `boolean`                                         | `false`     |

## Slots

| Name            | Description                       |
| --------------- | --------------------------------- |
| `leading-icon`  | Icon placed before the input text |
| `trailing-icon` | Icon placed after the input text  |

## Accessibility notes

- Label is linked to the internal input through `for`/`id`.
- Error state uses `aria-invalid`, and helper text is connected with `aria-describedby`.
- Native `input` and `change` events are emitted from the host for integration with external listeners.
