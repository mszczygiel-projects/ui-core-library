# Parsed fields

NumberField, DateField and DateTimeField keep the text a user types, in their locale, apart from the canonical value the form submits. This guide holds what to keep in mind when you change them. [Decision 06](../decisions/06-component-api.md#forms) holds the rules, and [the components guide](components.md) the general steps.

## Where the code goes

- Locale parsing, calendar arithmetic, numeric stepping and constraint validation go into `shared`.
- Input events, selection, masks and form integration stay in each rendering package.
- `configureUiCore({ locale })` provides the application default. Server rendering and the first hydration render use the same explicit configuration, and the browser language is adopted afterwards.

## Each implementation

- **React** uses `useParsedField` for the draft text and a named hidden input for the canonical form data. Its visible input owns focus and validity, and `ref.current.value` is the display text. The accepted value of a controlled parent owns the hidden entry.
- **Web components** use `TextControl` with serialization and state callbacks, so that `ElementInternals` stores the canonical data and restores the draft with its locale.

## The masks of DateField and DateTimeField

- DateField attaches IMask directly to the input. `prepareDateText` changes the ISO ordering without correcting calendar parts, and `parseDateText` and `validateDate` decide validity.
- DateTimeField uses the same mask adapters with `dateTimeMaskOptions`. Its one input adds a 24-hour time after the locale's date; shared parses and validates the complete local value. Its dialog retains the calendar and adds a time control and a Done button.
- The pinned IMask package has a declaration-only pnpm patch that adds `.js` to relative type imports for NodeNext. Without it, the upstream declarations lose their types under the repository's module resolution. No runtime file is patched. Check the patch again when you update IMask.
- IMask handles undo and redo without native input events. The package adapters observe its keyboard and `beforeinput` results, then synchronize the canonical data once.
- Composition waits until it commits, and avoids a second notification when the browser sends a final input event.
- A read-only control detaches the mask, so that its history cannot bypass the native editing restrictions.

## The calendar of DateField

DateField opens a Calendar of its own package in its popup and renders it only while it is open, so each opening starts from the value or today. The field stops the events of the calendar and reports a pick as its own edit.

A web component that nests another cannot wait for its render with `componentOnReady()`, which the custom elements build lacks. Look for the rendered part over a few animation frames instead.

## Tests

- Cover controlled rejection, partial-value echoes, reset cancellation, restored text, fieldset exclusion, locale changes during editing and native keyboard submission.
- Validate the current text synchronously, before a form can submit it.
- A programmatic change never emits a value event.
