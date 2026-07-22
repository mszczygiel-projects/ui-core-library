# `<ui-select-field>`

A form-associated web component select with custom trigger/listbox UI.

## Basic usage

```html
<ui-select-field label="Country" name="country"></ui-select-field>

<!-- with leading icon -->
<ui-select-field label="Country" name="country">
  <span slot="leading-icon"><!-- svg --></span>
</ui-select-field>
```

```ts
const el = document.querySelector('ui-select-field');
el.options = [
  { value: 'pl', label: 'Poland' },
  { value: 'de', label: 'Germany' },
];
```

## Floating list

The dropdown is composed from two primitives rather than positioned by hand:

- **`ui-popover`** (`trigger="manual"`) does the positioning — it flips above
  the field when there is no room below, shifts to stay in the viewport, and
  renders in the browser top layer so no `overflow: hidden` ancestor can clip
  it. `placement` defaults to `bottom-start`.
- **the listbox module** renders the options into _this component's own shadow
  root_. That placement is deliberate: `aria-controls` and
  `aria-activedescendant` are id references and id references do not resolve
  across a shadow boundary, so the list has to share a tree with the trigger.

The popover's own panel chrome is neutralised via `::part(panel)` and
`::part(content)`, because the panel surface belongs to the listbox
(`select-dropdown-*` tokens). The panel is kept as wide as the field by a
`ResizeObserver` that writes `--_dropdown-width`.

## Option groups

`options` accepts either a flat array or an array of groups. Headers stick to
the top of the panel while their group scrolls, and option indices run
continuously across groups.

```ts
el.options = [
  { label: 'Recent', options: [{ value: '2025', label: '2025/26' }] },
  { label: 'All seasons', options: [{ value: '2024', label: '2024/25' }] },
];
```

## Label placement

| Value           | Result                                                                  |
| --------------- | ----------------------------------------------------------------------- |
| `top` (default) | Label above the field.                                                  |
| `inner`         | Small label stacked above the value, inside the field.                  |
| `inline`        | Label and value on one line — `Season: 2025/26`. Suited to filter bars. |

The inline label uses the value's type ramp (`control/font-*`) with the label
colour of the current variant and state, separated by `--control-label-inline-gap`.

## Form integration

`ui-select-field` is a form-associated custom element using `ElementInternals`.

### Submit

If `name` is provided, value is included in `FormData`. Value sync is handled via `ElementInternals.setFormValue()`.

### Reset

- Form reset restores the initial value captured on connect.
- Open dropdown state is closed on reset.

### Disabled from form context

`formDisabledCallback` is supported and participates in effective disabled state.

## Events

| Event       | When                      | Detail              |
| ----------- | ------------------------- | ------------------- |
| `input`     | On value update           | —                   |
| `change`    | On committed value update | —                   |
| `ui-change` | Same as `change`          | `{ value: string }` |

Clear action (`Enter`, `Space`, mouse) emits value-change events and does not open the dropdown.

## Accessibility notes

- Trigger uses `role="combobox"` and controls listbox visibility.
- Listbox naming prefers `aria-labelledby` when label exists, otherwise uses placeholder fallback via `aria-label`.

## Props

| Property         | Attribute         | Type                                              | Default              |
| ---------------- | ----------------- | ------------------------------------------------- | -------------------- |
| `variant`        | `variant`         | `'outline' \| 'filled' \| 'underlined'`           | `'outline'`          |
| `size`           | `data-size`       | `'small' \| 'default' \| 'large'`                 | `'default'`          |
| `labelPlacement` | `label-placement` | `'top' \| 'inner'`                                | `'top'`              |
| `label`          | `label`           | `string`                                          | —                    |
| `hint`           | `hint`            | `string`                                          | —                    |
| `state`          | `state`           | `'default' \| 'success' \| 'error' \| 'disabled'` | `'default'`          |
| `placeholder`    | `placeholder`     | `string`                                          | `'Select option...'` |
| `value`          | `value`           | `string`                                          | `''`                 |
| `options`        | —                 | `SelectOption[]`                                  | `[]`                 |
| `disabled`       | `disabled`        | `boolean`                                         | `false`              |
| `clearable`      | `clearable`       | `boolean`                                         | `false`              |
| `name`           | `name`            | `string`                                          | —                    |

## Slots

| Slot           | Description                             |
| -------------- | --------------------------------------- |
| `leading-icon` | Icon rendered before the selected value |

## Types

```ts
type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};
```
