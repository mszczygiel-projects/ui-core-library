# `<ui-checkbox-field>`

A form-associated checkbox web component.

## Basic usage

```html
<ui-checkbox-field label="Accept terms" name="terms" value="yes" checked></ui-checkbox-field>
```

## Form integration

`ui-checkbox-field` is a form-associated custom element using `ElementInternals`.

### Submit

The checkbox contributes its `value` only when `checked` is `true`.

### Reset

`form.reset()` restores the initial checked state captured on first connect and clears `indeterminate`.

## Events

| Event       | When                    | Detail                 |
| ----------- | ----------------------- | ---------------------- |
| `change`    | On checked state change | —                      |
| `ui-change` | Same as `change`        | `{ checked: boolean }` |

## Props

| Property        | Attribute       | Type                                 | Default     |
| --------------- | --------------- | ------------------------------------ | ----------- |
| `label`         | `label`         | `string`                             | `''`        |
| `hint`          | `hint`          | `string`                             | —           |
| `checked`       | `checked`       | `boolean`                            | `false`     |
| `indeterminate` | `indeterminate` | `boolean`                            | `false`     |
| `state`         | `state`         | `'default' \| 'error' \| 'disabled'` | `'default'` |
| `disabled`      | `disabled`      | `boolean`                            | `false`     |
| `name`          | `name`          | `string`                             | —           |
| `value`         | `value`         | `string`                             | `'on'`      |
| `required`      | `required`      | `boolean`                            | `false`     |
