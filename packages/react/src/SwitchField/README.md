# `SwitchField`

A React on/off switch that wraps a native `<input type="checkbox" role="switch">`.

## Basic usage

```tsx
<SwitchField label="Email notifications" name="notify" defaultChecked />
```

## Label position

`labelPosition` decides which side the text sits on.

- `'right'` (default) — switch first, then the text. Matches `CheckboxField` and `RadioField`.
- `'left'` — text first, switch pushed to the trailing edge. This is the settings-row layout, so the
  root becomes a full-width block; put it in a container of the width you want.

```tsx
<SwitchField
  labelPosition="left"
  label="Email notifications"
  description="Receive notifications at your email address"
/>
```

## Icons

`iconOn` and `iconOff` render inside the thumb and are independent, so each state can show its own
glyph. Both are optional — with neither set, the thumb stays plain.

```tsx
<SwitchField label="Visibility" iconOn={<IconEye />} iconOff={<IconEyeSlash />} />
```

The icon inherits its colour from `--color-switch-icon-*` / `--color-switch-checked-icon-*`, which
are picked to contrast the thumb on every surface — pass an icon that uses `currentColor`.

## Form integration

Because `SwitchField` renders a native checkbox directly, browser form behavior works without extra
adapters. The switch contributes its `value` only while on and enabled. Use `defaultChecked` in
uncontrolled mode to restore the initial state on `form.reset()`.

## Props

| Prop             | Type                                 | Default     | Description                       |
| ---------------- | ------------------------------------ | ----------- | --------------------------------- |
| `label`          | `string`                             | —           | Visible label text                |
| `description`    | `string`                             | —           | Secondary text under the label    |
| `labelPosition`  | `'left' \| 'right'`                  | `'right'`   | Which side the text sits on       |
| `checked`        | `boolean`                            | —           | Controlled on/off state           |
| `defaultChecked` | `boolean`                            | —           | Initial uncontrolled state        |
| `iconOn`         | `ReactNode`                          | —           | Icon inside the thumb while on    |
| `iconOff`        | `ReactNode`                          | —           | Icon inside the thumb while off   |
| `state`          | `'default' \| 'error' \| 'disabled'` | `'default'` | Visual and disabled state         |
| `disabled`       | `boolean`                            | —           | Disables the input                |
| `name`           | `string`                             | —           | Native input name                 |
| `value`          | `string`                             | `'on'`      | Submitted value while on          |
| `required`       | `boolean`                            | —           | Marks the input as required       |
| `onChange`       | `(checked: boolean) => void`         | —           | Called with the next on/off state |
| `className`      | `string`                             | —           | Extra class on root element       |
| `style`          | `CSSProperties`                      | —           | Inline style on root element      |
| `id`             | `string`                             | —           | Custom input id                   |

## Accessibility notes

- Uses a native `<input type="checkbox">` with `role="switch"`, so keyboard and screen reader
  semantics are native — Space toggles, and the on/off state is announced.
- Error state applies `aria-invalid`; `description` is linked through `aria-describedby`.
- The thumb icon is decorative. Never rely on it alone to convey the state — the `role="switch"`
  checked state is what assistive technology reports.
