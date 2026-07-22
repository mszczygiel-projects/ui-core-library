# `NumberField`

A React numeric input with optional flanking stepper buttons, built on [`TextField`](../TextField/README.md).

## Basic usage

```tsx
<NumberField label="Quantity" name="qty" min={1} max={99} onValueChange={setQty} />
```

## Bare rendering

There is no separate "atomic" variant. Omit `label` and `hint` and the component renders a bare input with no surrounding chrome — suitable for an inline table-cell quantity editor or a compact toolbar.

```tsx
<NumberField controls="inline" min={1} max={99} defaultValue={1} />
```

## Stepper controls

`controls="inline"` adds a decrement button before the value and an increment button after it.

```tsx
<NumberField label="Quantity" controls="inline" min={1} max={99} defaultValue={12} />
```

Press-and-hold repeats the step: the first tick fires on `pointerdown`, repetition starts after **500 ms** and then runs at a fixed **100 ms** per tick (no acceleration curve). A hold stops on release, on pointer-cancel, when the pointer leaves the button, and the instant the value reaches `min`/`max` — at which point the button also becomes visually disabled, exactly as in the discrete-click case. Timers are cleared on unmount, so a component removed mid-hold never leaves a dangling interval.

Holding <kbd>ArrowUp</kbd>/<kbd>ArrowDown</kbd> needs no timer logic — native OS key-repeat already fires repeated `keydown` events.

## Decimals

`precision` sets the number of decimal places kept on commit. It is deliberately independent of `step`; pair them explicitly if you want fine-grained stepping.

```tsx
<NumberField label="Weight (kg)" precision={2} step={0.1} min={0} max={10} defaultValue={2.5} />
```

Typing is never fought mid-edit: with `precision={2}` you can type `1.` or `1.5` transiently without it being rewritten on every keystroke. Rounding and clamping happen only on commit.

Arithmetic is float-safe — the value is re-rounded after every step, so repeated stepper clicks cannot leak `2.3000000000000003` into the input.

## Commit semantics

`onValueChange` fires on **commit**, not on every keystroke. A commit happens on blur, <kbd>Enter</kbd>, an arrow key, or a stepper click / hold tick. Clearing the field commits `null`.

On commit the value is **rounded first, then clamped** — rounding can push a value just past a bound, so the clamp has to be the final word.

## Props

| Prop             | Type                                              | Default      | Description                                 |
| ---------------- | ------------------------------------------------- | ------------ | ------------------------------------------- |
| `value`          | `number \| null`                                  | —            | Controlled value; `null` means empty        |
| `defaultValue`   | `number`                                          | —            | Initial value in uncontrolled mode          |
| `min`            | `number`                                          | `-Infinity`  | Lower bound, applied on commit              |
| `max`            | `number`                                          | `Infinity`   | Upper bound, applied on commit              |
| `step`           | `number`                                          | `1`          | Amount added or removed per step            |
| `precision`      | `number`                                          | `0`          | Decimal places kept on commit               |
| `controls`       | `'none' \| 'inline'`                              | `'none'`     | `inline` adds flanking stepper buttons      |
| `variant`        | `'outline' \| 'filled' \| 'underlined'`           | `'outline'`  | Visual style                                |
| `size`           | `'small' \| 'default' \| 'large'`                 | `'default'`  | Field size                                  |
| `label`          | `string`                                          | —            | Label text; omit for a bare field           |
| `labelPlacement` | `'top' \| 'floating' \| 'inner'`                  | `'top'`      | Forced to `top` when `controls` is `inline` |
| `hint`           | `string`                                          | —            | Helper text below the field                 |
| `placeholder`    | `string`                                          | —            | Placeholder shown while empty               |
| `state`          | `'default' \| 'success' \| 'error' \| 'disabled'` | `'default'`  | Visual and a11y state                       |
| `name`           | `string`                                          | —            | Native form field name                      |
| `disabled`       | `boolean`                                         | `false`      | Disables the input and both steppers        |
| `required`       | `boolean`                                         | `false`      | Marks the field as required                 |
| `readOnly`       | `boolean`                                         | `false`      | Read-only input; steppers disabled too      |
| `decrementLabel` | `string`                                          | `'Decrease'` | Accessible name for the decrement button    |
| `incrementLabel` | `string`                                          | `'Increase'` | Accessible name for the increment button    |
| `onValueChange`  | `(value: number \| null) => void`                 | —            | Called on commit                            |
| `className`      | `string`                                          | —            | Extra class on root element                 |
| `style`          | `CSSProperties`                                   | —            | Inline style on root element                |

## Accessibility notes

- The input carries `role="spinbutton"` with `aria-valuenow` / `aria-valuemin` / `aria-valuemax`.
- Stepper buttons are keyboard-focusable and carry accessible names via `decrementLabel` / `incrementLabel`.
- `inputmode` is `decimal` when `precision > 0` and `numeric` otherwise, so touch keyboards match the accepted input.
- Error state sets `aria-invalid`; helper text is linked via `aria-describedby`.
