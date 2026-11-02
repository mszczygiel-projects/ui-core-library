# Component API, forms, accessibility and text

## Decision

### Names and vocabulary

- A component has one PascalCase name, such as `TextField`. React exports it under that name, and the web component defines the tag `ui-text-field`.

  | Concept         | Rule                                                                                                                                                                     |
  | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
  | Size            | `size`: `small`, `medium` (default) or `large`, or a subset                                                                                                              |
  | Visual style    | `variant` only. Buttons: `primary`, `secondary`, `outline`, `ghost`, `danger`. Fields: `outline`, `filled`, `underlined`. Badges and notes: `solid`, `subtle`, `outline` |
  | Tone            | `tone`: `neutral`, `brand`, `info`, `success`, `warning`, `error`                                                                                                        |
  | Validation      | `state`: `default`, `error` or `success`; choice controls `default` or `error`. `error` sets `aria-invalid`                                                              |
  | Disabled        | `disabled`, never a value of another prop                                                                                                                                |
  | Checked         | `checked`, as on a native checkbox. A group of options holds the chosen one as `value`                                                                                   |
  | Helper text     | `hint` on controls, `description` on containers                                                                                                                          |
  | Label placement | `labelPlacement`: `top`, `floating`, `inner`, `inline`. Choice controls use `labelPosition`: `start`, `end`                                                              |
  | Orientation     | `orientation`: `vertical` (default) or `horizontal`, the direction of the items of a group                                                                               |
  | Several values  | `multiple`, which makes `value` a list of strings                                                                                                                        |
  | Open popup      | `open`, which the web component reflects; React pairs it with `defaultOpen` and `onOpenChange`                                                                           |
  | Options as data | `options`: options `{ value, label, disabled?, icon? }`, alone or in groups `{ label?, options }`. The empty string is no value                                          |
  | Accessible name | `label`, required where nothing visible names the component                                                                                                              |

- Booleans are false by default and named after the case they turn on, such as `hideLabel`.
- An invalid runtime value falls back to the default with `one-of` from `shared`.

### Pairing the two APIs

- **Events**: the web component dispatches `ui-<kebab>` events with a typed `detail`, and React takes callbacks.
  - A value change is `on<Prop>Change(value, details)` in React and `ui-<prop>-change` in the web component, with `detail.value`.
  - Any other event is `on<Name>` in React and `ui-<name>` in the web component.
  - Native `input`, `change` and `click` keep their native names.
- **Slots and props**: a slot pairs with the camelCase React prop of the same name, and the default slot with `children`.
- **Values**:
  - React offers a controlled `value` and an uncontrolled `defaultValue`.
  - The web component follows native elements: its attribute is the default that a reset restores, and its property holds the current value.
- **Attributes**: React passes `className`, `style` and `data-*` to the root, and `id`, `aria-*` and native attributes to the native control.
- **The host belongs to the page**: a web component reflects only `name`, `disabled`, `readonly` and `open`. It never writes `role`, `aria-*`, `class`, `style` or `tabindex` on its host.
- **Native attributes of the host**: a web component never declares a prop that `HTMLElement` already owns, such as `inputMode`, `enterKeyHint` or `spellcheck`. It passes the native attribute of its host to its inner control, and an author's `aria-label` too.
- **Exceptions**: an exception to these rules is written in the component's specification with its reason.

### Forms

- Web components are form-associated with `ElementInternals`. They:
  - submit their value and copy the validity of their inner native control;
  - follow reset, restore and disabled fieldsets;
  - expose `form`, `validity`, `validationMessage`, `willValidate`, `checkValidity()` and `reportValidity()`.
- React renders native controls, so the browser validates and submits them.
- Submitted values are canonical: a date is `YYYY-MM-DD`, a number uses a dot and no grouping, several values are several entries, and a range is `start/end`.
- NumberField and DateField keep editable text separate from the canonical value. React uses a visible text input for focus and validity and one hidden named input for submission, both associated with the same form. The ref exposes display text. ElementInternals submits one canonical entry and saves draft text with its locale.
- Parsed fields preserve incomplete and invalid text. Their value event adds `text`, `inputState` and `validationError` to `originalEvent`; one event accompanies every user edit, even if its parsed value remains empty. Parsing and constraint failures use `customError`, empty required fields use `valueMissing`. Visual error appears after blur or failed validation; explicit `state="error"` does not create a constraint failure.
- NumberField uses `number | null`, a positive step grid from min or zero, and optional maximum decimal precision without rounding or clamping. Each step activation changes once. DateField uses one Gregorian ISO calendar date or an empty string, a numeric locale mask and optional excluded dates, without a calendar or range.

### Accessibility

- WCAG 2.2 AA in every theme, surface and density, and a WAI-ARIA pattern per component.
- A control with an inner native control keeps its semantics on that control, and its host has no duplicate role.
- Labels, hints and errors render in the same root as the control and link to it.
- Focus shows only on `:focus-visible`, as an outline drawn with the focus-ring tokens.
- No interactive element is nested in another. Targets are at least 24 × 24 px.
- Components respect `prefers-reduced-motion` and `forced-colors`.

### Text

- Text a component renders on its own comes from a prop (`<key>Label`, or `get<Key>Label` for text with a value), then from `labels.<component>.<key>` in the configuration.
- The packages ship English labels.
- A lint rule rejects literal text in JSX.
- Formats follow the `locale` prop, then the configured locale, then the browser's language after hydration, then English.
- A parsed field freezes its grammar during editing and never reinterprets an incomplete draft after a locale change. Server rendering and the first hydration render use identical locale inputs.
- Components follow `dir`: logical properties, arrow keys in reading order, and mirrored directional icons.

## Why

One vocabulary lets designers, developers and agents read every component the same way. Pairing rules let one contract test both implementations.

## Rejected

- A controlled mode in the web component: a framework that binds one way would freeze the field.
- Text in templates: it could not be translated.
