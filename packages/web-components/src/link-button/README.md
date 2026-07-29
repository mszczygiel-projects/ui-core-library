# `<ui-link-button>`

A web component link-styled button with visual variants, optional icon slots, and built-in loading/inactive state.

## Basic usage

```html
<ui-link-button href="https://example.com">More information</ui-link-button>
```

## Behavior

- Renders a native `<a>` inside shadow DOM.
- `loading` and `disabled` make the control inactive (`aria-disabled`, `tabindex=-1`) and block navigation on click.
- `loading` replaces the left icon slot with `<ui-loader>`.
- When `target="_blank"` and `rel` is not provided, `rel` defaults to `noopener noreferrer`.

## Props

| Property   | Attribute   | Type                                                           | Default     |
| ---------- | ----------- | -------------------------------------------------------------- | ----------- |
| `variant`  | `variant`   | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger'` | `'primary'` |
| `size`     | `data-size` | `'small' \| 'default' \| 'large'`                              | `'default'` |
| `loading`  | `loading`   | `boolean`                                                      | `false`     |
| `disabled` | `disabled`  | `boolean`                                                      | `false`     |
| `href`     | `href`      | `string`                                                       | `''`        |
| `target`   | `target`    | `string`                                                       | —           |
| `rel`      | `rel`       | `string`                                                       | auto        |
| `label`    | `label`     | `string`                                                       | —           |

## Slots

| Name         | Description               |
| ------------ | ------------------------- |
| default      | Link button label content |
| `icon-left`  | Icon before the label     |
| `icon-right` | Icon after the label      |

## Accessibility notes

- Wraps a native `<a>` in shadow DOM, preserving native link semantics and focus behavior.
- Inactive state is exposed with `aria-disabled="true"`, removed from tab order, and click navigation is prevented.
- Use `label` when slotted content is icon-only or otherwise lacks an accessible name.
