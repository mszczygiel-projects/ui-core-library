# Documentation

## Decision

### One place per question

| Question                                    | Place                                                                                      |
| ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| What is this, and how do I start?           | `README.md`: what the library holds, a quick start and where to read on                    |
| How do I use the library?                   | Storybook: getting started, theming and branding, tokens, icons, the CLIs, every component |
| How is the library developed?               | `CONTRIBUTING.md`: the way of working and the Definition of Done, nothing else             |
| How do I do a task in the repository?       | `docs/guides/`: one guide per area, with its steps, commands and troubleshooting           |
| Why is it like this?                        | `docs/decisions/`                                                                          |
| What does an agent need beyond all of this? | `AGENTS.md` and the project skills, which link to the rest                                 |

- A new instruction goes into the guide of its area, or a new guide, never into `CONTRIBUTING.md`. The process changes rarely and the instructions often, so they stay apart.
- A guide says how, and links to the decision that says why. It never repeats a reason.
- Consumer documentation never sends readers to the decisions or the guides. Package READMEs are short and link to Storybook.
- **Decisions are living documents**, one per area, each about a page long, describing the current state. A change edits the decision in the same pull request, and git keeps the history.

### Storybook

- One site on React and Vite, in `apps/storybook`, renders both frameworks. It imports the built packages through their exports.
- **Addons**: `addon-docs` for MDX pages, `addon-a11y` with axe as errors, `addon-vitest` for story tests, and `addon-mcp` for agents on port 6006. Telemetry and onboarding are off.
- **Toolbars**: theme, surface, density, language, direction and framework. Their items come from `tokens.json`.
- **Foundations pages** are built from `tokens.json` and the map `apps/storybook/src/foundations/pages.json`, which the Figma documentation pages share.
- The site loads Inter from Fontsource. The packages ship no fonts.

### Component pages and stories

- One MDX page per component, `Components/<Category>/<Name>`. Its sections, in order:
  1. Overview
  2. Usage
  3. Anatomy
  4. Variants & tone, showing the `Variants` story
  5. Sizes & density
  6. States
  7. Content & labels
  8. Behaviour
  9. Accessibility, with the pattern and its keys
  10. Surfaces & themes
  11. API, one tab per framework
  12. Tokens, generated
  13. Implementation notes

  A section that does not apply says so.

- Categories: Actions, Inputs, Selection, Feedback, Navigation, Content and Overlays. Content holds the components that arrange content on a page, such as Accordion. A status page lists every component from the specifications in `shared`.
- **Stories**: `Playground`, `Variants` (when the component has a `variant`), `OnSurfaces` and `With<Content>` as needed. Both frameworks use the same names.
- **JSDoc** covers the whole public API. The one-sentence summary is the same in JSDoc, on the page and in the Figma description.

## Why

Mixing the reasons for decisions into the guides made both hard to read. A consumer needs a path through the library, a developer needs a way of working, and decisions need one place to be looked up.

## Rejected

- Immutable decision records amended by later records: the current rule has to be pieced together from several files.
- Consumer guides as Markdown in the repository: they would duplicate Storybook.
- Every instruction in `CONTRIBUTING.md`: the file mixed the process with how-to steps, commands and troubleshooting, and grew with every step.
