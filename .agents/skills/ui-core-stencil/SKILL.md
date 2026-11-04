---
name: ui-core-stencil
description: Use when writing or changing a web component of UI Core Library in packages/web-components - Stencil decorators, props from the shared specification, ElementInternals and form callbacks, the build and its finishing script, the Custom Elements Manifest, and the tests of the package.
---

# Web components with Stencil

`docs/decisions/05-components.md`, `06-component-api.md` and `07-styles.md` hold the rules. This is the checklist and the pitfalls the first components met.

## Writing a component

- `src/<name>/<name>.tsx` holds one `@Component({ tag: 'ui-<name>', styleUrl: '<name>.css', shadow: true })` class, `Ui<Name>`, which `implements <Name>Props` from `@mszczygiel-projects/ui-core-shared/<name>`. A control adds `shadow: { delegatesFocus: true }`, and a form control `formAssociated: true`.
- End the file with `type _DeclaresEveryProp = Pick<Ui<Name>, keyof <Name>Props>;`: `implements` alone accepts a class that leaves out an optional prop.
- Props are `@Prop()` fields typed with the types of the specification and initialized with literal defaults, such as `= 'medium'`. The manifest shows the initializer as written, and the contract checks it against the specification. Render through `oneOf(value, options.<prop>.options, options.<prop>.default)`, since a removed attribute leaves `null`.
- Reflect only `name`, `disabled`, `readonly` and `open`, with `@Prop({ reflect: true })`. `readOnly` uses `attribute: 'readonly'`.
- `HTMLElement` already owns `inputMode`, `enterKeyHint`, `spellcheck` and `ariaLabel`, so no prop may use those names. Follow the attribute that the page writes on the host with `followAttribute` from `src/internal`, and pass it to the inner control.
- Read the configuration with `followConfig` in `connectedCallback` into a `@State()`, and stop following in `disconnectedCallback`.
- Name custom events with `@Event({ eventName: 'ui-<name>' }) name!: EventEmitter<Detail>` on one line: the lint rule wants inline decorators. Inside a component, the imported `Event` decorator shadows the DOM type, so write `globalThis.Event`.
- Stencil's JSX has no element type of its own; `src/internal/jsx.d.ts` names `VNode`. Type `render(): VNode`.
- Track optional slots with `hasAssignedContent` in an `onSlotchange` handler, and hide the empty wrapper.
- Content that a page indexes, such as the body of a panel, goes through a slot, so it is in the HTML of the page before any script runs. A prop holds only a short name or description, and every link of navigation renders as `<a href>` ([05](../../../docs/decisions/05-components.md)).

## Forms

- `@AttachInternals() internals!: ElementInternals`. The form callbacks are plain methods: `formAssociatedCallback`, `formDisabledCallback`, `formResetCallback` and `formStateRestoreCallback`.
- Keep the value that `formDisabledCallback` receives as it is. The browser computes it from the own `disabled` attribute and the fieldset, and calls it only when it changes.
- Stencil renders in a later animation frame, after the element joins its form. A value given with `setFormValue(string)` takes its name from the `name` attribute, which Stencil has not written yet, so give a `FormData` with the named entry. Until the first render, compute validity with a detached input that has the same constraints.
- The synchronous API of a native control (`form`, `validity`, `checkValidity()` and the like) are class members. Stencil types an element from its props and methods only, so add them to the global `HTMLUi<Name>Element` interface with `FormAssociated` from `src/internal/form-associated.ts`. The rule `stencil/own-methods-must-be-private` needs a disable comment with its reason on each public method.

## Styles

- `<name>.css` beside the component. `:host([hidden]) { display: none; }` whenever `:host` sets `display`.
- `:host(:has(...))` is dropped silently. Style the host by a custom state that the component sets in `internals.states`.
- A token that resolves to a bare `0` makes a `calc()` that holds it invalid without a warning.
- Forced colours paint every border, a transparent one included: draw a gap as a side without a border.

## The build

- `pnpm nx run web-components:build` runs `stencil build`, which compiles with `tsconfig.lib.json` and its own TypeScript, then `scripts/finish-build.ts`. The script writes the root module and fixes the declarations for Node.js.
- The runtime is built into the package (`externalRuntime: false`) with `hydratedFlag: null`. The shared runtime would add a `hydrated` class to every host.
- `src/components.d.ts` is written by Stencil and committed: the first build of a fresh clone reads it.
- A new component adds its subpath to `exports` and its row to the README.

## Tests of the package

- `src/<name>/<name>.test.ts` imports `../../dist/components/ui-<name>.js` and runs in Chromium. Await `nextRender()` from `src/internal/test-utils.ts` after a change.
- Test what only the web component does: the attributes of its host, attributes and properties, the form callbacks and the members Stencil does not type. What both implementations share belongs in `testing/contracts`.
