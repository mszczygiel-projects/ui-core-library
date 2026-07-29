# `Combobox`

Text input that filters a large option list as you type.

## When to use this instead of `SelectField`

|              | `SelectField`    | `Combobox`                               |
| ------------ | ---------------- | ---------------------------------------- |
| Trigger      | button           | text input                               |
| Typing       | no               | filters the list                         |
| List size    | short, scannable | long enough that scrolling is not enough |
| Multi-select | no               | yes, as chips in the field               |

## Basic usage

```tsx
const [value, setValue] = useState('');

<Combobox
  label="Season"
  placeholder="Search seasons"
  options={[
    { value: '2025', label: '2025/26' },
    { value: '2024', label: '2024/25' },
  ]}
  value={value}
  onChange={setValue}
/>;
```

Options accept groups too — headers stick to the top of the panel while their
group scrolls:

```tsx
options={[
  { label: 'Current', options: [{ value: '2025', label: '2025/26' }] },
  { label: 'Archive', options: [{ value: '2024', label: '2024/25' }] },
]}
```

## Accessibility

Implements the WAI-ARIA combobox pattern. The **input** carries the semantics —
`role="combobox"`, `aria-autocomplete="list"`, `aria-expanded`, `aria-controls`
and `aria-activedescendant` — and focus never leaves it while arrowing through
options. The surrounding box is a plain `div` with no role.

Opening is bound to pointer and keyboard interaction, not to focus: selecting an
option refocuses the input, so a focus-to-open rule would immediately reopen the
list the selection just closed. It also keeps the list from popping open while
tabbing through a form.

## Filtering

| `filterMode`      | Behaviour                                                                         |
| ----------------- | --------------------------------------------------------------------------------- |
| `local` (default) | Filters `options` by case-insensitive label match. Empty groups disappear.        |
| `remote`          | Renders `options` exactly as given and calls `onFilter` with the debounced query. |

```tsx
<Combobox
  filterMode="remote"
  filterDebounce={300}
  loading={loading}
  options={options}
  onFilter={async (query) => {
    setLoading(true);
    setOptions(await fetchSeasons(query));
    setLoading(false);
  }}
/>
```

## Multiple selection

`multiple` switches `value` for `values` and renders each selection as a
dismissible chip inside the field. The list stays open after each pick, and
**Backspace on an empty query removes the last chip**.

```tsx
const [values, setValues] = useState<string[]>([]);

<Combobox multiple values={values} onValuesChange={setValues} options={options} />;
```

## Creating new values

`allowCreate` adds a final row offering the typed text as a new option. It is
suppressed when the query already matches an option label exactly, and while
`loading` — there is nothing to create until the results are in.

```tsx
<Combobox
  allowCreate
  options={options}
  onCreate={(label) => setOptions((current) => [...current, { value: label, label }])}
/>
```

Selecting it calls `onCreate` and nothing else: the component never invents a
value, so `value` stays one of the supplied options unless the consumer adds one.

## Callbacks

| Prop             | Argument | Fires when                                                 |
| ---------------- | -------- | ---------------------------------------------------------- |
| `onChange`       | `value`  | A selection is made in single mode.                        |
| `onValuesChange` | `values` | The selection changes in `multiple` mode.                  |
| `onFilter`       | `query`  | Debounced query change (`filterDebounce`, default 200 ms). |
| `onCreate`       | `label`  | The create row is chosen.                                  |

The component is fully controlled: it renders `value` / `values` as given and
never mutates them.

## Leading icon

Pass any node through `leadingIcon`:

```tsx
<Combobox leadingIcon={<IconSearch />} options={options} />
```

## Consumer hooks

| Property               | Purpose                                                                      |
| ---------------------- | ---------------------------------------------------------------------------- |
| `--listbox-max-height` | Scroll height of the dropdown; falls back to `--select-dropdown-max-height`. |

## Composition

- **`Popover`** (`trigger="manual"`) positions the panel: flips above the
  field when there is no room, and renders in the top layer so no
  `overflow: hidden` ancestor clips it. Its own panel chrome is neutralised via
  descendant rules on `.ui-combobox__popover` because the surface belongs to the
  listbox.
- **`Listbox`** draws the options, sticky group headers, the empty and
  loading messages, the multi-select check marks and the create row.
- **`Chip`** renders each selection in `multiple` mode.
