# Listbox (React)

Option-list surface shared by `SelectField` and `Combobox`: options, sticky
group headers, empty and loading messages, multi-select check marks and the
create affordance.

Presentational and fully controlled — it owns no state and does no positioning.
The consumer keeps `activeIndex`, handles keyboard navigation with the exported
helpers, and wraps the list in a `Popover` when it needs to float.

## Usage

```tsx
const [value, setValue] = useState('');
const [activeIndex, setActiveIndex] = useState(-1);
const rows = buildRows(items);

<input
  role="combobox"
  aria-controls="season-list"
  aria-activedescendant={activeIndex >= 0 ? listboxOptionId('season-list', activeIndex) : undefined}
  onKeyDown={(e) => {
    if (e.key === 'ArrowDown') setActiveIndex(nextEnabledRow(rows, activeIndex, 1));
    if (e.key === 'ArrowUp') setActiveIndex(nextEnabledRow(rows, activeIndex, -1));
  }}
/>
<Listbox
  idPrefix="season-list"
  items={items}
  value={value}
  activeIndex={activeIndex}
  onSelect={(row) => row.kind === 'option' && setValue(row.option.value)}
  onActivate={setActiveIndex}
/>
```

## Items

Flat or grouped, never mixed:

```tsx
const flat = [{ value: '2025', label: '2025/26' }];
const grouped = [{ label: 'Recent', options: [{ value: '2025', label: '2025/26' }] }];
```

## Option anatomy

A row is `[icon?] [label] [checkbox?]`, matching the Figma OptionItem:

- **Leading icon** — set `icon` on the option to any node.
  It inherits the row's text colour, so it tracks hover, active and disabled
  states without extra tokens.
- **Checkbox** — in `multiple` mode the selected indicator is a real checkbox
  that **trails** the label, styled from the `checkbox/*` tokens so it stays in
  step with `CheckboxField`.

```tsx
items={[{ value: 'settings', label: 'Settings', icon: <IconSettings /> }]}
```

- **Selection vs. highlight** — in single-select the chosen row is painted with
  the active surface. In `multiple` the checkbox carries the selection and the
  row keeps its neutral background, so the active surface stays free for the
  keyboard-highlighted row; five selections would otherwise read as a wall of
  colour. `aria-selected` is set the same way in both modes.

## Grouped layout

Grouped lists move the inline padding from the panel onto each group's option
wrapper (`.ui-listbox--grouped`). That lets the sticky header and its bottom rule
run the full width of the panel while the options stay inset. Headers are at
least `--size-12` tall. Everything in the panel — headers, separators and
option wrappers alike — is spaced by `--select-dropdown-gap`.

A group whose `label` is omitted takes the header's **border-only** variant: no
text, no sticky behaviour, just the rule (`.ui-listbox__group-separator`). Use
it to divide runs of options that need no naming. A rule above the _first_ group
would separate it from nothing, so it is left out, and the group drops its
`aria-labelledby` rather than pointing at an empty name.

```tsx
items={[
  { options: [{ value: 'lemon', label: 'Lemon' }] },
  { options: [{ value: 'peach', label: 'Peach' }] }, // preceded by a bare rule
]}
```

`SelectField`'s native `<select>` mirror follows suit: an unlabelled group
contributes its `<option>`s flat, since a nameless `<optgroup>` shows up as an
empty row in the platform menu.

## Rows

Arrow keys move through **rows**, not options. A row is every option (disabled
ones included, so they can be skipped) plus the optional create affordance,
which is always last. Group headers are not rows — they are not selectable.

The create row is split in two: `createLabel` (default `Create`) is the leading
word and carries the strong weight, while `createValue` — the pending query —
follows it in quotes at the regular weight. Passing a `createValue` is what
makes the row appear at all.

`buildRows(items, createValue)` produces that list; `nextEnabledRow`,
`firstEnabledRow` and `rowIndexOfValue` operate on it. Navigation stops at the
ends rather than wrapping.

`onSelect` receives the row, so the create affordance is distinguishable:

```tsx
onSelect={(row) => {
  if (row.kind === 'create') createOption(query);
  else setValue(row.option.value);
}}
```

## Surface ownership

The list draws its own panel from the `select-dropdown-*` tokens, so it also
works inline without a popover. When floated inside `Popover`, neutralise the
popover chrome so the two surfaces do not stack:

```css
.my-field__popover .ui-popover__panel {
  background: none;
  border: none;
  box-shadow: none;
}
.my-field__popover .ui-popover__content {
  padding: 0;
}
```

## Consumer hooks

| Property               | Purpose                                                                    |
| ---------------------- | -------------------------------------------------------------------------- |
| `--listbox-max-height` | Overrides the scroll height; falls back to `--select-dropdown-max-height`. |
