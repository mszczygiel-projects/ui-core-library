---
name: ui-core-testing
description: Use when writing or debugging the browser behaviour contracts, package browser tests and Storybook accessibility tests of UI Core Library, in Vitest Browser Mode with Chromium.
---

# Browser tests

`docs/decisions/08-testing.md` holds the layers of tests.

## Running

- Use Node.js 24 and the Chromium of the catalog's Playwright.
- `pnpm nx run contracts:test` builds both component packages and runs every contract. `pnpm nx run storybook:test` runs the site's Node tests and every story in Light and Dark. Direct Vitest runs assume the builds exist.

## Contracts

- A contract is `specs/<name>.contract.ts` in `testing/contracts`. It is a function that registers its cases for a `Mount`, typed with the props of the specification plus what the harness translates, such as icons as flags.
- `harness/<name>.tsx` maps content, icons and events for each framework. `runners/web-components.test.ts` and `runners/react.test.tsx` pass them in. A harness never implements behaviour.
- The web component harness waits two animation frames after every change, since Stencil renders in the next one.
- Check roles and names with `mounted.accessibleNode()`, which reads Chromium's accessibility tree. Locators and axe miss what `ElementInternals` sets.
- Measure layout with `offsetWidth` and `offsetHeight`. The bounding box of an animated element depends on the moment it is measured.
- Emulate preferences with `commands.emulateMedia({ reducedMotion, forcedColors })`. The setup resets them, and the configuration, after each test.
- Render labels from `pseudoLabels` to show that every text comes from the configuration.
- Read expected values from the token manifest instead of writing them into a test.
- For form controls, inspect the host's validity and its owning form, use real keyboard input and `FormData`, and check visible state apart from the native input state.
- `appearance()` compares computed styles, which keeps the CSS of both implementations alike.

## Proving a check

Make each new check fail once on a deliberate defect in a component:

1. Rebuild the package.
2. Require the expected assertion failure, never just a nonzero exit status.
3. Restore the source.
4. Record the defect and the failure in the pull request.
