# `<ui-number-field>`

A form-associated numeric input with optional flanking stepper buttons. Shares the field chrome with [`<ui-text-field>`](../text-field/README.md).

## Basic usage

```html
<ui-number-field label="Quantity" name="qty" min="1" max="99"></ui-number-field>
```

## Bare rendering

There is no separate "atomic" variant. Omit `label` and `hint` and the component renders a bare input with no surrounding chrome — suitable for an inline table-cell quantity editor or a compact toolbar.

```html
<ui-number-field controls="inline" min="1" max="99" value="1"></ui-number-field>
```

## Stepper controls

`controls="inline"` adds a decrement button before the value and an increment button after it.

```html
<ui-number-field label="Quantity" controls="inline" min="1" max="99" value="12"></ui-number-field>
```

Press-and-hold repeats the step: the first tick fires on `pointerdown`, repetition starts after **500 ms** and then runs at a fixed **100 ms** per tick (no acceleration curve). A hold stops on release, on pointer-cancel, when the pointer leaves the button, and the instant the value reaches `min`/`max` — at which point the button also becomes visually disabled, exactly as in the discrete-click case. Release is tracked on `window`, so letting go outside the button still stops the repeat, and `disconnectedCallback` clears the timers so an element removed mid-hold never leaves a dangling interval.

Holding <kbd>ArrowUp</kbd>/<kbd>ArrowDown</kbd> needs no timer logic — native OS key-repeat already fires repeated `keydown` events.

## Decimals

`precision` sets the number of decimal places kept on commit. It is deliberately independent of `step`.

```html
<ui-number-field
  label="Weight (kg)"
  precision="2"
  step="0.1"
  min="0"
  max="10"
  value="2.5"
></ui-number-field>
```

Typing is never fought mid-edit: with `precision="2"` you can type `1.` or `1.5` transiently without it being rewritten on every keystroke. Rounding and clamping happen only on commit, and the value is re-rounded after every step so repeated clicks cannot leak `2.3000000000000003` into the input.

## Commit semantics

`ui-change` fires on **commit**, not on every keystroke — on blur, <kbd>Enter</kbd>, an arrow key, or a stepper click / hold tick. Clearing the field commits `null`. On commit the value is **rounded first, then clamped**.

Use `ui-input` if you need the raw text on every keystroke.

## Attributes / properties

| Attribute         | Property         | Type                                              | Default      | Description                                 |
| ----------------- | ---------------- | ------------------------------------------------- | ------------ | ------------------------------------------- |
| `value`           | `value`          | `number \| null`                                  | `null`       | Current value; also restored on form reset  |
| `min`             | `min`            | `number`                                          | `-Infinity`  | Lower bound, applied on commit              |
| `max`             | `max`            | `number`                                          | `Infinity`   | Upper bound, applied on commit              |
| `step`            | `step`           | `number`                                          | `1`          | Amount added or removed per step            |
| `precision`       | `precision`      | `number`                                          | `0`          | Decimal places kept on commit               |
| `controls`        | `controls`       | `'none' \| 'inline'`                              | `'none'`     | `inline` adds flanking stepper buttons      |
| `variant`         | `variant`        | `'outline' \| 'filled' \| 'underlined'`           | `'outline'`  | Visual style                                |
| `data-size`       | `size`           | `'small' \| 'default' \| 'large'`                 | `'default'`  | Field size                                  |
| `label`           | `label`          | `string`                                          | —            | Label text; omit for a bare field           |
| `label-placement` | `labelPlacement` | `'top' \| 'floating' \| 'inner'`                  | `'top'`      | Forced to `top` when `controls` is `inline` |
| `hint`            | `hint`           | `string`                                          | —            | Helper text below the field                 |
| `placeholder`     | `placeholder`    | `string`                                          | `''`         | Placeholder shown while empty               |
| `state`           | `state`          | `'default' \| 'success' \| 'error' \| 'disabled'` | `'default'`  | Visual and a11y state                       |
| `name`            | `name`           | `string`                                          | —            | Form field name used on submission          |
| `disabled`        | `disabled`       | `boolean`                                         | `false`      | Disables the input and both steppers        |
| `required`        | `required`       | `boolean`                                         | `false`      | Marks the field as required                 |
| `readonly`        | `readonly`       | `boolean`                                         | `false`      | Read-only input; steppers disabled too      |
| `decrement-label` | `decrementLabel` | `string`                                          | `'Decrease'` | Accessible name for the decrement button    |
| `increment-label` | `incrementLabel` | `string`                                          | `'Increase'` | Accessible name for the increment button    |

## Events

| Event       | Detail                      | When                                     |
| ----------- | --------------------------- | ---------------------------------------- |
| `input`     | —                           | Every keystroke                          |
| `ui-input`  | `{ value: string }`         | Every keystroke; carries the raw text    |
| `change`    | —                           | On commit, when the value actually moved |
| `ui-change` | `{ value: number \| null }` | On commit; carries the committed number  |

## Form integration

The element is form-associated: it submits under `name`, is excluded when disabled, and restores its initial `value` on `form.reset()`.

## Accessibility notes

- The input carries `role="spinbutton"` with `aria-valuenow` / `aria-valuemin` / `aria-valuemax`.
- Stepper buttons are keyboard-focusable and carry accessible names via `decrement-label` / `increment-label`.
- `inputmode` is `decimal` when `precision > 0` and `numeric` otherwise.
- Error state sets `aria-invalid`; helper text is linked via `aria-describedby`.
