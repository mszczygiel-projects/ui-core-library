# `<ui-search-field>`

A form-associated search input web component with a leading search icon and built-in clear action.

## Basic usage

```html
<ui-search-field name="query" value="buttons"></ui-search-field>
```

## Form integration

`ui-search-field` is a form-associated custom element using `ElementInternals`.

### Submit

The current `value` is included in `FormData` under `name`.

### Reset

`form.reset()` restores the value captured when the element first connected.

## Events

| Event       | When                               | Detail              |
| ----------- | ---------------------------------- | ------------------- |
| `input`     | On every input update and clear    | —                   |
| `change`    | On committed value change          | —                   |
| `ui-input`  | Same as `input`                    | `{ value: string }` |
| `ui-change` | Same as `change`                   | `{ value: string }` |
| `ui-clear`  | When the clear button is activated | —                   |

## Props

| Property         | Attribute         | Type                                              | Default       |
| ---------------- | ----------------- | ------------------------------------------------- | ------------- |
| `variant`        | `variant`         | `'outline' \| 'filled' \| 'underlined'`           | `'outline'`   |
| `size`           | `data-size`       | `'small' \| 'default' \| 'large'`                 | `'default'`   |
| `label`          | `label`           | `string`                                          | —             |
| `labelPlacement` | `label-placement` | `'top' \| 'floating' \| 'inner'`                  | `'top'`       |
| `value`          | `value`           | `string`                                          | `''`          |
| `placeholder`    | `placeholder`     | `string`                                          | `'Search...'` |
| `hint`           | `hint`            | `string`                                          | —             |
| `state`          | `state`           | `'default' \| 'success' \| 'error' \| 'disabled'` | `'default'`   |
| `name`           | `name`            | `string`                                          | —             |
| `disabled`       | `disabled`        | `boolean`                                         | `false`       |
| `required`       | `required`        | `boolean`                                         | `false`       |
| `readonly`       | `readonly`        | `boolean`                                         | `false`       |

## Accessibility notes

- Uses native `<input type="search">` semantics inside shadow DOM.
- Clear button is hidden from assistive tech and keyboard navigation when empty (`aria-hidden` and `tabindex=-1`).
- Emits native `input` and `change` from the host for app-level form/event integration.
