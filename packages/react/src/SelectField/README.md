# React SelectField

This document covers form integration and event behavior for the React SelectField implementation.

## Form behavior

SelectField uses a custom UI for rendering and interactions, and a visually hidden native `select` for form semantics.

### Submit

- If `name` is provided, value is included in `FormData` and native form submit.
- Hidden native select mirrors options and current value.

### Reset

- Uncontrolled mode: resets to `defaultValue`.
- Controlled mode: parent state remains source of truth.

### Validation

- `required` is forwarded to the hidden native select.
- Native form validity (`form.checkValidity()`) works with the select value.

## Events

- Main API: `onChange(value)`.
- Clear action (`Enter`, `Space`, mouse) emits `onChange('')`.

## Accessibility notes

- Trigger uses `role="combobox"` and controls listbox state.
- Listbox naming prefers `aria-labelledby` when label exists, otherwise uses placeholder fallback via `aria-label`.
