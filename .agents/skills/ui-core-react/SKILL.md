---
name: ui-core-react
description: Use when writing or changing a React component of UI Core Library in packages/react - props from the shared specification, client components, refs and attributes passed on, BEM styles joined into styles.css, the configuration hook, server rendering with hydration, and the tests of the package.
---

# React components

`docs/decisions/05-components.md`, `06-component-api.md` and `07-styles.md` hold the rules. The vendor skill `vercel-composition-patterns` covers composition in general; where it disagrees with the decisions, the decisions win.

## Writing a component

- `src/<name>/<Name>.tsx` exports the component and `<Name>Props`. The props extend the props of the specification in `@mszczygiel-projects/ui-core-shared/<name>` and the attributes of the root or native element, minus the keys of the specification. Export both from `src/index.ts`, with the types of the specification.
- A module that uses hooks, state, refs or handlers starts with `'use client'`. Reading the configuration with `useUiCoreConfig` is a hook.
- `ref` is a prop and reaches the native control, or the root element. Spread the remaining attributes after the props of the component, so that an attribute of the page, such as `aria-label`, wins.
- Classes follow BEM with the prefix `ui-`: `ui-<name>__<part>` for the parts of the specification, `ui-<name>--<modifier>`. Join them with `classNames`.
- Render enumerated props through `oneOf` with the options of the specification.
- Text comes from props or `useUiCoreConfig().labels`. The rule `ui-core/no-literal-text` rejects anything else.
- Read no browser global, clock or language while rendering. Ids come from `useId`.
- Helpers such as `rendersContent`, `classNames` and `setRef` live in `src/internal`.

## Styles

- `<name>.css` beside the component. `scripts/build-styles.ts` joins it into `dist/styles.css` inside `components.ui-core`, and no module imports CSS.
- Keyframes are global in a page, so give them a prefix, such as `ui-loader-spin`.

## Tests of the package

- `src/<name>/<Name>.test.tsx` runs in Chromium and covers:
  - the ref and the attributes passed on;
  - controlled and uncontrolled values;
  - rendering with `renderToString` and hydrating with `hydrateRoot` while `console.error` and `onRecoverableError` stay silent.
- What both implementations share belongs in `testing/contracts`.
- `react-dom` is a peer dependency that no module imports; the lint configuration says so to `@nx/dependency-checks`.
