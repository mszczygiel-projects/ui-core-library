# Web Components SelectField

This document covers form integration and event behavior for the `ui-select-field` component.

## Form behavior

`ui-select-field` is a form-associated custom element (ElementInternals).

### Submit

- If `name` is provided, value is included in `FormData` and native form submit.
- Value sync is managed through `ElementInternals.setFormValue()`.

### Reset

- Form reset restores the component to its initial value captured on connect.
- Open state is closed during reset.

### Disabled from form context

- `formDisabledCallback` is supported and participates in effective disabled state.

## Events

- Native `input` and `change` are emitted on value updates.
- Custom `ui-change` is emitted with `{ value }` detail.
- Clear action (`Enter`, `Space`, mouse) emits value-change events and does not open dropdown.

## Accessibility notes

- Trigger uses `role="combobox"` and controls listbox visibility.
- Listbox naming prefers `aria-labelledby` when label exists, otherwise uses placeholder fallback via `aria-label`.
