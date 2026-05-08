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

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `'outline' \| 'filled' \| 'underlined'` | `'outline'` | Visual style |
| `size` | `'small' \| 'default' \| 'large'` | `'default'` | Field size |
| `id` | `string` | — | Base id used for trigger/label/listbox |
| `label` | `string` | — | Label text |
| `hint` | `string` | — | Helper text |
| `state` | `'default' \| 'success' \| 'error' \| 'disabled'` | `'default'` | Visual and disabled state |
| `placeholder` | `string` | `'Select option...'` | Placeholder shown when no value is selected |
| `value` | `string` | — | Controlled value |
| `defaultValue` | `string` | — | Initial uncontrolled value |
| `options` | `SelectOption[]` | `[]` | Available options |
| `disabled` | `boolean` | — | Disables interaction |
| `clearable` | `boolean` | `false` | Enables clear control |
| `name` | `string` | — | Native form field name |
| `required` | `boolean` | `false` | Required state for native form validation |
| `form` | `string` | — | Associates hidden native select with a form id |
| `autoComplete` | `string` | — | Native select autocomplete hint |
| `ariaInvalid` | `boolean` | — | Forces `aria-invalid` on the trigger |
| `leadingIcon` | `ReactNode` | — | Optional icon before selected value |
| `onChange` | `(value: string) => void` | — | Called when selected value changes |
| `className` | `string` | — | Extra class on root element |
| `style` | `CSSProperties` | — | Inline style on root element |

## Types

```ts
type SelectOption = {
	value: string;
	label: string;
	disabled?: boolean;
};
```
