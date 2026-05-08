# `<ui-radio-field>`

A form-associated radio web component.

## Basic usage

```html
<ui-radio-field label="Option A" name="choice" value="a" checked></ui-radio-field>
```

## Form integration

`ui-radio-field` is a form-associated custom element using `ElementInternals`.

### Submit

The radio contributes its `value` only when `checked` is `true`.

### Reset

`form.reset()` restores the initial checked state captured on first connect.

## Events

| Event       | When                    | Detail                 |
| ----------- | ----------------------- | ---------------------- |
| `change`    | On checked state change | —                      |
| `ui-change` | Same as `change`        | `{ checked: boolean }` |

## Notes

- Radios should share the same `name` to behave as a native group.

## Props

| Property   | Attribute  | Type                                 | Default     |
| ---------- | ---------- | ------------------------------------ | ----------- |
| `label`    | `label`    | `string`                             | `''`        |
| `hint`     | `hint`     | `string`                             | —           |
| `checked`  | `checked`  | `boolean`                            | `false`     |
| `state`    | `state`    | `'default' \| 'error' \| 'disabled'` | `'default'` |
| `disabled` | `disabled` | `boolean`                            | `false`     |
| `name`     | `name`     | `string`                             | —           |
| `value`    | `value`    | `string`                             | `'on'`      |
| `required` | `required` | `boolean`                            | `false`     |

## Accessibility notes

- Uses a native `<input type="radio">` in shadow DOM.
- Radios should share the same `name` to behave as an accessible native group.
- Error state uses `aria-invalid`, and helper text is linked via `aria-describedby`.
