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
  - Rules live in the layer `components.ui-core`, so they beat Tailwind's preflight and lose to its utilities.
  - The package ships one `styles.css`, and no module imports CSS.

### Families of components

- Components that share a surface share one stylesheet in `src/internal` of each package, such as `action.css` for Button, IconButton and LinkButton, `field.css` for TextField, PasswordField, SearchField and TextareaField, `choice.css` for CheckboxField, RadioField and SwitchField, and `listbox.css` for the list of Listbox and of the popup of SelectField: their variants, sizes, states and focus ring. Each component adds a stylesheet for its own parts. A family also shares its anatomy and, in the web components, the controller of its form value.
- The shared rules take their states from classes as well as from native pseudo-classes, so that an element without a native disabled state, such as a link, uses them too.

### Layout and browsers

- Values that change with the screen come from Sizes tokens. A layout that must change uses a media query at the breakpoint of `tokens.json` (`64rem`).
- Logical properties only, so components follow right-to-left text.
- A popup, such as the list of SelectField, opens in the top layer as `popover="manual"`, and its component closes it on Escape, on a press outside and when the focus leaves. `@floating-ui/dom` places it in fixed position, below its field or above it when the window has no room below, at least as wide as the field and no taller than the room in the window.
- Supported browsers are Baseline Widely available. A newer feature needs a fallback and a decision.
- Decided newer features:

  | Feature     | Where                                | Fallback                                                                                                                   |
  | ----------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
  | `resize`    | the textarea of TextareaField        | the textarea keeps the height of its tokens, and `resize="auto"` still grows, measured by script                           |
  | Popover API | the popup of the list of SelectField | the popup opens in fixed position without the top layer, where a modal dialog or an ancestor with a transform can cover it |

  Each use carries a `stylelint-disable-next-line plugin/use-baseline` comment that names its fallback.

### Enforcement

Stylelint checks components with local rules in `tools/lint-rules`, which read `tokens.json`:

- token names and their layer;
- private aliases;
- raw values;
- the breakpoint.

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
