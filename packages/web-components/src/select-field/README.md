# `<ui-select-field>`

A form-associated web component select with custom trigger/listbox UI.

## Basic usage

```html
<ui-select-field label="Country" name="country"></ui-select-field>
```

```ts
const el = document.querySelector('ui-select-field');
el.options = [
	{ value: 'pl', label: 'Poland' },
	{ value: 'de', label: 'Germany' },
];
```

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

| Event | When | Detail |
| --- | --- | --- |
| `input` | On value update | — |
| `change` | On committed value update | — |
| `ui-change` | Same as `change` | `{ value: string }` |

Clear action (`Enter`, `Space`, mouse) emits value-change events and does not open the dropdown.

## Accessibility notes

- Trigger uses `role="combobox"` and controls listbox visibility.
- Listbox naming prefers `aria-labelledby` when label exists, otherwise uses placeholder fallback via `aria-label`.

## Props

| Property | Attribute | Type | Default |
| --- | --- | --- | --- |
| `variant` | `variant` | `'outline' \| 'filled' \| 'underlined'` | `'outline'` |
| `size` | `data-size` | `'small' \| 'default' \| 'large'` | `'default'` |
| `label` | `label` | `string` | — |
| `hint` | `hint` | `string` | — |
| `state` | `state` | `'default' \| 'success' \| 'error' \| 'disabled'` | `'default'` |
| `placeholder` | `placeholder` | `string` | `'Select option...'` |
| `value` | `value` | `string` | `''` |
| `options` | — | `SelectOption[]` | `[]` |
| `disabled` | `disabled` | `boolean` | `false` |
| `clearable` | `clearable` | `boolean` | `false` |
| `name` | `name` | `string` | — |

## Types

```ts
type SelectOption = {
	value: string;
	label: string;
	disabled?: boolean;
};
```
