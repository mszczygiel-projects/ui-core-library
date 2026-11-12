# Styles

## Decision

### What component CSS reads and writes

- Component CSS reads only the Components layer, the focus-ring roles and the motion primitives. It writes no raw value apart from keywords and zero.
- A component declares only private custom properties, `--_*`. It sets them from tokens, switches them by state, and never declares a token of the library.
- **The tokens are the styling API.** A consumer sets them on `:root` for values that no mode changes, or on a selector that matches the components. There are no other hooks.

### Each implementation

- Each implementation has its own stylesheet per component, because a shadow root and BEM classes need different selectors.
- The tokens share the values. The contracts compare the computed styles of both implementations, so their appearance cannot drift apart unnoticed.
- **Web components**:
  - Styles live in a `.css` file per component, inside a shadow root.
  - Parts are exposed as `::part(<name>)`, named like the layers of the Figma component.
  - States that authors may style are custom states, `:state(<name>)`.
- **React**:
  - BEM classes with the `ui-` prefix, such as `ui-text-field__label` and `ui-text-field--small`. Their elements are the parts of the web component.
  - Rules live in the layer `components.ui-core`, so they beat Tailwind's preflight and lose to its utilities. The stylesheet declares the order of the layers of the tokens ([02](02-design-tokens.md)).
  - The package ships one `styles.css`, and no module imports CSS.

### Families of components

- Components that share a surface share one stylesheet in `src/internal` of each package, such as `action.css` for Button, IconButton and LinkButton, `field.css` for TextField, PasswordField, SearchField, NumberField, DateField and TextareaField, `choice.css` for CheckboxField, RadioField and SwitchField, `listbox.css` for the list of Listbox and of the popups of SelectField and Combobox, the stylesheets of Button for the halves of SplitButton, `overlay.css` for the panels of Dialog and Drawer, and `floating.css` for the arrow of Popover and Tooltip: their variants, sizes, states and focus ring. Each component adds a stylesheet for its own parts. A family also shares its anatomy and, in the web components, the controller of its form value. Field actions may occupy either logical side and reuse `control/*`; no number/date token family duplicates that surface.
- The shared rules take their states from classes as well as from native pseudo-classes, so that an element without a native disabled state, such as a link, uses them too.
- The border of an action and of a field lies inside the box, drawn by a pseudo-element, so that an action and a field of the same size are equally tall and a border token changes no height. Figma draws it the same way, with the stroke left out of the layout.

### Layout and browsers

- Values that change with the screen come from Sizes tokens. A layout that must change uses a media query at the breakpoint of `tokens.json` (`64rem`).
- A component whose layout follows its own width, such as Breadcrumbs collapsing its trail or Pagination giving its pages way to the status, uses a container query on its root at a breakpoint of `tokens.json`, never a media query or a prop. A container query cannot read a custom property, so it names the value of the token, such as `40rem` for `breakpoint/sm`.
- Logical properties only, so components follow right-to-left text.
- A popup, such as the list of SelectField or Combobox, the panel of Popover or the bubble of Tooltip, opens in the top layer as `popover="manual"`, and its component closes it on Escape, on a press outside and when the focus leaves. One controller per package, `internal/popup.ts` and `internal/use-popup.ts`, places it with `@floating-ui/dom` in fixed position: on the side its component asks for, or the opposite one when the window has no room, shifted to stay in the window and no taller than the room in it. The popup of a field starts at the start edge of the field and is at least as wide; Popover and Tooltip are centred on their trigger, and their optional arrow points at its middle. A Menu lines up with the start or the end edge of its trigger, as its `align` asks. Menu has its own Components tokens, `menu/*`, which alias those of listbox, so that a theme can restyle menus without changing lists.
- A modal, such as Dialog or Drawer, is a native `<dialog>` opened with `showModal()`: the top layer, an inert page and the return of the focus come from the browser, with no portal, z-index or focus trap. Its component locks the scroll of the page through `shared`, adds the width of the scrollbar to the padding of the page, and enters with a transition from `@starting-style`.
- Supported browsers are Baseline Widely available. A newer feature needs a fallback and a decision.
- Decided newer features:

  | Feature                 | Where                                                                              | Fallback                                                                                                                   |
  | ----------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
  | `resize`                | the textarea of TextareaField                                                      | the textarea keeps the height of its tokens, and `resize="auto"` still grows, measured by script                           |
  | Popover API             | the popup of the list of SelectField and Combobox                                  | the popup opens in fixed position without the top layer, where a modal dialog or an ancestor with a transform can cover it |
  | `@starting-style`       | the panels and the backdrop of Dialog and Drawer                                   | the modal opens without its transition                                                                                     |
  | `:dir()`                | the direction a side Drawer slides in from                                         | the panel slides in from the physical side of its left-to-right placement; it still rests at the logical edge              |
  | ARIA element reflection | `ariaDescribedByElements` from Tooltip to its trigger, which crosses a shadow root | the trigger has no description; the bubble still shows its text                                                            |
  | `hidden="until-found"`  | the closed panel of AccordionItem, which find in page and a text fragment open     | the panel is plainly hidden: find in page skips its content, which stays in the page and in the server HTML                |

  Each use in CSS carries a `stylelint-disable-next-line plugin/use-baseline` comment that names its fallback, and each use in script a comment that names it.

### Enforcement

Stylelint checks components with local rules in `tools/lint-rules`, which read `tokens.json`:

- token names and their layer;
- private aliases;
- raw values;
- the breakpoint of media queries, and the breakpoints of container queries.

The standard rules check logical properties and Baseline. The CSS of the Storybook site may use raw values, but its token names are checked.

## Why

When the tokens are the only API, a consumer's change reaches every component, and the library never undoes it. The lint rules turn "no hardcoded values" from a review habit into a failing check.

## Rejected

- A copy of the surface in each component of a family: the copies drift apart, and the contracts would compare each of them with the tokens separately.

- One shared stylesheet for both implementations: different selectors and a build step to translate them, for little gain.
- CSS anchor positioning for popups: Baseline only since 2026, so it would need the script as a fallback for years.
- A popup positioned inside its field: an ancestor that clips its content cuts it, and a modal dialog covers it.
- `popover="auto"` for the popup of a field: it closes other popups and races the press on the trigger that opens it.
- Visual tests as the only guard of parity: they compare a story with its own past, not one implementation with the other.
