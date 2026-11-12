# Component API, forms, accessibility and text

## Decision

### Names and vocabulary

- A component has one PascalCase name, such as `TextField`. React exports it under that name, and the web component defines the tag `ui-text-field`.

  | Concept         | Rule                                                                                                                                                                                                                              |
  | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | Size            | `size`: `small`, `medium` (default) or `large`, or a subset                                                                                                                                                                       |
  | Visual style    | `variant` only. Buttons: `primary`, `secondary`, `outline`, `ghost`, `danger`. Fields: `outline`, `filled`, `underlined`. Badges and notifications: `solid`, `subtle`. Chips: `outline`, `subtle`. Tabs: `underline`, `segmented` |
  | Tone            | `tone`: `neutral`, `brand`, `info`, `success`, `warning`, `error`                                                                                                                                                                 |
  | Shape           | `shape`: `square` or `rounded`, the corners. Badge defaults to `rounded`, the actions to `square`                                                                                                                                 |
  | Validation      | `state`: `default`, `error` or `success`; choice controls `default` or `error`. `error` sets `aria-invalid`                                                                                                                       |
  | Disabled        | `disabled`, never a value of another prop                                                                                                                                                                                         |
  | Checked         | `checked`, as on a native checkbox. A group of options holds the chosen one as `value`                                                                                                                                            |
  | Helper text     | `hint` on controls, `description` on containers                                                                                                                                                                                   |
  | Hidden label    | `hideLabel` hides the visible label of a field, which still names the control                                                                                                                                                     |
  | Label hint      | `labelHint`: short text at the end of the label row, such as a count of characters that the author writes. It joins the description of the control                                                                                |
  | Free content    | slots `leading` and `trailing`, with any content an author styles, such as an icon or a status dot of Badge                                                                                                                       |
  | Label placement | `labelPlacement`: `top`, `floating`, `inner`, `inline`. Choice controls use `labelPosition`: `start`, `end`                                                                                                                       |
  | Orientation     | `orientation`: `vertical` (default) or `horizontal`, the direction of the items of a group                                                                                                                                        |
  | Several values  | `multiple`, which makes `value` a list of strings                                                                                                                                                                                 |
  | Open popup      | `open`, which the web component reflects; React pairs it with `defaultOpen` and `onOpenChange`                                                                                                                                    |
  | Options as data | `options`: options `{ value, label, disabled?, icon? }`, alone or in groups `{ label?, options }`. The empty string is no value                                                                                                   |
  | Accessible name | `label`, required where nothing visible names the component                                                                                                                                                                       |
  | Modal           | `open` as for a popup. A request to close carries a `reason`: `escape`, `backdrop`, `close-button`, `drag` or `form`, with the `returnValue` of the form                                                                          |
  | Edge            | `placement`: `start`, `end` or `bottom`; `start` and `end` follow the direction of the text. A popup beside its trigger adds `top`                                                                                                |

- Booleans are false by default and named after the case they turn on, such as `hideLabel`.
- A modal closes at the request of the user. The web component dispatches a cancelable `ui-open-change` first and closes unless the page cancels it; React calls `onOpenChange(false, details)`, and a controlled modal closes when its parent agrees. A close that the browser forces cannot be refused, and setting `open` reports nothing. `alert` makes a dialog an alert dialog that a press on the backdrop does not close, `hideCloseButton` removes its close button, and `dragToDismiss` lets the user drag a sheet down to close it. The element marked with `autofocus` or `data-autofocus` takes the focus when a modal opens, since React's `autoFocus` sets no attribute.
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
- **Native attributes of the host**: a web component never declares a prop that `HTMLElement` already owns, such as `inputMode`, `enterKeyHint` or `spellcheck`. It passes the native attribute of its host to its inner control, and an author's `aria-label` too. Button and IconButton also pass `aria-expanded` and `aria-haspopup`, and all three actions pass the elements of `ariaDescribedByElements`, so that a popup can announce and describe its trigger. A link opens no popup, so LinkButton passes only the description.
- **The trigger of a popup**: Popover, Menu and Tooltip write the relationship on the element of their trigger, which the page gives them: `aria-expanded` and `aria-haspopup` for Popover and Menu, `ariaDescribedByElements` for Tooltip. They never write anything else on it, nor on their own host.
- **One native click per action**: the native `click` of a component is its main action. A component with more than one action, such as SplitButton, keeps the presses of its other buttons inside it and reports their actions as `ui-action` and `onAction`; in React `onClick` goes to the main native button.
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
- A query that a user types to filter options is never a value. It is reported as `ui-query-change` and `onQueryChange(query, details)`, and `filterMode` (`local` or `remote`) says whether the component filters the options or the author does from the query.
- NumberField uses `number | null`, a positive step grid from min or zero, and optional maximum decimal precision without rounding or clamping. Each step activation changes once. DateField uses one Gregorian ISO calendar date or an empty string, a numeric locale mask and optional excluded dates, optionally with a calendar, without a range. A date picker is DateField with its calendar, not a component of its own: a button after the input, shown unless `hideCalendarButton`, opens Calendar in a modal dialog with `open` and `ui-open-change`, and a picked day is one edit of the field.

### Accessibility

- WCAG 2.2 AA in every theme, surface and density, and a WAI-ARIA pattern per component.
- A control with an inner native control keeps its semantics on that control, and its host has no duplicate role.
- Labels, hints and errors render in the same root as the control and link to it.
- Focus shows only on `:focus-visible`, as an outline drawn with the focus-ring tokens.
- No interactive element is nested in another. Targets are at least 24 × 24 px.
- A Popover or a Menu opens from an element that acts as a button, never from text, an icon or a link. A Menu holds actions, never a value the page keeps: that is a Listbox or a SelectField. A SplitButton is a group of two sibling buttons, never a button inside another. A Tooltip shows on hover after a delay and on keyboard focus at once, stays while the pointer moves onto it, and closes on Escape before anything around it (WCAG 1.4.13). It holds plain text that nothing else needs to reach, since touch never shows it.
- A component that operates the controls of its parts from its own keys, such as Combobox and the remove buttons of its chips, takes them out of the order of the Tab key with a prop of the part, such as `skipDismissInTabOrder` of Chip, so that Tab leaves it in one press.
- Components respect `prefers-reduced-motion` and `forced-colors`.

### Text

- Text a component renders on its own comes from a prop (`<key>Label`, or `get<Key>Label` for text with a value), then from `labels.<component>.<key>` in the configuration. A label with a value is a function in the configuration too, such as `labels.combobox.create(query)`.
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
- A `dot` prop of Badge: free `leading` and `trailing` content covers a dot on either side and any other mark, which a prop would add one by one.
- A counter prop or a slot for the label hint: a counter is one use of the label hint, and slotted text lives outside the shadow root, where `aria-describedby` of the control cannot reach it.
- An `outline` variant of Badge: a border is a token of `solid` and `subtle`, zero in the library, which a brand turns on alongside the tint.
