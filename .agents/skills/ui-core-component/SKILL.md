---
name: ui-core-component
description: Use when proposing, building or finishing a component step of UI Core Library - the order of the work from the specification through Figma, tokens, Stencil, React, the contract, stories, the page and Code Connect to the Definition of Done and the pull request.
---

# A component step

A component step is a step, so the skill `ui-core-step` applies. This skill adds the component checklist. `CONTRIBUTING.md` holds the Definition of Done.

## 1. Read

- The component set in [Core] UI Library, read only: its variants, properties, layers, bindings and description, and its instances in other components (skill `ui-core-figma`).
- The roles it could alias, in `packages/foundations/token-names.txt`, and the Components tokens it has already.
- The WAI-ARIA pattern of the component, its keys, and whether it is a form control.

## 2. Propose, in Polish, and wait

The proposal names, each with a recommendation and its alternatives:

- **The specification**: props, allowed values, defaults, label keys, parts, slots, events and stories, with every exception to the conventions of decision 06.
- **Tokens**: those to create in the Components layer, compared with the roles, with their states.
- **Appearance and Figma**: the expected appearance and behaviour, and the changes to the component set.
- **Shared effects**: the effects on shared tokens and other components.
- **Shared logic and labels**: what goes into `packages/shared`, and the labels it adds to `configureUiCore`.
- **Tests**: the regressions its contract will cover, and whether the owner checks it with VoiceOver.

## 3. The specification first

Write `packages/shared/src/components/<name>.ts` with `defineComponent` and the shared props interface, with status `in-progress`. Run `pnpm shared:snapshot`. The web component then fails to compile until it declares every prop, and the React props follow by construction.

## 4. Figma and the tokens

- Follow the write protocol (skill `ui-core-figma`).
- The owner publishes and exports. Then run `pnpm nx run foundations:build` and `pnpm tokens:snapshot` for intended new names (skill `ui-core-tokens`).
- The description of the component set is the summary of the specification.

## 5. Code

- The web component (skill `ui-core-stencil`) and the React component (skill `ui-core-react`), each with the tests of its package.
- The behaviour contract and its harness in `testing/contracts` (skill `ui-core-testing`). Every new check fails once on a deliberate defect.
- Code Connect templates next to both implementations. They omit code defaults, false booleans and empty optional text. Run `pnpm figma:check`. Publishing is separate.
- Icons that a component imports go into `packages/icons/required-icons.txt`.

## 6. Documentation

- The page and the two story files (skill `ui-core-docs`), and JSDoc on the whole public API.
- The README of each package lists the component.
- Fill in the `design` field of the specification from the component set, run `pnpm guidelines:build`, and ask the owner to upload the guidelines of [Core] UI Library.

## 7. Finish

- Set the status in the specification to `done` once every item of the Definition of Done holds, owner checks included.
- `pnpm verify` passes before every commit.
- The pull request copies the Definition of Done from `CONTRIBUTING.md`, ticks each item and names what waits for the owner.
