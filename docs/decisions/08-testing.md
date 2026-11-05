# Testing

## Decision

### One home per test

| Layer         | Where                        | What it covers                                                                                     |
| ------------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| Unit tests    | next to the code, in Node.js | tokens, icons, CLIs, `shared`, lint rules                                                          |
| Package tests | each component package       | what only one framework does: React refs, server rendering and hydration, web component attributes |
| Contracts     | `testing/contracts`          | one behaviour contract per component, run unchanged against both implementations                   |
| Story tests   | `apps/storybook`             | every story in Light and Dark, with axe violations as errors                                       |
| Visual tests  | Chromatic, before 1.0.0      | regressions of each story against its own baseline                                                 |
| Manual review | by hand, in each step        | VoiceOver for each new interaction pattern, and the look against Figma                             |

### Contracts

- A contract holds no branch per framework. Mount adapters only translate props, events and lifecycle.
- A contract covers, where they apply:
  - roles and names, read from Chromium's accessibility tree;
  - the keys of the component's pattern and its events;
  - disabled state, also from a fieldset;
  - form value, reset, restore and validity;
  - labels rendered from a pseudo-language;
  - right-to-left arrow keys;
  - defaults and fallbacks;
  - computed appearance compared between the implementations.
- Contracts import the built packages through their exports.

### Tools and rules

- Browser tests run in Vitest Browser Mode with Playwright and Chromium.
- Type agreement between the implementations needs no test: both import the specification's types ([05](05-components.md)). One test checks that both frameworks export exactly the stories that the specification names.
- A new check fails once on a deliberate defect before it is trusted.
- Coverage is reported, not enforced.
- `pnpm verify` runs everything except the visual tests and the manual review.

## Why

Each kind of defect has one place where it is caught. The contract makes "both implementations behave the same" a test, not a promise.

## Rejected

- Separate test suites per framework for shared behaviour: they drift like the code they test.
- A coverage threshold: it rewards tests that assert little.
