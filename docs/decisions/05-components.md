# Components

## Decision

### Two native implementations, one specification

- Every component is implemented twice: as a Stencil web component and as a React component. Neither wraps or imports the other.
- `packages/core` holds what both implementations share. Neither duplicates it.
- **A specification per component**, in `src/<name>/<name>.spec.ts`, holds:
  - the props types and the arrays of allowed values;
  - the defaults and the label keys;
  - the names of its parts, slots and events;
  - its category and status (`planned`, `in-progress` or `done`);
  - the node of its Figma component set.
- Both implementations, the contracts and the stories import these types and values. A variant added in the specification is a type error until both implementations handle it.
- **Pure functions**, for example the fallback of an invalid enum value (`one-of`), dates, numbers, pagination and text matching. A module arrives with its first consumer.
- Each implementation keeps its rendering, its CSS, its framework mechanics and its form integration: `ElementInternals` in Stencil, native controls in React.

### Rules for `core`

- No rendering, DOM, CSS, Stencil or React. The module boundaries enforce the last two.
- No module reads the clock, the time zone, the language or random numbers. They arrive as arguments, and a lint rule forbids the usual ways of reading them.
- Calendar dates are ISO strings, counted in whole days without `Date` objects.
- State that must be unique on a page lives under `globalThis[Symbol.for('ui-core.<name>')]`.
- Every module has a subpath export, and the package declares `"sideEffects": false`.
- The public declarations are snapshotted in `packages/core/api/`, and `pnpm core:check` fails when they change.

### Web components

- Stencil 4, the current stable line. Stencil 5 replaces it once it is stable, before 1.0.0.
- One subpath per component defines its tag, and the root defines them all.
- Components are client-side only: no server rendering or hydration.

### React

- React 19, with `react` and `react-dom` as peer dependencies.
- One root export and one stylesheet, `styles.css`, joined from the stylesheet of each component.
- Components are safe for server rendering. They read no browser state while rendering, and their ids come from `useId`. Each component's tests render it on the server and hydrate it without a warning, because consumers render React on the server, as Next.js does.
- A module with state, effects, refs or handlers starts with `'use client'`.

### Configuration

- `configureUiCore({ labels, loaderVariant, locale })`, from `@mszczygiel-projects/ui-core-foundations/config`, configures every component on the page.
- Its state lives under `globalThis[Symbol.for('ui-core.config')]` and holds only what the application set. Each copy of a package merges that over its own defaults.
- Components subscribe to changes: Stencil through its state, React through `useSyncExternalStore`.

## Why

Two native implementations keep each framework idiomatic: forms, refs and server rendering in React, and the platform in web components. The cost is drift between them. Sharing types and data makes the compiler stop drift in the API, and the shared contract stops drift in behaviour.

## Rejected

- React wrappers around the web components: weaker server rendering, controlled inputs and forms in React.
- Sharing CSS between the implementations: a shadow root and BEM classes need different selectors, while the tokens already share the values.
- Comparing two separate sets of declarations with a custom checker: the compiler does it for free when both import one type.
