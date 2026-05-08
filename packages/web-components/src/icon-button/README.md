# `<ui-icon-button>`

A web component icon-only button with variants and loading state.

## Basic usage

```html
<ui-icon-button label="Close">
  <svg aria-hidden="true">...</svg>
</ui-icon-button>
```

## Behavior

- Renders a native `<button>` inside shadow DOM.
- `label` is used as the accessible name.
- `loading` disables the button and replaces the slotted icon with `<ui-loader>`.

## Props

| Property   | Attribute   | Type                                                           | Default     |
| ---------- | ----------- | -------------------------------------------------------------- | ----------- |
| `variant`  | `variant`   | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger'` | `'primary'` |
| `size`     | `data-size` | `'small' \| 'default' \| 'large'`                              | `'default'` |
| `loading`  | `loading`   | `boolean`                                                      | `false`     |
| `disabled` | `disabled`  | `boolean`                                                      | `false`     |
| `type`     | `type`      | `'button' \| 'submit' \| 'reset'`                              | `'button'`  |
| `label`    | `label`     | `string`                                                       | —           |

## Slots

| Name    | Description  |
| ------- | ------------ |
| default | Icon content |

## Accessibility notes

- Wraps a native `<button>` in shadow DOM with native keyboard behavior.
- `label` is required for an accessible name because icon-only content has no visible text.
- `loading` sets `aria-busy="true"` and disables interaction.
