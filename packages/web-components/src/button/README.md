# `<ui-button>`

A web component button with visual variants, optional icon slots, and built-in loading state.

## Basic usage

```html
<ui-button variant="primary">Save</ui-button>
```

## Behavior

- Renders a native `<button>` inside shadow DOM.
- `loading` disables the button and replaces the left icon slot with `<ui-loader>`.
- `type` defaults to `button`.

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

| Name         | Description           |
| ------------ | --------------------- |
| default      | Button label content  |
| `icon-left`  | Icon before the label |
| `icon-right` | Icon after the label  |

## Accessibility notes

- Wraps a native `<button>` in shadow DOM, preserving native button keyboard and semantic behavior.
- Use `label` when slot content is icon-only or otherwise lacks an accessible name.
- `loading` sets `aria-busy="true"` and disables interaction.
