# Figma

## Decision

### Files and safety

- [Core] Foundations (`Xxn0guDvAfyIqEKB6kADE9`) holds the variables and styles. [Core] Icons (`lRdwn99eZTt6gCFeqc2Seh`) holds the icons. [Core] UI Library (`BzqkruN7r8mwWfFReznc83`) holds the components.
- The three files are refactored in place, never replaced. Experiments run on trial files in the team project.
- **Write protocol**: read the current state and dependencies, list the exact operations with before and after values, write them, and compare a control read with the plan.
- The approval of a step covers this protocol. Nothing is deleted before its bindings point elsewhere.
- The owner publishes the libraries and exports the variables with the Luckino plugin.

### Styles and documentation pages

- Text styles are the `ui-text-*` typography classes plus the Control styles.
- Effect styles are the shadows of code. There are no paint styles.
- The Foundations documentation pages are generated from `pages.json` and the live variables, rebuilt by the project skill `ui-core-figma`, and never edited by hand.

### Component sets

- **Names**: as in code. Properties have the names and values of the props.
- **Layers**: part layers carry the names of the parts.
- **Design-only properties**: `interaction` (`rest`, `active`, `focus`), for TextField `valueState` (`empty`, `filled`), for Badge `content` (`label`, `icon-label`, `icon`), for Notification the boolean property `description`, for RadioField `checked` (`false`, `true`) and `state`, which its RadioGroup sets in code, for Listbox `content` (`options`, `groups`, `empty`), for Dialog the boolean properties `hasDescription` and `hasFooter`, for FileInputField the extra `interaction` value `dragover` and `valueState` (`empty`, `preview`, `list`), since files dragged over its zone and the layout of its value are states of the browser and the value, for Breadcrumbs `collapsed` (`false`, `true`) and for Pagination `layout` (`wide`, `narrow`), which preview a container narrower than a breakpoint. Each previews a layout or a state that code derives from the browser or the content. Any other needs a decision.
- **Nested sets**: a component that adds a part to another, such as PasswordField, SelectField or Combobox to TextField, holds an exposed instance of it named `field`, whose properties carry the shared props. The specification names it in `design.nested`, and the added part is a private component such as `.FieldAction`.
- NumberField owns only the `controls: none | inline` variant axis and uses two `.FieldAction` instances. DateField is one public component, whose only variant axis is the `open` preview of its calendar. The trailing icon of its `field` is the calendar button, and `showTrailingIcon` of that field stands for `hideCalendarButton`, since a property of a component cannot drive one of a nested instance. Both inherit appearance, disabled, interaction and valueState from `field`. Guidelines distinguish own options from those of the nested specification. Locale, constraints and label callbacks remain code-only; partial and invalid input are text examples, not new preview properties.
- **Private parts**: a control that a field draws, such as the box of CheckboxField, is a private set such as `.Checkbox`, whose variants follow the axes of the field. The field holds an instance of it, and its own properties drive the layers it adds, since a property cannot reach a layer inside a nested instance. The parts of a list are private sets too: `.ListboxOption`, with the design-only `highlighted` of the keyboard and the pointer, `.ListboxGroupLabel`, `.ListboxMessage`, `.ListboxCreate` and `.ListboxPanel`, which Listbox and the popups of SelectField and Combobox hold. The steps of a navigation are private sets too: `.BreadcrumbsItem` with `type` (`link`, `current`, `ellipsis`), `.BreadcrumbsSeparator`, and `.PaginationItem` with `type` (`page`, `ellipsis`) and the axes `current` and `disabled`, so that `interaction` keeps only the design-only states. A part that is a public component, such as a chip of Combobox or the jump field of Pagination, is an instance of its set.
- **Boolean properties**: a boolean prop that shows or hides a part, such as `dismissible` of Chip, may be a boolean property instead of a variant, with the name of the prop.
- **Bindings**: only the Components layer and the Foundations styles. The one exception is the focus-ring roles for the keyboard outline.
- **Page**: each component page holds a generated legend and the component set.

### Code Connect

- Every public component has a `.figma.ts` template next to each implementation. Both sets are checked by `pnpm figma:check` without a token, and React is the default publishing target.
- Snippets omit defaults, false booleans and empty optional text. Design-only properties never become props.
- The owner publishes after a dry run, and agents publish only in a step approved for publishing.

### Guidelines for Figma's agent

- `pnpm guidelines:build` writes the guidelines of the three libraries into `tools/guidelines/dist/`. The owner uploads each set in its file with Library › Manage guidelines. Figma has no API for it.
- They are generated, never written by hand:
  - the overview and one file per component for [Core] UI Library, from the specifications and the sections Usage, Variants & tone, Sizes & density and States of the component pages;
  - colours, typography, spacing and modes for [Core] Foundations, from `tokens.json`;
  - the icons for [Core] Icons, from `icon-names.txt`.
- They speak to an agent that designs: the property names and values of the component sets, the variables to bind and the styles to use. The `design` field of a specification says which props the component set has as variants, which only code has, and which properties only preview a design.
- Figma reads at most 200 KB per library, and the tests keep each set below it. A step that changes a specification, a component page, the tokens or the icons rebuilds the guidelines, and the owner uploads them again.

### Figma's AI features

| Feature                             | Use                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------- |
| MCP server with Code Connect        | Yes. Agents in consumer projects get the real components instead of generated markup. |
| Guidelines on the published library | Yes, in all three libraries, generated by `tools/guidelines`.                         |
| Code sources                        | Later. Needs published packages and access to the beta.                               |
| Code layers, Specs                  | Not in the library. Consumer projects may use them for prototypes and briefs.         |
| Centralized design systems          | Watched until it leaves preview.                                                      |

## Why

Designers, developers and agents should see one name, one set of properties and one snippet per framework. Writing to shared files needs a protocol, because a broken binding fails silently.

## Rejected

- A snapshot of each component set in the repository: high upkeep, and the control read already catches drift.
- Specs as component documentation: Storybook stays the single source.
