# `SelectField`

A React select component with custom trigger/listbox UI and native form semantics via a hidden `<select>`.

## Basic usage

```tsx
<SelectField
  name="country"
  label="Country"
  options={[
    { value: 'pl', label: 'Poland' },
    { value: 'de', label: 'Germany' },
  ]}
/>
```

## Floating list

The dropdown is composed from two primitives rather than positioned by hand:

- **`Popover`** (`trigger="manual"`) does the positioning — it flips above
  the field when there is no room below, shifts to stay in the viewport, and
  renders in the browser top layer so no `overflow: hidden` ancestor can clip
  it. `placement` defaults to `bottom-start`.
- **`Listbox`** renders the options through the `Listbox` component.

The popover's own panel chrome is neutralised with descendant rules on
`.ui-select-field__popover`, because the panel surface belongs to the listbox
(`select-dropdown-*` tokens). The panel is kept as wide as the field by a
`ResizeObserver` that writes `--ui-select-field-dropdown-width`.

## Option groups

`options` accepts either a flat array or an array of groups. Headers stick to
the top of the panel while their group scrolls, and option indices run
continuously across groups.

```tsx
options={[
  { label: 'Recent', options: [{ value: '2025', label: '2025/26' }] },
  { label: 'All seasons', options: [{ value: '2024', label: '2024/25' }] },
]}
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

`SelectField` uses a visually hidden native `<select>` synchronized with the custom UI.

### Submit

If `name` is provided, the current value is included in `FormData` and native form submit.

### Reset

- Uncontrolled mode resets to `defaultValue`.
- Controlled mode stays driven by parent state.

### Validation

`required` is forwarded to the hidden native select, so native form validation works.

## Events

- Main API: `onChange(value)`.
- Clear action (`Enter`, `Space`, mouse) emits `onChange('')`.

## Accessibility notes

- Trigger uses `role="combobox"` and controls listbox state.
- Listbox naming prefers `aria-labelledby` when label exists, otherwise uses placeholder fallback via `aria-label`.

## Props

| Prop             | Type                                              | Default              | Description                                    |
| ---------------- | ------------------------------------------------- | -------------------- | ---------------------------------------------- |
| `variant`        | `'outline' \| 'filled' \| 'underlined'`           | `'outline'`          | Visual style                                   |
| `size`           | `'small' \| 'default' \| 'large'`                 | `'default'`          | Field size                                     |
| `labelPlacement` | `'top' \| 'inner'`                                | `'top'`              | Label position                                 |
| `id`             | `string`                                          | —                    | Base id used for trigger/label/listbox         |
| `label`          | `string`                                          | —                    | Label text                                     |
| `hint`           | `string`                                          | —                    | Helper text                                    |
| `state`          | `'default' \| 'success' \| 'error' \| 'disabled'` | `'default'`          | Visual and disabled state                      |
| `placeholder`    | `string`                                          | `'Select option...'` | Placeholder shown when no value is selected    |
| `value`          | `string`                                          | —                    | Controlled value                               |
| `defaultValue`   | `string`                                          | —                    | Initial uncontrolled value                     |
| `options`        | `SelectOption[]`                                  | `[]`                 | Available options                              |
| `disabled`       | `boolean`                                         | —                    | Disables interaction                           |
| `clearable`      | `boolean`                                         | `false`              | Enables clear control                          |
| `name`           | `string`                                          | —                    | Native form field name                         |
| `required`       | `boolean`                                         | `false`              | Required state for native form validation      |
| `form`           | `string`                                          | —                    | Associates hidden native select with a form id |
| `autoComplete`   | `string`                                          | —                    | Native select autocomplete hint                |
| `ariaInvalid`    | `boolean`                                         | —                    | Forces `aria-invalid` on the trigger           |
| `leadingIcon`    | `ReactNode`                                       | —                    | Icon rendered before the selected value        |
| `onChange`       | `(value: string) => void`                         | —                    | Called when selected value changes             |
| `className`      | `string`                                          | —                    | Extra class on root element                    |
| `style`          | `CSSProperties`                                   | —                    | Inline style on root element                   |

## Types

```ts
type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};
```
