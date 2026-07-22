# `<ui-combobox>`

Text input that filters a large option list as you type.

## When to use this instead of `ui-select-field`

|              | `ui-select-field` | `ui-combobox`                            |
| ------------ | ----------------- | ---------------------------------------- |
| Trigger      | button            | text input                               |
| Typing       | no                | filters the list                         |
| List size    | short, scannable  | long enough that scrolling is not enough |
| Multi-select | no                | yes, as chips in the field               |

## Basic usage

```html
<ui-combobox label="Season" placeholder="Search seasons"></ui-combobox>
```

```ts
const el = document.querySelector('ui-combobox');
el.options = [
  { value: '2025', label: '2025/26' },
  { value: '2024', label: '2024/25' },
];
el.addEventListener('ui-change', (e) => console.log(e.detail.value));
```

Options accept groups too — headers stick to the top of the panel while their
group scrolls:

```ts
el.options = [
  { label: 'Current', options: [{ value: '2025', label: '2025/26' }] },
  { label: 'Archive', options: [{ value: '2024', label: '2024/25' }] },
];
```

## Accessibility

Implements the WAI-ARIA combobox pattern. The **input** carries the semantics —
`role="combobox"`, `aria-autocomplete="list"`, `aria-expanded`, `aria-controls`
and `aria-activedescendant` — and focus never leaves it while arrowing through
options. The surrounding box is a plain `div` with no role.

Those last two attributes are id references, and **id references do not resolve
across a shadow boundary**. That is why the options are rendered by the shared
listbox module into this component's own shadow root rather than by a nested
element with a shadow root of its own.

Opening is bound to pointer and keyboard interaction, not to focus: selecting an
option refocuses the input, so a focus-to-open rule would immediately reopen the
list the selection just closed. It also keeps the list from popping open while
tabbing through a form.

## Filtering

| `filter-mode`     | Behaviour                                                                          |
| ----------------- | ---------------------------------------------------------------------------------- |
| `local` (default) | Filters `options` by case-insensitive label match. Empty groups disappear.         |
| `remote`          | Renders `options` exactly as given and emits `ui-filter` with the debounced query. |

```html
<ui-combobox filter-mode="remote" filter-debounce="300"></ui-combobox>
```

```ts
el.addEventListener('ui-filter', async (e) => {
  el.loading = true;
  el.options = await fetchSeasons(e.detail.query);
  el.loading = false;
});
```

## Multiple selection

`multiple` switches `value` for `values` and renders each selection as a
dismissible chip inside the field. The list stays open after each pick, and
**Backspace on an empty query removes the last chip**.

```html
<ui-combobox multiple></ui-combobox>
```

```ts
el.values = ['2025', '2024'];
el.addEventListener('ui-change', (e) => console.log(e.detail.values));
```

## Creating new values

`allow-create` adds a final row offering the typed text as a new option. It is
suppressed when the query already matches an option label exactly, and while
`loading` — there is nothing to create until the results are in.

```ts
el.allowCreate = true;
el.addEventListener('ui-create', (e) => {
  el.options = [...el.options, { value: e.detail.label, label: e.detail.label }];
});
```

Selecting it emits `ui-create` and nothing else: the component never invents a
value, so `value` stays one of the supplied options unless the consumer adds one.

## Form integration

Form-associated via `ElementInternals`. With `name` set, single mode submits one
value; `multiple` appends one entry per selection under the same name.

## Events

| Event              | Detail              | Fires when                                                  |
| ------------------ | ------------------- | ----------------------------------------------------------- |
| `ui-change`        | `{ value, values }` | The selection changes.                                      |
| `ui-filter`        | `{ query }`         | Debounced query change (`filter-debounce`, default 200 ms). |
| `ui-create`        | `{ label }`         | The create row is chosen.                                   |
| `input` / `change` | —                   | Alongside `ui-change`, for native-style listeners.          |

## Slots

| Slot           | Purpose                              |
| -------------- | ------------------------------------ |
| `leading-icon` | Icon inside the field, at the start. |

## Consumer hooks

| Property               | Purpose                                                                      |
| ---------------------- | ---------------------------------------------------------------------------- |
| `--listbox-max-height` | Scroll height of the dropdown; falls back to `--select-dropdown-max-height`. |

## Composition

- **`ui-popover`** (`trigger="manual"`) positions the panel: flips above the
  field when there is no room, and renders in the top layer so no
  `overflow: hidden` ancestor clips it. Its own panel chrome is neutralised via
  `::part(panel)` / `::part(content)` because the surface belongs to the listbox.
- **the listbox module** draws the options, sticky group headers, the empty and
  loading messages, the multi-select check marks and the create row.
- **`ui-chip`** renders each selection in `multiple` mode.
