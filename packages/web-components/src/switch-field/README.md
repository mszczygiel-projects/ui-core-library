# `ui-switch-field`

A form-associated on/off switch built on a native `<input type="checkbox" role="switch">` inside a
shadow root.

## Basic usage

```html
<ui-switch-field label="Email notifications" name="notify" checked></ui-switch-field>
```

## Label position

`label-position` decides which side the text sits on.

- `right` (default) — switch first, then the text. Matches `ui-checkbox-field` and `ui-radio-field`.
- `left` — text first, switch pushed to the trailing edge. This is the settings-row layout, so the
  host becomes a full-width block; put it in a container of the width you want.

```html
<ui-switch-field
  label-position="left"
  label="Email notifications"
  description="Receive notifications at your email address"
></ui-switch-field>
```

## Icons

The `icon-on` and `icon-off` slots render inside the thumb and are independent, so each state can
show its own glyph. Both are optional — with neither filled, the thumb stays plain.

```html
<ui-switch-field label="Visibility">
  <span slot="icon-on">${unsafeSVG(svgMap['icon-eye'])}</span>
  <span slot="icon-off">${unsafeSVG(svgMap['icon-eye-slash'])}</span>
</ui-switch-field>
```

The slot wrapper sets `color` from `--color-switch-icon-*` / `--color-switch-checked-icon-*`, which
are picked to contrast the thumb on every surface — pass an icon that uses `currentColor`.

## Form integration

The element is form-associated via `ElementInternals`, so it participates in a `<form>` without a
hidden input. It contributes its `value` only while on and enabled, restores the initial `checked`
attribute on `form.reset()`, and supports state restoration.

## Attributes and properties

| Attribute        | Property        | Type                                 | Default     | Description                    |
| ---------------- | --------------- | ------------------------------------ | ----------- | ------------------------------ |
| `label`          | `label`         | `string`                             | `''`        | Visible label text             |
| `description`    | `description`   | `string`                             | —           | Secondary text under the label |
| `label-position` | `labelPosition` | `'left' \| 'right'`                  | `'right'`   | Which side the text sits on    |
| `checked`        | `checked`       | `boolean`                            | `false`     | On/off state                   |
| `state`          | `state`         | `'default' \| 'error' \| 'disabled'` | `'default'` | Visual and disabled state      |
| `disabled`       | `disabled`      | `boolean`                            | `false`     | Disables the input             |
| —                | `name`          | `string`                             | —           | Form field name                |
| —                | `value`         | `string`                             | `'on'`      | Submitted value while on       |
| `required`       | `required`      | `boolean`                            | `false`     | Marks the switch as required   |

## Slots

| Slot       | Description                                   |
| ---------- | --------------------------------------------- |
| `icon-on`  | Icon inside the thumb while the switch is on  |
| `icon-off` | Icon inside the thumb while the switch is off |

## Events

| Event       | Detail                 | Description                                 |
| ----------- | ---------------------- | ------------------------------------------- |
| `change`    | —                      | Native-like change after user interaction   |
| `ui-change` | `{ checked: boolean }` | Same moment as `change`, with the new state |

## Accessibility notes

- Uses a native `<input type="checkbox">` with `role="switch"`, so keyboard and screen reader
  semantics are native — Space toggles, and the on/off state is announced.
- Error state applies `aria-invalid`; `description` is linked through `aria-describedby`.
- The host uses `delegatesFocus`, so focusing the element lands on the input and the focus ring is
  drawn on the track.
- The thumb icon is decorative. Never rely on it alone to convey the state.
