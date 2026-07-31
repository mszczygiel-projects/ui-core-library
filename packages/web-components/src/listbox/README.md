# Listbox (Web Components)

Shared option-list surface behind `ui-select-field` and `ui-combobox`: options,
sticky group headers, empty and loading messages, multi-select check marks and
the create affordance.

## Why this is a module, not an element

There is no `<ui-listbox>` tag. `aria-activedescendant` and `aria-controls` are
**id references, and id references do not resolve across a shadow boundary** —
a trigger inside `ui-combobox`'s shadow root cannot point at an option inside a
nested element's shadow root.

So the list is rendered as a function into the _caller's_ shadow root. The
trigger and the options end up in one tree and the ARIA relationships hold.
Consumers add `listboxStyles` to their `static styles` and call
`renderListbox()` from their own `render()`.

The React package has no such constraint and ships a real `<Listbox>` component.

## Usage

```ts
import { listboxStyles, renderListbox, buildRows, nextEnabledRow } from '../listbox/listbox.js';

static override styles = [resetStyles, listboxStyles, myComponentStyles];

override render() {
  return html`
    <input
      role="combobox"
      aria-controls="my-list"
      aria-activedescendant=${this._activeIndex >= 0
        ? listboxOptionId('my-list', this._activeIndex)
        : nothing}
    />
    ${renderListbox({
      idPrefix: 'my-list',
      items: this.options,
      value: this.value,
      activeIndex: this._activeIndex,
      onSelect: (row) => this._select(row),
      onActivate: (index) => (this._activeIndex = index),
    })}
  `;
}
```

## Option anatomy

A row is `[icon?] [label] [checkbox?]`, matching the Figma OptionItem:

- **Leading icon** — set `icon` on the option to a name from the icon package.
  It inherits the row's text colour, so it tracks hover, active and disabled
  states without extra tokens.
- **Checkbox** — in `multiple` mode the selected indicator is a real checkbox
  that **trails** the label, styled from the `checkbox/*` tokens so it stays in
  step with `ui-checkbox-field`.

```ts
el.options = [{ value: 'settings', label: 'Settings', icon: 'icon-settings' }];
```

- **Selection vs. highlight** — in single-select the chosen row is painted with
  the active surface. In `multiple` the checkbox carries the selection and the
  row keeps its neutral background, so the active surface stays free for the
  keyboard-highlighted row; five selections would otherwise read as a wall of
  colour. `aria-selected` is set the same way in both modes.

## Grouped layout

Grouped lists move the inline padding from the panel onto each group's option
wrapper (`.listbox--grouped`). That lets the sticky header and its bottom rule
run the full width of the panel while the options stay inset. Headers are at
least `--size-12` tall. Everything in the panel — headers, separators and
option wrappers alike — is spaced by `--select-dropdown-gap`.

A group whose `label` is omitted takes the header's **border-only** variant: no
text, no sticky behaviour, just the rule (`.listbox__group-separator`). Use it
to divide runs of options that need no naming. A rule above the _first_ group
would separate it from nothing, so it is left out, and the group drops its
`aria-labelledby` rather than pointing at an empty name.

```ts
el.options = [
  { options: [{ value: 'lemon', label: 'Lemon' }] },
  { options: [{ value: 'peach', label: 'Peach' }] }, // preceded by a bare rule
];
```

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
ends rather than wrapping, matching the previous select behaviour.

## Surface ownership

The list draws its own panel — background, border, radius, padding, max-height
and scrolling — from the `select-dropdown-*` tokens, so it also works inline
without a popover. When floated inside `ui-popover`, neutralise the popover
chrome so the two surfaces do not stack:

```css
ui-popover::part(panel) {
  background: none;
  border: none;
  box-shadow: none;
}
ui-popover::part(content) {
  padding: 0;
}
```

## Tokens

| Area            | Tokens                                                                                                                                                                                                                     |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Panel           | `--color-select-dropdown-background`, `--color-select-dropdown-border`, `--select-dropdown-padding`, `--select-dropdown-gap`, `--select-dropdown-radius`, `--select-dropdown-border-width`, `--select-dropdown-max-height` |
| Option          | `--color-select-option-{background,text,icon}-{default,hover,active,disabled}`, `--select-option-{gap,padding-inline,padding-stack,radius}`                                                                                |
| Group header    | `--color-select-option-group-{text,background}`, `--select-option-group-*`                                                                                                                                                 |
| Check mark      | `--color-select-option-check-{default,active}`                                                                                                                                                                             |
| Create row      | `--color-select-option-create-text`                                                                                                                                                                                        |
| Empty / loading | `--color-select-empty-text`                                                                                                                                                                                                |

The check mark is drawn in CSS the same way `ui-checkbox-field` draws its own —
the icon set has no check glyph.

## Consumer hooks

| Property               | Purpose                                                                    |
| ---------------------- | -------------------------------------------------------------------------- |
| `--listbox-max-height` | Overrides the scroll height; falls back to `--select-dropdown-max-height`. |
