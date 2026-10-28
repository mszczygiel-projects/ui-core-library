# Components

## Decision

### Two native implementations, one specification

- Every component is implemented twice: as a Stencil web component and as a React component. Neither wraps or imports the other.
- `packages/shared` holds what both implementations share. Neither duplicates it.
- **A specification per component**, in `src/components/<name>.ts` and the subpath `./<name>`, holds:
  - the props both implementations share, as an interface, and the arrays of allowed values with their defaults;
  - the label keys and the summary sentence;
  - the names of its parts, slots, events and stories;
  - its category and status (`planned`, `in-progress` or `done`);
  - the node of its Figma component set, and how that set exposes the props: boolean variants, boolean properties, props only code has, properties that only preview a design, and the component set whose instance it nests;
  - the exceptions to the conventions, with their reasons.
- Both implementations, the contracts, the stories and the status page import these types and values. The props of React extend the shared interface, and each web component checks that it declares every prop of it, so a prop that the specification adds, renames or retypes is a type error until the web component follows. A new allowed value reaches both APIs and the controls of the stories at once, and the contract checks how each implementation renders it.
- **Pure functions**, in `src/utils/`, for example the fallback of an invalid enum value (`one-of`), dates, numbers, pagination and text matching. A module arrives with its first consumer.
- **One generator** creates a component: `pnpm component:new` in `tools/generators` writes the specification, both implementations with their tests, the contract, the stories, the page and the Code Connect templates, and registers them. The skeleton passes the quality gate as it is and marks with `TODO(component)` what the component decides; a `done` component may keep no marker.
- Each implementation keeps its rendering, its CSS, its framework mechanics and its form integration: `ElementInternals` in Stencil, native controls in React.

### Rules for `shared`

- No rendering, DOM, CSS, Stencil or React. The module boundaries enforce the last two.
- No module reads the clock, the time zone, the language or random numbers. They arrive as arguments, and a lint rule forbids the usual ways of reading them.
- Calendar dates are ISO strings, counted in whole days without `Date` objects.
- State that must be unique on a page lives under `globalThis[Symbol.for('ui-core.<name>')]`.
- Every module has a subpath export, and the package declares `"sideEffects": false`.
- The public declarations are a file snapshot in `packages/shared/api/`, which `pnpm shared:snapshot` rewrites after an intended change.
- The package knows no browser types. A type that names a DOM event takes it as a parameter, such as `TextFieldValueChangeDetail<Event>`.

### Web components

- Stencil 4, the current stable line. Stencil 5 replaces it once it is stable, before 1.0.0.
- `dist-custom-elements` writes one module per component, which defines its tag. The root defines them all, and `custom-elements.json` describes them.
- The other packages of the library stay imports. Stencil's runtime is built into the package, because the shared runtime of `@stencil/core` ignores the build options and would add a `hydrated` class to every host.
- Stencil compiles the components with its own TypeScript, and `tsc` checks them with the repository's. Relative imports keep their `.ts` extension, which `rewriteRelativeImportExtensions` rewrites.
- `src/components.d.ts`, which Stencil writes, is committed, since the first build reads it.
- Stencil types an element from its props alone, so a component adds the rest of its public API, such as the form API, to the type of its element. A script finishes the build: it writes the root module, gives the declarations the extensions that Node.js resolves and links each component's declarations to its source.
- Components render on the client only: no server rendering or hydration.

### React

- React 19, with `react` and `react-dom` as peer dependencies.
- One root export and one stylesheet, `styles.css`, joined from the stylesheet of each component.
- Components are safe for server rendering. They read no browser state while rendering, and their ids come from `useId`. Each component's tests render it on the server and hydrate it without a warning, because consumers render React on the server, as Next.js does.
- A module with state, effects, refs or handlers starts with `'use client'`.

### Configuration

- `configureUiCore({ labels, loaderVariant })`, from `@mszczygiel-projects/ui-core-foundations/config`, configures every component on the page. `locale` joins it with the first component that formats a date or a number.
- Its state lives under `globalThis[Symbol.for('ui-core.config')]` and holds only what the application set. Each copy of a package merges that over its own defaults.
- Components subscribe to changes: Stencil through its state, React through `useSyncExternalStore`.

## Why

Two native implementations keep each framework idiomatic: forms, refs and server rendering in React, and the platform in web components. The cost is drift between them. Sharing types and data makes the compiler stop drift in the API, and the shared contract stops drift in behaviour.

## Rejected

- React wrappers around the web components: weaker server rendering, controlled inputs and forms in React.
- Sharing CSS between the implementations: a shadow root and BEM classes need different selectors, while the tokens already share the values.
- Copying an existing component as the start of a new one: it carries over decisions that do not apply and drifts from the conventions; the generator starts each from the same structure.
- Comparing two separate sets of declarations with a custom checker: the compiler does it for free when both import one type.
